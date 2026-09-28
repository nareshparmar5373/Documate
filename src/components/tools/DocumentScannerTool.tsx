import React, { useState, useRef } from 'react';
import {
  ScanLine,
  Camera,
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileDown,
  Layers,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { applyScanFilter, ScanFilter } from '../../utils/imageEngine';
import { convertImagesToPdf } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

interface ScannedPage {
  id: string;
  sourceFile: File;
  previewUrl: string;
  filter: ScanFilter;
  rotation: number;
}

export const DocumentScannerTool: React.FC = () => {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activeFilter, setActiveFilter] = useState<ScanFilter>('magic');
  const [exportType, setExportType] = useState<'pdf' | 'jpg'>('pdf');

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    pageCount: number;
    size: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      setError('Please provide valid image files.');
      return;
    }
    setError(null);
    const newItems: ScannedPage[] = valid.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      sourceFile: file,
      previewUrl: URL.createObjectURL(file),
      filter: activeFilter,
      rotation: 0,
    }));
    setPages((prev) => [...prev, ...newItems]);
  };

  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const removePage = (id: string) => {
    setPages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const movePage = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const copy = [...pages];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setPages(copy);
  };

  const applyFilterToAll = (f: ScanFilter) => {
    setActiveFilter(f);
    setPages((prev) => prev.map((p) => ({ ...p, filter: f })));
  };

  const handleExport = async () => {
    if (pages.length === 0) return;
    setProcessing(true);
    setProgress(15);
    setError(null);

    try {
      // 1. Process each page with its filter & rotation
      const processedFiles: File[] = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const filtered = await applyScanFilter(page.sourceFile, page.filter, page.rotation);
        const processedFile = new File(
          [filtered.blob],
          `scanned_page_${i + 1}.jpg`,
          { type: 'image/jpeg' }
        );
        processedFiles.push(processedFile);
        setProgress(Math.round(15 + ((i + 1) / pages.length) * 45));
      }

      // 2. Generate multi-page PDF
      const pdfRes = await convertImagesToPdf(
        processedFiles.map((f) => ({ file: f, rotation: 0 })),
        {
          pageSize: 'A4',
          orientation: 'portrait',
          margin: 'none',
          fit: 'fit',
          quality: 0.9,
        },
        (p) => setProgress(60 + Math.round(p * 0.4))
      );

      const filename = `DocuMate_Scanned_Document_${pages.length}_pages.pdf`;

      setResult({
        blob: pdfRes.blob,
        pageCount: pages.length,
        size: pdfRes.size,
        filename,
      });

      const totalOrig = pages.reduce((a, b) => a + b.sourceFile.size, 0);
      saveHistoryItem({
        toolId: 'document-scanner',
        toolName: 'Document Scanner',
        fileName: `${pages.length} Pages Scanned`,
        originalSize: totalOrig,
        outputSize: pdfRes.size,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export scanned document.';
      setError(msg);
      logError('document-scanner', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPages([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title="Scanned Document Ready!"
        outputSize={result.size}
        downloadFilename={result.filename}
        extraDetails={`Total Scanned Pages: ${result.pageCount} • Enhanced & Binarized with ${activeFilter.toUpperCase()} filter.`}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden inputs for adding pages */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
      />

      {pages.length === 0 ? (
        <DropZone
          onFilesSelected={handleFiles}
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple
          title="Mobile Document Scanner"
          description="Use your camera to capture physical paper documents or upload photos for auto-enhancement and multi-page PDF generation"
          allowCamera
        />
      ) : (
        <div className="space-y-6">
          {/* Header toolbar */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Scanned Pages Stack ({pages.length})
              </h4>
              <p className="text-xs text-slate-500">
                Enhance, reorder, or rotate before compiling into A4 PDF
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan Page (Camera)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Image
              </button>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Global Filter Mode:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'magic', label: 'Magic Enhance' },
                { id: 'bw', label: 'High B&W' },
                { id: 'grayscale', label: 'Grayscale' },
                { id: 'original', label: 'Original' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => applyFilterToAll(f.id as any)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-semibold ${
                    activeFilter === f.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs flex flex-col group"
              >
                <div className="relative aspect-3/4 p-2 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={p.previewUrl}
                    alt={`Page ${idx + 1}`}
                    style={{
                      transform: `rotate(${p.rotation}deg)`,
                      filter:
                        p.filter === 'bw'
                          ? 'contrast(200%) grayscale(100%)'
                          : p.filter === 'grayscale'
                          ? 'grayscale(100%)'
                          : p.filter === 'magic'
                          ? 'contrast(125%) saturate(120%)'
                          : 'none',
                    }}
                    className="max-h-full max-w-full object-contain shadow-xs transition-transform"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                    Page {idx + 1}
                  </span>
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] uppercase font-bold">
                    {p.filter}
                  </span>
                </div>

                <div className="p-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => rotatePage(p.id)}
                    className="p-1 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => movePage(idx, 'up')}
                      className="p-1 rounded-md text-slate-500 hover:text-indigo-600 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === pages.length - 1}
                      onClick={() => movePage(idx, 'down')}
                      className="p-1 rounded-md text-slate-500 hover:text-indigo-600 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removePage(p.id)}
                      className="p-1 rounded-md text-rose-500 hover:bg-rose-50"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={processing || pages.length === 0}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Compiling Multi-Page Document ({progress}%)...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Compile & Export {pages.length} Pages into PDF
              </>
            )}
          </button>
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
