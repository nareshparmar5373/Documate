import React, { useState } from 'react';
import { LayoutGrid, FileText, Image as ImageIcon, ScanLine, Smartphone } from 'lucide-react';
import { ToolCategory } from '../../types';
import { PWAInstallModal } from '../common/PWAInstallModal';

interface MobileNavProps {
  activeCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  activeView: 'tools' | 'history' | 'admin';
  onSelectView: (view: 'tools' | 'history' | 'admin') => void;
  historyCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeCategory,
  onSelectCategory,
  activeView,
  onSelectView,
  historyCount,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            onSelectView('tools');
            onSelectCategory('all');
          }}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeView === 'tools' && activeCategory === 'all'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>All</span>
        </button>

        <button
          onClick={() => {
            onSelectView('tools');
            onSelectCategory('pdf');
          }}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeView === 'tools' && activeCategory === 'pdf'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </button>

        <button
          onClick={() => {
            onSelectView('tools');
            onSelectCategory('image');
          }}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeView === 'tools' && activeCategory === 'image'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Images</span>
        </button>

        <button
          onClick={() => {
            onSelectView('tools');
            onSelectCategory('scanner');
          }}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeView === 'tools' && activeCategory === 'scanner'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Scanner</span>
        </button>

        <button
          onClick={() => setModalOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl text-[11px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors"
        >
          <div className="relative">
            <Smartphone className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span>App/APK</span>
        </button>
      </nav>

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

