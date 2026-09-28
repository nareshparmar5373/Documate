import React from 'react';
import {
  FileImage,
  FileText,
  Minimize2,
  Layers,
  Split,
  RotateCw,
  Stamp,
  Lock,
  Unlock,
  FileCode2,
  ImageDown,
  Scaling,
  Crop,
  SlidersHorizontal,
  UserSquare2,
  CreditCard,
  ScanLine,
  ScrollText,
  PenTool,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  LockKeyhole,
} from 'lucide-react';
import { ToolDefinition, ToolCategory, ToolId } from '../../types';
import { TOOLS_CONFIG } from '../../utils/toolsData';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface LandingDashboardProps {
  onSelectTool: (id: ToolId) => void;
  activeCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  searchQuery: string;
}

// Icon mapper
const ICON_MAP: Record<string, React.ElementType> = {
  FileImage,
  FileText,
  Minimize2,
  Layers,
  Split,
  RotateCw,
  Stamp,
  Lock,
  Unlock,
  FileCode2,
  ImageDown,
  Scaling,
  Crop,
  SlidersHorizontal,
  UserSquare2,
  CreditCard,
  ScanLine,
  ScrollText,
  PenTool,
  Calculator,
};

export const LandingDashboard: React.FC<LandingDashboardProps> = ({
  onSelectTool,
  activeCategory,
  onSelectCategory,
  searchQuery,
}) => {
  // Filter tools based on search query and category
  const filteredTools = TOOLS_CONFIG.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularTools = TOOLS_CONFIG.filter((t) => t.featured);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-14 shadow-2xl border border-indigo-800/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            22+ Browser-Side Document & PDF Utilities
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
            All Your PDF & Document Tools <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">
              in One Place
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-2xl">
            Convert, compress, resize, scan and manage your documents quickly and securely. 100% private in-browser processing with zero permanent storage.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onSelectTool('image-to-pdf')}
              className="px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 active:scale-98 transition-all flex items-center gap-2"
            >
              Start Now
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('all-tools-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition-colors"
            >
              Explore All 22 Tools
            </button>

            {/* Mobile App / APK Install Button */}
            <PWAInstallButton variant="hero" />
          </div>
        </div>

        {/* Hero background decorative shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
      </section>

      {/* Mobile App & APK Banner */}
      <PWAInstallButton variant="banner" />

      {/* Popular Tools Grid */}
      {!searchQuery && activeCategory === 'all' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Popular Quick Tools
              </h2>
              <p className="text-xs text-slate-500">Most commonly used document & identity workflows</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularTools.slice(0, 8).map((tool) => {
              const Icon = ICON_MAP[tool.icon] || FileText;
              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className="group relative p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      {tool.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {tool.shortDesc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Pills & All Tools */}
      <section id="all-tools-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Explore Complete Utility Suite'}
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredTools.length} of {TOOLS_CONFIG.length} available tools
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {[
              { id: 'all', label: 'All (22)' },
              { id: 'pdf', label: 'PDF Tools' },
              { id: 'image', label: 'Image Tools' },
              { id: 'scanner', label: 'Scanner & ID' },
              { id: 'letters', label: 'Letters' },
              { id: 'utility', label: 'Calculators' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id as ToolCategory)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeCategory === tab.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center bg-white/50 dark:bg-slate-900/50">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No matching tools found
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Try searching for "PDF", "Compress", "Passport", "Watermark", or reset filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const Icon = ICON_MAP[tool.icon] || FileText;
              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className="group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:scale-105 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      {tool.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tool.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {tool.shortDesc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize text-[11px] font-medium">{tool.category}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center">
                      Launch <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Privacy Section Callout */}
      <section className="rounded-3xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20 p-8 sm:p-10 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Zero-Storage Privacy Promise
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Your documents are processed securely. Sensitive files are not permanently stored by default.
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            All PDF rendering, image conversions, compression algorithms, and passport photo formatting execute locally inside your browser sandbox. Whether uploading a PAN card, bank statement, or confidential legal document, your files never leave your computer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">100% Client-Side</div>
              <div className="text-slate-500">Processed in browser memory via WebAssembly</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">Zero Retention</div>
              <div className="text-slate-500">Auto-cleared upon tab closure or session end</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">Strict Portal Specs</div>
              <div className="text-slate-500">Optimized for &lt;50KB/100KB/200KB compliance</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
