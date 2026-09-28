import React, { useState, useEffect } from 'react';
import { Scaling, Crop, Lock, Unlock, AlertCircle, FileImage, Sparkles } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { resizeImage, loadImage } from '../../utils/imageEngine';
import { pxToUnit, unitToPx, formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

export const ImageResizeTool: React.FC<{ customMode?: boolean }> = ({ customMode = false }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [origDimensions, setOrigDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const [unit, setUnit] = useState<'px' | 'mm' | 'cm' | 'inch'>('px');
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [mode, setMode] = useState<'fit' | 'fill' | 'crop'>('fit');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    outputSize: number;
    dataUrl: string;
    width: number;
    height: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (files: File[]) => {
    const img = files.find((f) => f.type.startsWith('image/'));
    if (!img) {
      setError('Please upload a valid image file.');
      return;
    }

    try {
      setError(null);
      setFile(img);
      const url = URL.createObjectURL(img);
      setPreviewSrc(url);
      setResult(null);

      const loaded = await loadImage(url);
      setOrigDimensions({ width: loaded.naturalWidth, height: loaded.naturalHeight });
      setWidth(loaded.naturalWidth);
      setHeight(loaded.naturalHeight);
      setUnit('px');
    } catch {
      setError('Failed to inspect image dimensions.');
    }
  };

  const handleWidthChange = (newVal: number) => {
    setWidth(newVal);
    if (lockRatio && origDimensions.width > 0) {
      const ratio = origDimensions.height / origDimensions.width;
      setHeight(Math.round(newVal * ratio));
    }
  };

  const handleHeightChange = (newVal: number) => {
    setHeight(newVal);
    if (lockRatio && origDimensions.height > 0) {
      const ratio = origDimensions.width / origDimensions.height;
      setWidth(Math.round(newVal * ratio));
    }
  };

  const handleUnitChange = (newUnit: 'px' | 'mm' | 'cm' | 'inch') => {
    if (origDimensions.width === 0) {
      setUnit(newUnit);
      return;
    }
    // Convert current px to new unit
    const pxW = unitToPx(width, unit);
    const pxH = unitToPx(height, unit);
    setUnit(newUnit);
    setWidth(pxToUnit(pxW, newUnit));
    setHeight(pxToUnit(pxH, newUnit));
  };

  const handleResize = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await resizeImage(file, {
        width,
        height,
        unit,
        lockAspectRatio: lockRatio,
        mode,
        format,
        quality,
      });

      const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
      const filename = `DocuMate_${file.name.replace(/\.[^/.]+$/, '')}_${res.width}x${res.height}.${ext}`;

      setResult({
        ...res,
        filename,
      });

      saveHistoryItem({
        toolId: customMode ? 'custom-image-size' : 'image-resize',
        toolName: customMode ? 'Custom Image Size' : 'Image Resize',
        fileName: file.name,
        originalSize: file.size,
        outputSize: res.outputSize,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resize image.';
      setError(msg);
      logError('image-resize', err instanceof Error ? err : new Error(msg));
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
  };

  if (result) {
    return (
      <ResultCard
        title="Image Resized Successfully!"
        originalSize={file?.size}
        outputSize={result.outputSize}
        downloadFilename={result.filename}
        previewUrl={result.dataUrl}
        isImage
        extraDetails={`Output Dimensions: ${result.width} × ${result.height} px • Format: ${format.toUpperCase()}`}
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
          title={customMode ? 'Set Custom Image Dimensions' : 'Upload Image to Resize'}
          description="Resize in pixels (px), millimeters (mm), centimeters (cm), or inches with live preview"
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
                  Original: {origDimensions.width} × {origDimensions.height} px • {formatBytes(file.size)}
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
            {/* Dimensions form */}
            <div className="space-y-4">
              {/* Unit selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Measurement Unit
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['px', 'mm', 'cm', 'inch'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleUnitChange(u)}
                      className={`py-1.5 text-xs rounded-lg border font-mono font-medium ${
                        unit === u
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Width & Height */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Width ({unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={width}
                    onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Height ({unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={height}
                    onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Aspect Ratio Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Lock Aspect Ratio
                </span>
                <button
                  type="button"
                  onClick={() => setLockRatio(!lockRatio)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                    lockRatio
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                      : 'border-slate-300 text-slate-500'
                  }`}
                >
                  {lockRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {lockRatio ? 'Locked' : 'Unlocked'}
                </button>
              </div>

              {/* Mode: Fit, Fill, Crop */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Resize Behavior
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['fit', 'crop', 'fill'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`py-1.5 capitalize text-xs rounded-lg border font-medium ${
                        mode === m
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Output Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'image/jpeg', label: 'JPG' },
                    { id: 'image/png', label: 'PNG' },
                    { id: 'image/webp', label: 'WEBP' },
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
                onClick={handleResize}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resizing Image...
                  </>
                ) : (
                  <>
                    <Scaling className="w-4 h-4" />
                    Apply Dimensions & Save
                  </>
                )}
              </button>
            </div>

            {/* Live Canvas Preview */}
            <div className="flex flex-col items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Live Frame Aspect Preview
              </span>

              <div className="relative w-full h-64 flex items-center justify-center overflow-hidden p-2">
                {previewSrc && (
                  <div
                    className="border-2 border-dashed border-indigo-500 shadow-sm overflow-hidden flex items-center justify-center max-w-full max-h-full"
                    style={{
                      aspectRatio: `${Math.max(1, width)} / ${Math.max(1, height)}`,
                    }}
                  >
                    <img
                      src={previewSrc}
                      alt="Aspect Preview"
                      className={`w-full h-full ${
                        mode === 'crop'
                          ? 'object-cover'
                          : mode === 'fill'
                          ? 'object-fill'
                          : 'object-contain'
                      }`}
                    />
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500 font-mono text-center">
                Target Pixel Size: ~{unitToPx(width, unit)} × {unitToPx(height, unit)} px
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
