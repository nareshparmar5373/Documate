import React from 'react';
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';

export const PrivacyNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>100% Client-Side Private • Files never leave your browser</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            Local & Privacy-Guaranteed Processing
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
              Zero Server Upload
            </span>
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
            Your documents, PAN cards, identity records, and photos are processed directly inside your browser using WebAssembly and client-side JavaScript. They are never uploaded to any remote server or stored permanently.
          </p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> End-to-end local
            </span>
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" /> No logging of personal data
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
