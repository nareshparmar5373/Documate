import React, { useState } from 'react';
import { Lock, Unlock, FileText, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { protectPdf, unlockPdf } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

interface PdfProtectUnlockProps {
  initialMode?: 'protect' | 'unlock';
}

export const PdfProtectUnlockTool: React.FC<PdfProtectUnlockProps> = ({ initialMode = 'protect' }) => {
  const [mode, setMode] = useState<'protect' | 'unlock'>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    size: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (files: File[]) => {
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) {
      setError('Please select a valid PDF file.');
      return;
    }
    setError(null);
    setFile(pdf);
    setResult(null);
  };

  const handleAction = async () => {
    if (!file) return;

    if (mode === 'protect') {
      if (!password) {
        setError('Please enter a password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 4) {
        setError('Password should be at least 4 characters long.');
        return;
      }
    }

    setProcessing(true);
    setProgress(20);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();

      if (mode === 'protect') {
        const res = await protectPdf(buffer, password, (p) => setProgress(p));
        const filename = `DocuMate_${file.name.replace(/\.pdf$/i, '')}_protected.pdf`;
        setResult({ blob: res.blob, size: res.size, filename });

        saveHistoryItem({
          toolId: 'pdf-protect',
          toolName: 'PDF Password Protect',
          fileName: file.name,
          originalSize: file.size,
          outputSize: res.size,
          outputName: filename,
        });
      } else {
        const res = await unlockPdf(buffer, password || undefined, (p) => setProgress(p));
        const filename = `DocuMate_${file.name.replace(/\.pdf$/i, '')}_unlocked.pdf`;
        setResult({ blob: res.blob, size: res.size, filename });

        saveHistoryItem({
          toolId: 'pdf-unlock',
          toolName: 'PDF Unlock',
          fileName: file.name,
          originalSize: file.size,
          outputSize: res.size,
          outputName: filename,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : mode === 'unlock'
          ? 'Incorrect password or unable to decrypt this document.'
          : 'Failed to protect PDF.';
      setError(msg);
      logError(mode === 'protect' ? 'pdf-protect' : 'pdf-unlock', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title={mode === 'protect' ? 'PDF Encrypted & Protected!' : 'PDF Unlocked Successfully!'}
        originalSize={file?.size}
        outputSize={result.size}
        downloadFilename={result.filename}
        extraDetails={
          mode === 'protect'
            ? 'AES encryption applied. Store your password in a safe place.'
            : 'Security restrictions removed. You can now freely edit, print and view without a password.'
        }
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode switch */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setMode('protect');
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'protect'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Password Protect PDF
          </button>
          <button
            onClick={() => {
              setMode('unlock');
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'unlock'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            Unlock PDF (Authorized)
          </button>
        </div>
      </div>

      {!file ? (
        <DropZone
          onFilesSelected={handleFile}
          accept="application/pdf"
          title={mode === 'protect' ? 'Upload PDF to Protect with Password' : 'Upload Protected PDF to Unlock'}
          description={
            mode === 'protect'
              ? 'Encrypt your document so only authorized people with password can open it'
              : 'Remove password restrictions if you own or are authorized to unlock this document'
          }
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

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-4 max-w-md mx-auto">
            {mode === 'protect' ? (
              <>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Set Document Password
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-indigo-600" />
                  Unlock Document
                </h4>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Authorization Notice: Only unlock files for which you possess legitimate authority or the existing password.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Current Document Password (if prompted)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleAction}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'protect' ? 'Encrypting PDF...' : 'Decrypting PDF...'} ({progress}%)
                </>
              ) : (
                <>
                  {mode === 'protect' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {mode === 'protect' ? 'Encrypt & Protect PDF' : 'Remove Password & Save'}
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
