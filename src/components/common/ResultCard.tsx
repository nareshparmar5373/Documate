import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Download, CheckCircle, RotateCcw, Share2, FileText, ArrowRight } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface ResultCardProps {
  title?: string;
  originalSize?: number;
  outputSize: number;
  savedPercent?: number;
  downloadUrl?: string;
  downloadFilename: string;
  onDownload: () => void;
  onReset: () => void;
  previewUrl?: string;
  isImage?: boolean;
  extraDetails?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title = 'Document Ready!',
  originalSize,
  outputSize,
  savedPercent,
  downloadFilename,
  onDownload,
  onReset,
  previewUrl,
  isImage = false,
  extraDetails,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DocuMate Generated Document',
          text: `Download ${downloadFilename}`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
        <CheckCircle className="w-9 h-9" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 truncate max-w-md mx-auto">
        {downloadFilename}
      </p>

      {/* Comparison stats if sizes provided */}
      {originalSize !== undefined && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 mb-6 text-left border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Original</div>
            <div className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {formatBytes(originalSize)}
            </div>
          </div>
          <div className="border-x border-slate-200 dark:border-slate-700/60 px-2 sm:px-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Result</div>
            <div className="text-sm sm:text-base font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
              {formatBytes(outputSize)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Reduction</div>
            <div className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {savedPercent !== undefined ? `-${savedPercent}%` : 'Optimized'}
            </div>
          </div>
        </div>
      )}

      {extraDetails && (
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg p-2.5 mb-6 text-left">
          {extraDetails}
        </div>
      )}

      {/* Preview if provided */}
      {previewUrl && (
        <div className="mb-6 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center max-h-60 overflow-hidden">
          {isImage ? (
            <img src={previewUrl} alt="Result Preview" className="max-h-56 object-contain rounded-lg shadow-xs" />
          ) : (
            <div className="flex flex-col items-center py-6 text-slate-500">
              <FileText className="w-12 h-12 text-indigo-500 mb-2" />
              <span className="text-xs font-medium">Ready for download</span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onDownload}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all"
        >
          <Download className="w-4 h-4" />
          Download File
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Process Another</span>
        </button>
      </div>
    </div>
  );
};
