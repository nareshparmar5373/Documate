import React, { useState } from 'react';
import {
  ImageDown,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  FileImage,
  CheckCircle,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { compressImage } from '../../utils/imageEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

interface ImageCompressToolProps {
  initialTargetKb?: number;
}

export const ImageCompressTool: React.FC<ImageCompressToolProps> = ({ initialTargetKb }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Compression mode: 'slider' or 'target'
  const [mode, setMode] = useState<'target' | 'slider'>(initialTargetKb ? 'target' : 'target');
  const [targetSizeKb, setTargetSizeKb] = useState<number>(initialTargetKb || 50);
  const [quality, setQuality] = useState<number>(80);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [maxHeight, setMaxHeight] = useState<number>(1080);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    originalSize: number;
    outputSize: number;
    savedPercent: number;
    dataUrl: string;
    filename: string;
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const TARGET_PRESETS = [20, 50, 100, 200, 500, 1024];

  const handleFile = (files: File[]) => {
    const img = files.find((f) => f.type.startsWith('image/'));
    if (!img) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setError(null);
    setFile(img);
    setPreviewSrc(URL.createObjectURL(img));
    setResult(null);

    // auto set output format matching file
    if (img.type === 'image/webp') setFormat('image/webp');
    else if (img.type === 'image/png') setFormat('image/png');
    else setFormat('image/jpeg');
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(20);
    setError(null);

    try {
      const targetSizeBytes = mode === 'target' ? targetSizeKb * 1024 : undefined;
      const res = await compressImage(
        file,
        {
          quality,
          targetSizeBytes,
          maxWidth: maxWidth || undefined,
          maxHeight: maxHeight || undefined,
          maintainAspectRatio: true,
          outputFormat: format,
        },
        (p) => setProgress(p)
      );

      const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
      const filename = `DocuMate_${file.name.replace(/\.[^/.]+$/, '')}_compressed.${ext}`;

      setResult({
        ...res,
        filename,
      });

      saveHistoryItem({
        toolId: 'image-compress',
        toolName: 'Image Compressor',
        fileName: file.name,
        originalSize: file.size,
        outputSize: res.outputSize,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image compression failed.';
      setError(msg);
      logError('image-compress', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setFile(null);
    setPreviewSrc(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title="Image Compressed Successfully!"
        originalSize={result.originalSize}
        outputSize={result.outputSize}
        savedPercent={result.savedPercent}
        downloadFilename={result.filename}
        previewUrl={result.dataUrl}
        isImage
        extraDetails={
          mode === 'target'
            ? `Target Goal: ${targetSizeKb} KB • Achieved Size: ${formatBytes(result.outputSize)} • Dimensions: ${result.width}x${result.height}px`
            : `Quality: ${quality}% • Dimensions: ${result.width}x${result.height}px`
        }
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFilesSelected={handleFile}
          accept="image/jpeg,image/png,image/webp,image/jpg"
          title="Upload Image to Compress"
          description="Compress JPG, PNG, WEBP with target file sizes (20KB, 50KB, 100KB, etc.) or quality slider"
          allowCamera
        />
      ) : (
        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <FileImage className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Original: <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatBytes(file.size)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Choose different image
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900">
            {/* Left: Controls */}
            <div className="space-y-5">
              {/* Mode switch */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Compression Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('target')}
                    className={`py-2 text-xs font-medium rounded-xl border ${
                      mode === 'target'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Exact Target Size (KB)
                  </button>
                  <button
                    onClick={() => setMode('slider')}
                    className={`py-2 text-xs font-medium rounded-xl border ${
                      mode === 'slider'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Quality Slider (%)
                  </button>
                </div>
              </div>

              {mode === 'target' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Target File Size
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2.5">
                    {TARGET_PRESETS.map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setTargetSizeKb(kb)}
                        className={`py-1.5 text-xs rounded-lg border font-mono ${
                          targetSizeKb === kb
                            ? 'border-indigo-600 bg-indigo-600 text-white font-semibold'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {kb >= 1024 ? `${kb / 1024}MB` : `${kb}KB`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Custom Target:</span>
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      value={targetSizeKb}
                      onChange={(e) => setTargetSizeKb(Math.max(5, parseInt(e.target.value) || 20))}
                      className="w-24 text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                    />
                    <span className="text-xs text-slate-500 font-semibold">KB</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Compression Quality:
                    </span>
                    <span className="font-bold text-indigo-600 font-mono">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Smallest Size</span>
                    <span>Balanced</span>
                    <span>Max Quality</span>
                  </div>
                </div>
              )}

              {/* Format selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Output Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'image/jpeg', label: 'JPG / JPEG' },
                    { id: 'image/webp', label: 'WEBP (High Savings)' },
                    { id: 'image/png', label: 'PNG' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id as typeof format)}
                      className={`py-1.5 text-xs rounded-lg border font-medium ${
                        format === f.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCompress}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Compressing ({progress}%)...
                  </>
                ) : (
                  <>
                    <ImageDown className="w-4 h-4" />
                    Compress Image Now
                  </>
                )}
              </button>
            </div>

            {/* Right: Live Preview */}
            <div className="flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Original Preview
              </span>
              {previewSrc && (
                <div className="max-h-64 flex items-center justify-center overflow-hidden rounded-lg shadow-xs bg-white dark:bg-slate-900 p-2">
                  <img src={previewSrc} alt="Preview" className="max-h-56 max-w-full object-contain" />
                </div>
              )}
              <div className="mt-3 text-center text-xs text-slate-500">
                Original Size: <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatBytes(file.size)}</span>
              </div>
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
