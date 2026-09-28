import React, { useState } from 'react';
import { FileCode2, FileText, Download, AlertCircle, Info, Sparkles } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { convertPdfToDocx } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

export const PdfToWordTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    textLength: number;
    pagesProcessed: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (files: File[]) => {
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) {
      setError('Please upload a valid PDF document.');
      return;
    }
    setError(null);
    setFile(pdf);
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const res = await convertPdfToDocx(buffer, (p) => setProgress(p));
      const filename = `${file.name.replace(/\.pdf$/i, '')}_converted.docx`;

      setResult({
        blob: res.blob,
        textLength: res.textLength,
        pagesProcessed: res.pagesProcessed,
        filename,
      });

      saveHistoryItem({
        toolId: 'pdf-to-word',
        toolName: 'PDF to Word (DOCX)',
        fileName: file.name,
        originalSize: file.size,
        outputSize: res.blob.size,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert PDF to DOCX.';
      setError(msg);
      logError('pdf-to-word', err instanceof Error ? err : new Error(msg));
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
        title="Word Document (DOCX) Ready!"
        originalSize={file?.size}
        outputSize={result.blob.size}
        downloadFilename={result.filename}
        extraDetails={`Processed ${result.pagesProcessed} pages • Extracted ~${result.textLength} characters into structured Word paragraphs.`}
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
          title="Upload PDF to Convert to Word (.docx)"
          description="Transform PDF paragraphs, headings, and structure into an editable Microsoft Word document"
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
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
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
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Layout Notice:</strong> Text-based PDFs convert directly into editable paragraphs and headings in standard Microsoft Word format (.docx). Highly complex graphic layers or non-searchable scanned images will have their text extracted where available.
              </span>
            </div>

            <button
              onClick={handleConvert}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Extracting & Building DOCX ({progress}%)...
                </>
              ) : (
                <>
                  <FileCode2 className="w-4 h-4" />
                  Convert to Word (DOCX)
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
