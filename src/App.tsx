/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Footer } from './components/layout/Footer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { LandingDashboard } from './components/views/LandingDashboard';
import { HistoryView } from './components/views/HistoryView';
import { AdminView } from './components/views/AdminView';

// Individual Tools
import { ImageToPdfTool } from './components/tools/ImageToPdfTool';
import { PdfToJpgTool } from './components/tools/PdfToJpgTool';
import { PdfCompressTool } from './components/tools/PdfCompressTool';
import { PdfToWordTool } from './components/tools/PdfToWordTool';
import { PdfMergeTool } from './components/tools/PdfMergeTool';
import { PdfSplitTool } from './components/tools/PdfSplitTool';
import { PdfRotateAndManageTool } from './components/tools/PdfRotateAndManageTool';
import { PdfWatermarkTool } from './components/tools/PdfWatermarkTool';
import { PdfProtectUnlockTool } from './components/tools/PdfProtectUnlockTool';
import { ImageCompressTool } from './components/tools/ImageCompressTool';
import { ImageResizeTool } from './components/tools/ImageResizeTool';
import { PassportPhotoMaker } from './components/tools/PassportPhotoMaker';
import { PanCardScannerTool } from './components/tools/PanCardScannerTool';
import { DocumentScannerTool } from './components/tools/DocumentScannerTool';
import { PdfLetterFormatTool } from './components/tools/PdfLetterFormatTool';
import { EmiCalculatorTool } from './components/tools/EmiCalculatorTool';

import { ToolCategory, ToolId } from './types';
import { TOOLS_CONFIG } from './utils/toolsData';
import { getLocalHistory } from './utils/storage';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('documate_theme') === 'dark' ||
      (!localStorage.getItem('documate_theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [activeView, setActiveView] = useState<'tools' | 'history' | 'admin'>('tools');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('documate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('documate_theme', 'light');
    }
  }, [darkMode]);

  // Sync history count
  useEffect(() => {
    setHistoryCount(getLocalHistory().length);
    const interval = setInterval(() => {
      setHistoryCount(getLocalHistory().length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTool = (toolId: ToolId) => {
    setActiveTool(toolId);
    setActiveView('tools');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveTool(null);
    setActiveView('tools');
  };

  const activeToolDef = activeTool ? TOOLS_CONFIG.find((t) => t.id === activeTool) : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenHistory={() => {
          setActiveView('history');
          setActiveTool(null);
        }}
        onOpenAdmin={() => {
          setActiveView('admin');
          setActiveTool(null);
        }}
        onGoHome={handleBackToDashboard}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeTool) setActiveTool(null);
          setActiveView('tools');
        }}
        historyCount={historyCount}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setActiveTool(null);
            setActiveView('tools');
          }}
          activeView={activeView}
          onSelectView={(view) => {
            setActiveView(view);
            setActiveTool(null);
          }}
          historyCount={historyCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12">
          {activeView === 'history' ? (
            <HistoryView onOpenTool={(id) => handleSelectTool(id as ToolId)} />
          ) : activeView === 'admin' ? (
            <AdminView />
          ) : activeTool && activeToolDef ? (
            /* Dedicated Tool Execution Interface */
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Tool Header Breadcrumb */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <button
                    onClick={handleBackToDashboard}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to All Tools
                  </button>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                    {activeToolDef.category}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[200px]">
                    {activeToolDef.title}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% In-Browser Privacy</span>
                </div>
              </div>

              {/* Tool Title Banner */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeToolDef.title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {activeToolDef.description}
                </p>
              </div>

              {/* Tool Implementation Component */}
              <div className="pt-2">
                {activeTool === 'image-to-pdf' && <ImageToPdfTool />}
                {activeTool === 'pdf-to-jpg' && <PdfToJpgTool />}
                {activeTool === 'pdf-compress' && <PdfCompressTool />}
                {activeTool === 'pdf-to-word' && <PdfToWordTool />}
                {activeTool === 'pdf-merge' && <PdfMergeTool />}
                {activeTool === 'pdf-split' && <PdfSplitTool />}
                {activeTool === 'pdf-rotate' && <PdfRotateAndManageTool />}
                {activeTool === 'pdf-watermark' && <PdfWatermarkTool />}
                {activeTool === 'pdf-protect' && <PdfProtectUnlockTool initialMode="protect" />}
                {activeTool === 'pdf-unlock' && <PdfProtectUnlockTool initialMode="unlock" />}
                {activeTool === 'image-compress' && <ImageCompressTool />}
                {activeTool === 'target-file-size' && <ImageCompressTool initialTargetKb={50} />}
                {activeTool === 'image-resize' && <ImageResizeTool />}
                {activeTool === 'custom-image-size' && <ImageResizeTool customMode />}
                {activeTool === 'passport-photo' && <PassportPhotoMaker />}
                {activeTool === 'pan-card-scanner' && <PanCardScannerTool />}
                {activeTool === 'document-scanner' && <DocumentScannerTool />}
                {activeTool === 'pdf-letter-format' && <PdfLetterFormatTool />}
                {activeTool === 'letter-generator' && <PdfLetterFormatTool />}
                {activeTool === 'emi-calculator' && <EmiCalculatorTool />}
              </div>
            </div>
          ) : (
            /* Home Dashboard with All Tools & Search */
            <LandingDashboard
              onSelectTool={handleSelectTool}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              searchQuery={searchQuery}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveTool(null);
          setActiveView('tools');
        }}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setActiveTool(null);
        }}
        historyCount={historyCount}
      />

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveTool(null);
          setActiveView('tools');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => {
          setActiveView('admin');
          setActiveTool(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTool={(toolId) => {
          handleSelectTool(toolId as ToolId);
        }}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
