import React, { useState } from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Download,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { managePdfPages } from '../../utils/pdfEngine';
import { downloadBlob, formatBytes } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';
import { pdfjsLib } from '../../utils/pdfWorker';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnailUrl: string;
}

export const PdfRotateAndManageTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    pageCount: number;
    size: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (files: File[]) => {
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) {
      setError('Please upload a valid PDF file.');
      return;
    }

    try {
      setError(null);
      setFile(pdf);
      setLoadingThumbnails(true);
      setPages([]);
      setResult(null);

      const buffer = await pdf.arrayBuffer();
      const loading = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const doc = await loading.promise;
      const count = doc.numPages;

      const loadedPages: PageItem[] = [];

      for (let i = 1; i <= count; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
          loadedPages.push({
            id: Math.random().toString(36).substring(2, 9),
            originalIndex: i - 1,
            rotation: 0,
            thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
          });
        }
      }

      setPages(loadedPages);
    } catch (err) {
      setError('Could not render PDF pages. The file may be protected or damaged.');
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) {
      setError('A PDF must have at least one page.');
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const duplicatePage = (index: number) => {
    const source = pages[index];
    const clone: PageItem = {
      ...source,
      id: Math.random().toString(36).substring(2, 9),
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, clone);
    setPages(updated);
  };

  const movePage = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const copy = [...pages];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setPages(copy);
  };

  const handleApplyChanges = async () => {
    if (!file || pages.length === 0) return;
    setProcessing(true);
    setProgress(15);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const pageOrder = pages.map((p) => p.originalIndex);
      const rotations: Record<number, number> = {};
      pages.forEach((p) => {
        if (p.rotation !== 0) {
          rotations[p.originalIndex] = p.rotation;
        }
      });

      const res = await managePdfPages(buffer, { pageOrder, rotations }, (p) => setProgress(p));
      const filename = `DocuMate_${file.name.replace(/\.pdf$/i, '')}_reordered.pdf`;

      setResult({
        blob: res.blob,
        pageCount: res.pageCount,
        size: res.size,
        filename,
      });

      saveHistoryItem({
        toolId: 'pdf-rotate',
        toolName: 'PDF Page Manager',
        fileName: file.name,
        originalSize: file.size,
        outputSize: res.size,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply page modifications.';
      setError(msg);
      logError('pdf-rotate', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title="PDF Updated Successfully!"
        originalSize={file?.size}
        outputSize={result.size}
        downloadFilename={result.filename}
        extraDetails={`Final document has ${result.pageCount} pages after reordering, rotations and page deletions.`}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFilesSelected={handleFile}
          accept="application/pdf"
          title="Upload PDF to Manage Pages"
          description="Rotate pages, reorder visually, delete unwanted pages, or duplicate pages"
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
                  {formatBytes(file.size)} • Active Pages: {pages.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate All 90°
              </button>
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Change PDF
              </button>
            </div>
          </div>

          {loadingThumbnails ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Generating visual page thumbnails...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs flex flex-col group"
                >
                  <div className="relative aspect-3/4 p-2 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${idx + 1}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-200"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                      Page {idx + 1}
                    </span>
                    {p.rotation !== 0 && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px]">
                        +{p.rotation}°
                      </span>
                    )}
                  </div>

                  <div className="p-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => rotatePage(p.id)}
                        className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => duplicatePage(idx)}
                        className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                        title="Duplicate Page"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => movePage(idx, 'up')}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 disabled:opacity-30"
                        title="Move Earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === pages.length - 1}
                        onClick={() => movePage(idx, 'down')}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 disabled:opacity-30"
                        title="Move Later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePage(p.id)}
                        className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleApplyChanges}
            disabled={processing || pages.length === 0}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes ({progress}%)...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Save & Download Reorganized PDF ({pages.length} Pages)
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
