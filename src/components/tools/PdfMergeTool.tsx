import React, { useState } from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { mergePdfs } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

interface PdfFileItem {
  id: string;
  file: File;
}

export const PdfMergeTool: React.FC = () => {
  const [pdfList, setPdfList] = useState<PdfFileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    totalPages: number;
    size: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (valid.length === 0) {
      setError('Please select valid PDF files.');
      return;
    }
    setError(null);
    const newItems = valid.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
    }));
    setPdfList((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setPdfList((prev) => prev.filter((x) => x.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pdfList.length) return;
    const copy = [...pdfList];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setPdfList(copy);
  };

  const totalInputBytes = pdfList.reduce((acc, curr) => acc + curr.file.size, 0);

  const handleMerge = async () => {
    if (pdfList.length < 2) {
      setError('Please add at least 2 PDF documents to merge.');
      return;
    }
    setProcessing(true);
    setProgress(15);
    setError(null);

    try {
      const buffers = await Promise.all(pdfList.map((item) => item.file.arrayBuffer()));
      const res = await mergePdfs(buffers, (p) => setProgress(p));
      const filename = `DocuMate_Merged_${pdfList.length}_Docs.pdf`;

      setResult({
        blob: res.blob,
        totalPages: res.totalPages,
        size: res.size,
        filename,
      });

      saveHistoryItem({
        toolId: 'pdf-merge',
        toolName: 'PDF Merge',
        fileName: `${pdfList.length} PDFs merged`,
        originalSize: totalInputBytes,
        outputSize: res.size,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Merging failed. One of the PDFs might be password protected or corrupted.';
      setError(msg);
      logError('pdf-merge', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfList([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title="PDFs Merged Successfully!"
        originalSize={totalInputBytes}
        outputSize={result.size}
        downloadFilename={result.filename}
        extraDetails={`Successfully combined ${pdfList.length} documents into 1 file containing ${result.totalPages} total pages.`}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {pdfList.length === 0 ? (
        <DropZone
          onFilesSelected={handleFiles}
          accept="application/pdf"
          multiple
          title="Upload Multiple PDFs to Merge"
          description="Drag and drop 2 or more PDF documents to combine into a single file"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Documents to Merge ({pdfList.length})
              </h4>
              <p className="text-xs text-slate-500">
                Total Size: {formatBytes(totalInputBytes)} • Reorder to change document sequence
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => document.getElementById('addMorePdfInput')?.click()}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold"
              >
                + Add More PDFs
              </button>
              <input
                id="addMorePdfInput"
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {pdfList.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <h5 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                      {item.file.name}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => moveItem(index, 'up')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={index === pdfList.length - 1}
                    onClick={() => moveItem(index, 'down')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleMerge}
            disabled={processing || pdfList.length < 2}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Merging PDFs ({progress}%)...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                Merge {pdfList.length} PDFs into One
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
