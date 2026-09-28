import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  X,
  Share2,
  Info,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleInstallClick = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DocuMate — PDF & Document Tools',
          text: 'Use DocuMate to compress, convert, and scan documents directly on your phone!',
          url: currentUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  DocuMate Mobile App & APK
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800">
                  Android & iOS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                फोन में ऐप की तरह चलाएं (बिना भारी APK डाउनलोड किए 1-क्लिक इंस्टॉल)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pwa'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              1-Click Direct Install (Recommended)
            </button>
            <button
              onClick={() => setActiveTab('apk')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'apk'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              APK Package Guide
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {activeTab === 'pwa' ? (
            <>
              {/* If browser supports beforeinstallprompt */}
              {isInstallable && !isInstalled && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-3">
                  <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                    <Download className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Instant Install Available
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      आपका ब्राउज़र 1-क्लिक डायरेक्ट ऐप इंस्टॉल सपोर्ट करता है। नीचे दिए गए बटन पर टैप करें।
                    </p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Install DocuMate App on Phone
                  </button>
                </div>
              )}

              {/* Already installed banner */}
              {isInstalled && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    App is already installed!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    DocuMate आपके डिवाइस की होम स्क्रीन पर मौजूद है। आप इसे सीधे खोल सकते हैं।
                  </p>
                </div>
              )}

              {/* Step-by-Step Android / Chrome Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Android फ़ोन पर ऐप कैसे इंस्टॉल करें? (Simple Steps)</span>
                </div>

                <div className="grid gap-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Chrome Browser में यह वेबसाइट खोलें
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Open DocuMate in Google Chrome on your Android mobile.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ऊपर दाईं तरफ 3 डॉट्स (⋮ Menu) पर टैप करें
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap the three dots (⋮) menu icon at top-right corner of Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        "Install app" या "Add to Home screen" (होम स्क्रीन पर जोड़ें) चुनें
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Select "Install app" or "Add to Home Screen" option in the list.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      ✓
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ऐप तुरंत फ़ोन में इंस्टॉल हो जाएगा!
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        The DocuMate app icon appears on your home screen and opens full-screen without browser bars.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* iPhone / iOS Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-500" />
                  <span>iPhone / iPad (iOS) Users:</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Safari ब्राउज़र में <strong>Share (शेयर)</strong> बटन दबाएं और <strong>"Add to Home Screen"</strong> पर टैप करें।
                </p>
              </div>

              {/* Advantages of PWA over ordinary APK */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Why this is better than downloading unknown APKs:
                </h5>
                <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span><strong>100% Safe:</strong> No virus risk, no "Unknown sources" warnings needed.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span><strong>Super Light:</strong> Takes only ~1.5 MB storage (vs 50+ MB APK).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span><strong>Always Updated:</strong> New document tools automatically update.</span>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            /* APK Developer / Packaging Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  APK Package Details
                </p>
                <p>
                  DocuMate एक पूर्णतः PWA-सक्षम (Progressive Web App) है। अगर आपको Google Play Store या सीधे sideload के लिए standalone <strong>.apk</strong> या <strong>.aab</strong> फ़ाइल चाहिए, तो आप PWABuilder (Google & Microsoft समर्थित टूल) से 1-क्लिक में APK बना सकते हैं।
                </p>
              </div>

              {/* Copy App Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  App URL (अपने फ़ोन पर खोलने या APK बनाने के लिए):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Share with phone"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Packaging Steps */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                  Generate Android APK using PWABuilder:
                </h5>
                <ol className="text-xs space-y-2 list-decimal list-inside text-slate-600 dark:text-slate-400">
                  <li>
                    कॉपी किए गए URL को{' '}
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 underline font-medium inline-flex items-center gap-0.5"
                    >
                      PWABuilder.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    पर पेस्ट करें।
                  </li>
                  <li>
                    <strong>"Start"</strong> पर क्लिक करें — यह हमारे PWA Manifest और Icons को तुरंत पहचान लेगा (100% Score)।
                  </li>
                  <li>
                    <strong>"Package for Android"</strong> चुनें और <strong>"Generate APK / AAB"</strong> पर क्लिक करें।
                  </li>
                  <li>
                    आपको डाउनलोड करने के लिए तैयार <strong>DocuMate.apk</strong> और Google Play ready पैकेज मिल जाएगा।
                  </li>
                </ol>
              </div>

              <div className="pt-2">
                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Open PWABuilder with this App URL
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share with Phone
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close / बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
