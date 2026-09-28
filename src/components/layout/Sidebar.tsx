import React from 'react';
import {
  LayoutGrid,
  FileText,
  Image as ImageIcon,
  ScanLine,
  ScrollText,
  Calculator,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ToolCategory } from '../../types';

interface SidebarProps {
  activeCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  activeView: 'tools' | 'history' | 'admin';
  onSelectView: (view: 'tools' | 'history' | 'admin') => void;
  historyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeCategory,
  onSelectCategory,
  activeView,
  onSelectView,
  historyCount,
}) => {
  const categories = [
    { id: 'all', label: 'All Tools (22)', icon: LayoutGrid },
    { id: 'pdf', label: 'PDF Suite', icon: FileText, badge: '10' },
    { id: 'image', label: 'Image Tools', icon: ImageIcon, badge: '5' },
    { id: 'scanner', label: 'ID & Scanner', icon: ScanLine, badge: '3' },
    { id: 'letters', label: 'Letters & Formats', icon: ScrollText, badge: '2' },
    { id: 'utility', label: 'EMI & Utilities', icon: Calculator, badge: '1' },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="mb-6">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
          Document Suites
        </div>
        <nav className="space-y-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeView === 'tools' && activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectView('tools');
                  onSelectCategory(cat.id as ToolCategory);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span>{cat.label}</span>
                </div>
                {cat.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-4 mb-6">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
          Management
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => onSelectView('history')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeView === 'history'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <span>History</span>
            </div>
            {historyCount > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeView === 'history' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeView === 'admin'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Control</span>
          </button>
        </nav>
      </div>

      {/* Security badge at bottom of sidebar */}
      <div className="mt-auto p-3.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-slate-100 to-emerald-500/10 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-emerald-950/40 border border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">100% In-Browser</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          High-performance WebAssembly processing. No cloud uploads needed.
        </p>
      </div>
    </aside>
  );
};
