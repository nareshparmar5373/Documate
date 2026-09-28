import React, { useState } from 'react';
import { FileStack, Shield, Heart, ExternalLink, X } from 'lucide-react';
import { ToolCategory } from '../../types';

interface FooterProps {
  onSelectCategory: (cat: ToolCategory) => void;
  onOpenAdmin: () => void;
  onOpenTool: (toolId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenAdmin, onOpenTool }) => {
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  const showPrivacyPolicy = () => {
    setModalContent({
      title: 'Privacy Policy & Zero-Log Architecture',
      content: `DocuMate operates strictly under a client-side first architecture. 
1. Zero Permanent Storage: Any document or image you load into DocuMate (including PAN cards, Passports, Aadhaar, identity documents, bank letters) is processed directly inside your device's browser memory (RAM) via client-side WebAssembly and JavaScript.
2. No Remote Telemetry of File Contents: Your file names, personal information, images, and text contents are never transmitted to external servers or indexed.
3. In-Browser Memory Clearance: Once you close the tab or clear your browser history, temporary blob objects are immediately garbage-collected by your browser engine.
4. Security Compliance: Safe for processing government portal submissions, job resumes, certificates, and financial calculations.`,
    });
  };

  const showTerms = () => {
    setModalContent({
      title: 'Terms of Use',
      content: `DocuMate provides browser utilities for PDF processing, image compression, formatting, and mathematical computations.
1. Self-Authorization: You must have lawful authorization or ownership of any document you compress, convert, watermark, or unlock.
2. No Legal or Certifying Advice: Template letters and calculators are provided for informational and administrative draft purposes. They do not constitute official legal certifications or accredited banking agreements.
3. Portal Requirements: Portal file size limits (e.g. <50KB for PAN cards or exam forms) are optimized with best-effort iterative compression. Users should verify preview quality prior to formal submission.`,
    });
  };

  const showContact = () => {
    setModalContent({
      title: 'Contact Support & Help Desk',
      content: `DocuMate Document Engineering Support:
- Technical Support: support@documate.local / nareshparmar5373@gmail.com
- Available Features: 22 client-side document and image utilities.
- Issue Reporting: Built-in Error Logger inside the Admin Panel keeps automated logs of failed conversions for troubleshooting.`,
    });
  };

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 pt-12 pb-16 lg:pb-12 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <FileStack className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">DocuMate</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
              All-in-one private PDF, image, document scanner and utility suite. Fast, private, and client-side by default.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Your documents are processed securely. Sensitive files are not permanently stored.</span>
            </div>
          </div>

          {/* PDF Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              PDF Tools
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onOpenTool('image-to-pdf')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Image to PDF
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pdf-to-jpg')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PDF to JPG
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pdf-compress')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PDF Compressor
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pdf-merge')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PDF Merge & Split
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pdf-to-word')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PDF to Word (DOCX)
                </button>
              </li>
            </ul>
          </div>

          {/* Image & ID Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Image & ID Tools
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onOpenTool('image-compress')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Image Compressor
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('passport-photo')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Passport Photo Maker
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pan-card-scanner')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PAN & ID Scanner
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('document-scanner')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Document Scanner
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('target-file-size')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Target File Size (KB)
                </button>
              </li>
            </ul>
          </div>

          {/* Utilities & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Utilities & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onOpenTool('emi-calculator')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  EMI Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pdf-letter-format')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Letter Templates
                </button>
              </li>
              <li>
                <button onClick={showPrivacyPolicy} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={showTerms} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={showContact} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} DocuMate. Browser-Powered PDF & Document Ecosystem.</p>
          <p className="flex items-center gap-1">
            Engineered with privacy, speed & precision
          </p>
        </div>
      </div>

      {/* Policy / Terms Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                {modalContent.title}
              </h3>
              <button
                onClick={() => setModalContent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto pr-2">
              {modalContent.content}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
