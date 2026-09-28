import React, { useState } from 'react';
import {
  UserSquare2,
  Download,
  AlertCircle,
  FileDown,
  Info,
  Layers,
  ZoomIn,
  Move,
  Printer,
  Sparkles,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { createPassportPhotos, PassportPhotoOptions } from '../../utils/imageEngine';
import { downloadBlob, formatBytes } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

export const PassportPhotoMaker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [options, setOptions] = useState<PassportPhotoOptions>({
    preset: '35x45mm',
    customWidthMm: 35,
    customHeightMm: 45,
    backgroundColor: 'white',
    copiesCount: 8,
    zoom: 1.15,
    offsetX: 0,
    offsetY: 0,
  });

  const [previewTab, setPreviewTab] = useState<'single' | 'sheet'>('sheet');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    singlePhotoBlob: Blob;
    singlePhotoUrl: string;
    a4SheetBlob: Blob;
    a4SheetUrl: string;
    a4PdfBlob: Blob;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (files: File[]) => {
    const img = files.find((f) => f.type.startsWith('image/'));
    if (!img) {
      setError('Please upload a valid face portrait photo (JPG, PNG).');
      return;
    }
    setError(null);
    setFile(img);
    setPreviewSrc(URL.createObjectURL(img));
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await createPassportPhotos(file, options);
      setResult(res);

      saveHistoryItem({
        toolId: 'passport-photo',
        toolName: 'Passport Photo Maker',
        fileName: file.name,
        originalSize: file.size,
        outputSize: res.a4SheetBlob.size,
        outputName: `DocuMate_Passport_Sheet_${options.copiesCount}photos.jpg`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate passport photos.';
      setError(msg);
      logError('passport-photo', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    if (result) {
      URL.revokeObjectURL(result.singlePhotoUrl);
      URL.revokeObjectURL(result.a4SheetUrl);
    }
    setFile(null);
    setPreviewSrc(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFilesSelected={handleFile}
          accept="image/jpeg,image/png,image/webp,image/jpg"
          title="Upload Portrait for Passport Photos"
          description="Take a selfie or portrait with neutral lighting to create standard 35x45mm or 2x2 inch print sheets"
          allowCamera
        />
      ) : (
        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <UserSquare2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Preset: {options.preset === '35x45mm' ? '35 × 45 mm (Standard India/UK/Schengen)' : '2 × 2 Inch (US Visa)'}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Choose different photo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Passport Photo Settings
              </h4>

              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Size Standards
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, preset: '35x45mm' })}
                    className={`py-2 px-3 text-xs rounded-xl border text-left ${
                      options.preset === '35x45mm'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">35 × 45 mm</div>
                    <div className="text-[10px] text-slate-400">India, UK, Schengen, Passport</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, preset: '2x2inch' })}
                    className={`py-2 px-3 text-xs rounded-xl border text-left ${
                      options.preset === '2x2inch'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">2 × 2 Inch (51x51mm)</div>
                    <div className="text-[10px] text-slate-400">US Visa, OCI, International</div>
                  </button>
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Background Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'white', label: 'Pure White', bg: '#ffffff' },
                    { id: 'light-blue', label: 'Light Blue', bg: '#dbeafe' },
                    { id: 'light-gray', label: 'Off White/Gray', bg: '#f3f4f6' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setOptions({ ...options, backgroundColor: b.id as any })}
                      className={`py-2 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 ${
                        options.backgroundColor === b.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-slate-300" style={{ background: b.bg }} />
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom & Face Crop Position */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5" /> Adjust Face Zoom & Alignment
                </span>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Face Zoom</span>
                    <span className="font-mono">{Math.round(options.zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="2.2"
                    step="0.05"
                    value={options.zoom}
                    onChange={(e) => setOptions({ ...options, zoom: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500">Horizontal Pan</span>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="5"
                      value={options.offsetX}
                      onChange={(e) => setOptions({ ...options, offsetX: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Vertical Pan</span>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="5"
                      value={options.offsetY}
                      onChange={(e) => setOptions({ ...options, offsetY: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Copies on A4 Sheet */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Print Sheet Copies on A4
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[4, 8, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setOptions({ ...options, copiesCount: num })}
                      className={`py-1.5 text-xs rounded-lg border font-semibold ${
                        options.copiesCount === num
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {num} Photos
                    </button>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Notice: Dimension and background criteria vary by issuing embassy and authority. Verify specifications for your visa or official form.
                </span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Print Sheet...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Generate Passport Print Sheet
                  </>
                )}
              </button>
            </div>

            {/* Right Preview & Download (7 cols) */}
            <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewTab('sheet')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        previewTab === 'sheet'
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500'
                      }`}
                    >
                      A4 Print Sheet ({options.copiesCount} Copies)
                    </button>
                    <button
                      onClick={() => setPreviewTab('single')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        previewTab === 'single'
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500'
                      }`}
                    >
                      Single Cut Photo
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Standard 300 DPI</span>
                </div>

                <div className="flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-xl min-h-[360px] max-h-[480px] overflow-hidden">
                  {result ? (
                    previewTab === 'sheet' ? (
                      <img
                        src={result.a4SheetUrl}
                        alt="A4 Sheet Preview"
                        className="max-h-[420px] object-contain shadow-md rounded-xs bg-white"
                      />
                    ) : (
                      <img
                        src={result.singlePhotoUrl}
                        alt="Single Photo"
                        className="max-h-[320px] object-contain shadow-md rounded-xs bg-white"
                      />
                    )
                  ) : previewSrc ? (
                    <div className="relative border-2 border-dashed border-indigo-400 p-2 bg-white rounded-md max-h-72">
                      <img
                        src={previewSrc}
                        alt="Source"
                        style={{
                          transform: `scale(${options.zoom}) translate(${options.offsetX / 4}px, ${options.offsetY / 4}px)`,
                        }}
                        className="max-h-64 object-contain"
                      />
                      <div className="absolute inset-0 border border-slate-400/40 pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-sm">
                          Click "Generate Passport Print Sheet" below
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons if generated */}
              {result && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={() =>
                      downloadBlob(result.singlePhotoBlob, `DocuMate_Passport_Single_Photo.jpg`)
                    }
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Single Photo (JPG)
                  </button>

                  <button
                    onClick={() =>
                      downloadBlob(
                        result.a4SheetBlob,
                        `DocuMate_Passport_Sheet_${options.copiesCount}photos.jpg`
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sheet (JPG)
                  </button>

                  <button
                    onClick={() =>
                      downloadBlob(
                        result.a4PdfBlob,
                        `DocuMate_Passport_Print_Ready_A4.pdf`
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Print-Ready A4 PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
