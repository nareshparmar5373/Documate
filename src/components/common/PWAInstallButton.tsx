import React, { useState } from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'hero';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already running inside standalone app, do not show install CTA in navbar
  if (isInstalled && variant === 'navbar') {
    return null;
  }

  if (variant === 'hero') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-sm border border-white/25 backdrop-blur-xs transition-all flex items-center gap-2 shadow-sm"
          title="Install on Android or iOS"
        >
          <Smartphone className="w-4 h-4 text-sky-300" />
          <span>Install Android App / APK</span>
        </button>

        <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-700/50 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">
                  Get DocuMate App on Your Mobile
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                  Android & APK
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                फोन में 1-क्लिक ऐप इंस्टॉल करें — बिना किसी थर्ड पार्टी APK डाउनलोड के सुरक्षित और तेज़।
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Install App / APK Guide
          </button>

          <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
      </>
    );
  }

  // Navbar variant
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/90 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 transition-all shadow-2xs"
        title="Download APK / Install Mobile App"
      >
        <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden xs:inline">App / APK</span>
        {isInstallable && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </button>

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
