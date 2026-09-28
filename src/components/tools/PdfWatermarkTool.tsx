import React, { useState } from 'react';
import { Stamp, FileText, Download, AlertCircle, Sparkles } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ResultCard } from '../common/ResultCard';
import { applyWatermark } from '../../utils/pdfEngine';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

export const PdfWatermarkTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(44);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [rotationAngle, setRotationAngle] = useState<number>(45);
  const [color, setColor] = useState<string>('#ef4444');
  const [position, setPosition] = useState<'center' | 'diagonal' | 'top-right' | 'bottom-right'>('diagonal');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    pageCount: number;
    size: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (files: File[]) => {
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) {
      setError('Please upload a valid PDF file.');
      return;
    }
    setError(null);
    setFile(pdf);
    setResult(null);
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(15);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const res = await applyWatermark(
        buffer,
        {
          type: watermarkType,
          text,
          fontSize,
          opacity,
          rotationAngle,
          color,
          position,
          imageFile: imageFile || undefined,
        },
        (p) => setProgress(p)
      );

      const filename = `DocuMate_${file.name.replace(/\.pdf$/i, '')}_watermarked.pdf`;
      setResult({
        blob: res.blob,
        pageCount: res.pageCount,
        size: res.size,
        filename,
      });

      saveHistoryItem({
        toolId: 'pdf-watermark',
        toolName: 'PDF Watermark',
        fileName: file.name,
        originalSize: file.size,
        outputSize: res.size,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply watermark to PDF.';
      setError(msg);
      logError('pdf-watermark', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        title="Watermark Applied Successfully!"
        originalSize={file?.size}
        outputSize={result.size}
        downloadFilename={result.filename}
        extraDetails={`Watermarked across ${result.pageCount} pages with '${text}' at ${Math.round(opacity * 100)}% opacity.`}
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
          accept="application/pdf"
          title="Upload PDF to Add Watermark"
          description="Stamp custom text (CONFIDENTIAL, DRAFT, DO NOT COPY) or company logo watermark"
        />
      ) : (
        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Choose different PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900">
            {/* Watermark controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Watermark Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWatermarkType('text')}
                    className={`py-2 text-xs font-medium rounded-xl border ${
                      watermarkType === 'text'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Text Stamp
                  </button>
                  <button
                    onClick={() => setWatermarkType('image')}
                    className={`py-2 text-xs font-medium rounded-xl border ${
                      watermarkType === 'image'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Image / Logo Stamp
                  </button>
                </div>
              </div>

              {watermarkType === 'text' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                    />
                    <div className="flex gap-1.5 mt-2">
                      {['CONFIDENTIAL', 'DRAFT', 'COPY', 'APPROVED'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setText(preset)}
                          className="px-2 py-1 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-mono"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Font Size ({fontSize}px)
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Stamp Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono text-slate-500">{color}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Upload Stamp Image (PNG/JPG)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  {imageFile && (
                    <span className="text-xs text-emerald-600 mt-1 block">
                      Selected: {imageFile.name}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Opacity ({Math.round(opacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Angle ({rotationAngle}°)
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={rotationAngle}
                    onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Position
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['diagonal', 'center', 'top-right', 'bottom-right'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => {
                        setPosition(pos);
                        if (pos === 'diagonal') setRotationAngle(45);
                        else setRotationAngle(0);
                      }}
                      className={`py-1.5 capitalize text-xs rounded-lg border font-medium ${
                        position === pos
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="flex flex-col items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Live Stamp Preview
              </span>

              <div className="relative w-48 h-64 bg-white border border-slate-300 shadow-sm rounded-md flex items-center justify-center overflow-hidden p-3 select-none">
                {/* Simulated text lines */}
                <div className="space-y-2 w-full opacity-25 pointer-events-none">
                  <div className="h-2 bg-slate-400 rounded-sm w-3/4"></div>
                  <div className="h-2 bg-slate-300 rounded-sm w-full"></div>
                  <div className="h-2 bg-slate-300 rounded-sm w-5/6"></div>
                  <div className="h-2 bg-slate-300 rounded-sm w-full"></div>
                  <div className="h-2 bg-slate-300 rounded-sm w-2/3"></div>
                  <div className="h-2 bg-slate-300 rounded-sm w-full"></div>
                </div>

                {/* Simulated watermark overlay */}
                <div
                  className="absolute pointer-events-none font-bold text-center uppercase tracking-wider"
                  style={{
                    color,
                    opacity,
                    fontSize: `${Math.round(fontSize * 0.4)}px`,
                    transform: `rotate(${rotationAngle}deg)`,
                  }}
                >
                  {watermarkType === 'text' ? text || 'WATERMARK' : 'LOGO WATERMARK'}
                </div>
              </div>

              <button
                onClick={handleApply}
                disabled={processing}
                className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying Watermark ({progress}%)...
                  </>
                ) : (
                  <>
                    <Stamp className="w-4 h-4" />
                    Apply Watermark & Download
                  </>
                )}
              </button>
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
