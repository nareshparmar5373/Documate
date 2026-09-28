import React, { useState } from 'react';
import { Split, FileText, Download, Archive, AlertCircle, Sparkles } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { splitPdf, createZipFromBlobs } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';
import { pdfjsLib } from '../../utils/pdfWorker';

export const PdfSplitTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [mode, setMode] = useState<'range' | 'each'>('range');
  const [rangeInput, setRangeInput] = useState<string>('1-2, 3-4');

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ name: string; blob: Blob; pageCount: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (files: File[]) => {
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) {
      setError('Please select a valid PDF file.');
      return;
    }

    try {
      setError(null);
      setFile(pdf);
      setResults([]);

      const buffer = await pdf.arrayBuffer();
      const loading = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const doc = await loading.promise;
      setTotalPages(doc.numPages);
      if (doc.numPages > 2) {
        setRangeInput(`1-${Math.ceil(doc.numPages / 2)}, ${Math.ceil(doc.numPages / 2) + 1}-${doc.numPages}`);
      } else {
        setRangeInput('1, 2');
      }
    } catch {
      setError('Could not read PDF. File may be encrypted or corrupted.');
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const splitFiles = await splitPdf(buffer, mode, rangeInput, (p) => setProgress(p));
      setResults(splitFiles);

      const totalSize = splitFiles.reduce((a, b) => a + b.blob.size, 0);
      saveHistoryItem({
        toolId: 'pdf-split',
        toolName: 'PDF Split',
        fileName: file.name,
        originalSize: file.size,
        outputSize: totalSize,
        outputName: `${file.name.replace(/\.pdf$/i, '')}_split_${splitFiles.length}_files.zip`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to split PDF.';
      setError(msg);
      logError('pdf-split', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (results.length === 0 || !file) return;
    const zipBlob = await createZipFromBlobs(results);
    downloadBlob(zipBlob, `${file.name.replace(/\.pdf$/i, '')}_split_documents.zip`);
  };

  const handleReset = () => {
    setFile(null);
    setTotalPages(0);
    setResults([]);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFilesSelected={handleFile}
          accept="application/pdf"
          title="Upload PDF to Split"
          description="Extract page ranges (e.g. 1-3, 4-7) or split every page into separate documents"
        />
      ) : (
        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Choose different PDF
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Split Mode
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setMode('range')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  mode === 'range'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Custom Page Ranges
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extract specific groups like 1-3, 4-7, 8-10.
                </p>
              </div>

              <div
                onClick={() => setMode('each')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  mode === 'each'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Split Every Single Page
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extract each of the {totalPages} pages into individual 1-page PDFs.
                </p>
              </div>
            </div>

            {mode === 'range' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Page Ranges (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1-2, 3-5, 6"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Example: "1-3, 4-7" will generate 2 PDF files. Max pages in document: {totalPages}.
                </span>
              </div>
            )}

            <button
              onClick={handleSplit}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Splitting PDF ({progress}%)...
                </>
              ) : (
                <>
                  <Split className="w-4 h-4" />
                  Split PDF
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Generated Files ({results.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Total Output: {formatBytes(results.reduce((a, b) => a + b.blob.size, 0))}
                  </p>
                </div>
                <button
                  onClick={handleDownloadAllZip}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Download All as ZIP
                </button>
              </div>

              <div className="space-y-2">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div>
                        <h5 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(item.blob.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadBlob(item.blob, item.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
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
