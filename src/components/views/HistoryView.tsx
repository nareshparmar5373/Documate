import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Download, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { HistoryItem } from '../../types';
import { getLocalHistory, deleteHistoryItem, clearHistory } from '../../utils/storage';
import { formatBytes, formatDate } from '../../utils/formatters';

interface HistoryViewProps {
  onOpenTool: (toolId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onOpenTool }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(getLocalHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteHistoryItem(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Clear all processing history from this browser?')) {
      clearHistory();
      setItems([]);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Local Processing History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Metadata recorded locally in your browser. Document contents are not permanently stored.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center bg-white/50 dark:bg-slate-900/50">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            No history yet
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Files you convert, compress, or scan will appear here for easy reference during your session.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const savedBytes = item.originalSize > item.outputSize ? item.originalSize - item.outputSize : 0;
            const savedPct = item.originalSize > 0 && savedBytes > 0
              ? Math.round((savedBytes / item.originalSize) * 100)
              : null;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.fileName}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {item.toolName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>{formatDate(item.timestamp)}</span>
                      {item.outputSize > 0 && (
                        <span>
                          Output: <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{formatBytes(item.outputSize)}</span>
                        </span>
                      )}
                      {savedPct !== null && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          (-{savedPct}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenTool(item.toolId)}
                    className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-xs font-semibold flex items-center gap-1"
                    title="Open Tool"
                  >
                    <span className="hidden sm:inline">Use Again</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
