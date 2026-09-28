import React, { useState } from 'react';
import {
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileDown,
  Layers,
  Settings,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { convertImagesToPdf, ImageToPdfOptions } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number;
}

export const ImageToPdfTool: React.FC<{ onBack?: () => void }> = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<ImageToPdfOptions>({
    pageSize: 'A4',
    orientation: 'portrait',
    margin: 'small',
    fit: 'fit',
    quality: 0.9,
    customWidth: 595,
    customHeight: 842,
  });

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    pageCount: number;
    size: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      setError('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }
    setError(null);
    const newItems: ImageItem[] = valid.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const rotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newArr = [...images];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);
    setImages(newArr);
  };

  const totalInputBytes = images.reduce((acc, curr) => acc + curr.file.size, 0);

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const payload = images.map((img) => ({
        file: img.file,
        rotation: img.rotation,
      }));

      const res = await convertImagesToPdf(payload, options, (p) => setProgress(p));
      const filename = `DocuMate_${images[0].file.name.replace(/\.[^/.]+$/, '')}_converted.pdf`;

      setResult({
        blob: res.blob,
        pageCount: res.pageCount,
        size: res.size,
        filename,
      });

      saveHistoryItem({
        toolId: 'image-to-pdf',
        toolName: 'Image to PDF',
        fileName: `${images.length} images (${images[0].file.name}...)`,
        originalSize: totalInputBytes,
        outputSize: res.size,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF from images.';
      setError(msg);
      logError('image-to-pdf', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title="PDF Created Successfully!"
        originalSize={totalInputBytes}
        outputSize={result.size}
        downloadFilename={result.filename}
        extraDetails={`Total Pages: ${result.pageCount} • Page Size: ${options.pageSize} • Fit: ${options.fit}`}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload area if no images or to add more */}
      {images.length === 0 ? (
        <DropZone
          onFilesSelected={handleFiles}
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple
          title="Upload Images (JPG, PNG, WEBP)"
          description="Drag and drop one or multiple photos, or select to convert to PDF"
          allowCamera
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Grid & Ordering */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Selected Images ({images.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Total Size: {formatBytes(totalInputBytes)} • Drag or use arrows to reorder
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => document.getElementById('addMoreImgInput')?.click()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold"
                >
                  + Add More
                </button>
                <input
                  id="addMoreImgInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-1">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="relative group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-xs flex flex-col"
                >
                  <div className="relative aspect-3/4 flex items-center justify-center p-2 bg-slate-900/5 dark:bg-slate-950/40 overflow-hidden">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      style={{ transform: `rotate(${item.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain transition-transform duration-200"
                    />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-900 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                    <span className="truncate max-w-[80px] text-slate-600 dark:text-slate-400 text-[11px]" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => rotateImage(item.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={index === 0}
                        onClick={() => moveItem(index, 'up')}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={index === images.length - 1}
                        onClick={() => moveItem(index, 'down')}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeImage(item.id)}
                        className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="w-full lg:w-80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              PDF Page Settings
            </h4>

            {/* Page Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Page Size
              </label>
              <select
                value={options.pageSize}
                onChange={(e) =>
                  setOptions({ ...options, pageSize: e.target.value as ImageToPdfOptions['pageSize'] })
                }
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="A4">A4 (Standard Document)</option>
                <option value="Letter">Letter (US Standard)</option>
                <option value="Legal">Legal</option>
                <option value="A5">A5 (Compact)</option>
                <option value="Custom">Custom Dimensions</option>
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, orientation: 'portrait' })}
                  className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                    options.orientation === 'portrait'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, orientation: 'landscape' })}
                  className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                    options.orientation === 'landscape'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Margin
              </label>
              <select
                value={options.margin}
                onChange={(e) =>
                  setOptions({ ...options, margin: e.target.value as ImageToPdfOptions['margin'] })
                }
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="none">No Margin (Full Bleed)</option>
                <option value="small">Small Margin (18pt)</option>
                <option value="medium">Medium Margin (36pt)</option>
                <option value="large">Large Margin (54pt)</option>
              </select>
            </div>

            {/* Image Fit */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Image Fit
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['fit', 'fill', 'original'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setOptions({ ...options, fit: mode })}
                    className={`py-1.5 capitalize text-xs rounded-lg border transition-colors ${
                      options.fit === mode
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Total Pages:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{images.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Size:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ~{formatBytes(Math.round(totalInputBytes * 0.95))}
                </span>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleGeneratePdf}
              disabled={processing}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating PDF ({progress}%)...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Convert to PDF
                </>
              )}
            </button>
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
