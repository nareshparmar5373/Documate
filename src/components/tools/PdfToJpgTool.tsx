import React, { useState } from 'react';
import {
  Download,
  Archive,
  Eye,
  FileText,
  AlertCircle,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { convertPdfToJpg, createZipFromBlobs } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';
import { pdfjsLib } from '../../utils/pdfWorker';

interface ExtractedPage {
  pageNum: number;
  blob: Blob;
  dataUrl: string;
  size: number;
}

export const PdfToJpgTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selection, setSelection] = useState<'all' | 'first' | 'range'>('all');
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [quality, setQuality] = useState<number>(0.92);
  const [dpiScale, setDpiScale] = useState<number>(1.5); // 1.5x gives ~150-200 DPI crispness

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) {
      setError('Please upload a valid PDF document.');
      return;
    }

    try {
      setError(null);
      setFile(pdf);
      setExtractedPages([]);

      const buffer = await pdf.arrayBuffer();
      const loading = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const doc = await loading.promise;
      setTotalPages(doc.numPages);
      setRangeInput(`1-${Math.min(doc.numPages, 5)}`);
    } catch (err) {
      setError('Could not inspect PDF structure. The file might be corrupted or protected.');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(5);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const results = await convertPdfToJpg(
        buffer,
        {
          pageSelection: selection,
          pageRange: rangeInput,
          quality,
          dpiScale,
        },
        (p) => setProgress(p)
      );

      setExtractedPages(results);

      const totalSize = results.reduce((a, b) => a + b.size, 0);
      saveHistoryItem({
        toolId: 'pdf-to-jpg',
        toolName: 'PDF to JPG',
        fileName: file.name,
        originalSize: file.size,
        outputSize: totalSize,
        outputName: `${file.name.replace(/\.pdf$/i, '')}_extracted_${results.length}pages.zip`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert PDF pages.';
      setError(msg);
      logError('pdf-to-jpg', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const downloadAllZip = async () => {
    if (extractedPages.length === 0 || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    const zipBlob = await createZipFromBlobs(
      extractedPages.map((p) => ({
        name: `${baseName}_page_${p.pageNum}.jpg`,
        blob: p.blob,
      }))
    );
    downloadBlob(zipBlob, `${baseName}_images.zip`);
  };

  const resetAll = () => {
    setFile(null);
    setTotalPages(0);
    setExtractedPages([]);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFilesSelected={handleFileSelect}
          accept="application/pdf"
          title="Upload PDF to Extract Images"
          description="Convert each PDF page into a high-resolution JPG image"
        />
      ) : (
        <div className="space-y-6">
          {/* File details & options bar */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {formatBytes(file.size)} • Total {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                </p>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Choose different PDF
            </button>
          </div>

          {/* Configuration controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900">
            {/* Page selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Pages to Convert
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelection('all')}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium ${
                      selection === 'all'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Pages ({totalPages})
                  </button>
                  <button
                    onClick={() => setSelection('first')}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium ${
                      selection === 'first'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    First Page Only
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => setSelection('range')}
                    className={`w-full py-1.5 text-xs rounded-lg border font-medium mb-1.5 ${
                      selection === 'range'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Custom Page Range
                  </button>
                  {selection === 'range' && (
                    <input
                      type="text"
                      placeholder="e.g. 1-3, 5, 8-10"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Quality and DPI */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Resolution & DPI ({Math.round(dpiScale * 96)} DPI)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Standard', scale: 1.0 },
                  { label: 'High (150DPI)', scale: 1.5 },
                  { label: 'Ultra (300DPI)', scale: 2.0 },
                ].map((item) => (
                  <button
                    key={item.scale}
                    onClick={() => setDpiScale(item.scale)}
                    className={`py-1.5 text-xs rounded-lg border font-medium ${
                      dpiScale === item.scale
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>JPEG Quality:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Action button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={handleConvert}
                disabled={processing}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Converting ({progress}%)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Convert PDF to JPG
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results section */}
          {extractedPages.length > 0 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Extracted Pages ({extractedPages.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Total Output: {formatBytes(extractedPages.reduce((a, b) => a + b.size, 0))}
                  </p>
                </div>
                <button
                  onClick={downloadAllZip}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Download All as ZIP
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {extractedPages.map((page) => (
                  <div
                    key={page.pageNum}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs flex flex-col"
                  >
                    <div className="relative aspect-3/4 p-2 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNum}`}
                        className="max-h-full max-w-full object-contain shadow-xs rounded-sm"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                        Page {page.pageNum}
                      </span>
                    </div>

                    <div className="p-2.5 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-mono">{formatBytes(page.size)}</span>
                      <button
                        onClick={() =>
                          downloadBlob(
                            page.blob,
                            `${file.name.replace(/\.pdf$/i, '')}_page_${page.pageNum}.jpg`
                          )
                        }
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-xs flex items-center gap-1"
                        title="Download Page"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
