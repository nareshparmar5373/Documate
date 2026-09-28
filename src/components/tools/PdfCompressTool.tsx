import React, { useState } from 'react';
import { Minimize2, FileText, Sparkles, AlertCircle, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { compressPdf } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

export const PdfCompressTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'low' | 'medium' | 'high' | 'custom'>('medium');
  const [customFactor, setCustomFactor] = useState<number>(0.6);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (files: File[]) => {
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) {
      setError('Please upload a valid PDF file.');
      return;
    }
    setError(null);
    setFile(pdf);
    setResult(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(15);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const res = await compressPdf(buffer, level, customFactor, (p) => setProgress(p));
      const filename = `DocuMate_${file.name.replace(/\.pdf$/i, '')}_compressed.pdf`;

      setResult({
        blob: res.blob,
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        savedPercent: res.savedPercent,
        filename,
      });

      saveHistoryItem({
        toolId: 'pdf-compress',
        toolName: 'PDF Compressor',
        fileName: file.name,
        originalSize: res.originalSize,
        outputSize: res.compressedSize,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Compression failed. The PDF might already be maximally compressed.';
      setError(msg);
      logError('pdf-compress', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title="PDF Compressed Successfully!"
        originalSize={result.originalSize}
        outputSize={result.compressedSize}
        savedPercent={result.savedPercent}
        downloadFilename={result.filename}
        extraDetails={`Compression Mode: ${level.toUpperCase()} • Actual storage reduction achieved.`}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFilesSelected={handleFileSelect}
          accept="application/pdf"
          title="Upload PDF to Compress"
          description="Reduce PDF size while preserving readability and image clarity"
        />
      ) : (
        <div className="space-y-6">
          {/* File Card */}
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
                  Original Size: <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{formatBytes(file.size)}</span>
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

          {/* Options */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Select Compression Level
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'low',
                  label: 'Low Compression',
                  desc: 'Highest visual quality, light size reduction (~15-30% saved).',
                },
                {
                  id: 'medium',
                  label: 'Medium Compression',
                  desc: 'Balanced for web, email & general archiving (~40-60% saved).',
                },
                {
                  id: 'high',
                  label: 'High Compression',
                  desc: 'Maximum reduction for portal upload limits (~60-80% saved).',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setLevel(opt.id as typeof level)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    level === opt.id
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {opt.label}
                    </span>
                    {level === opt.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              Note: Actual compression savings depend on whether your PDF contains heavy high-resolution images or vector/text data. We never fake numbers or damage readability.
            </div>

            <button
              onClick={handleCompress}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Compressing PDF ({progress}%)...
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Compress PDF Now
                </>
              )}
            </button>
          </div>
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
