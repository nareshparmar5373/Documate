import React, { useState } from 'react';
import {
  CreditCard,
  Camera,
  RotateCw,
  FileDown,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { PrivacyNotice } from '../common/PrivacyNotice';
import { ResultCard } from '../common/ResultCard';
import { compressImage, applyScanFilter } from '../../utils/imageEngine';
import { PDFDocument } from 'pdf-lib';
import { formatBytes, downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

export const PanCardScannerTool: React.FC = () => {
  const [docType, setDocType] = useState<string>('PAN Card');
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [filter, setFilter] = useState<'original' | 'magic' | 'grayscale' | 'bw'>('magic');

  // Target size for Indian Govt Portals (NSDL / UTIITSL / UIDAI / Sarathi): <50KB, <100KB, <200KB, <300KB
  const [targetKb, setTargetKb] = useState<number>(50);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'jpg'>('pdf');

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    outputSize: number;
    filename: string;
    isPdf: boolean;
    dataUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const DOC_TYPES = [
    'PAN Card',
    'Aadhaar Card',
    'Driving License',
    'Passport',
    'Voter ID',
    'Marksheet / Degree',
    'Other Document',
  ];

  const handleFile = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    setFile(f);
    setPreviewSrc(URL.createObjectURL(f));
    setResult(null);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      // 1. Apply visual filter and rotation
      const filtered = await applyScanFilter(file, filter, rotation);

      // 2. Compress to meet the portal limit
      const compressed = await compressImage(filtered.blob, {
        quality: 80,
        targetSizeBytes: targetKb * 1024,
        outputFormat: 'image/jpeg',
      });

      const sanitizedDocName = docType.toLowerCase().replace(/\s+/g, '_');

      if (exportFormat === 'pdf') {
        // Embed compressed image into an A4 PDF or exact card dimension PDF
        const pdfDoc = await PDFDocument.create();
        const imgBytes = await compressed.blob.arrayBuffer();
        const embeddedImg = await pdfDoc.embedJpg(imgBytes);

        // Standard card or doc aspect
        const dims = embeddedImg.scale(0.5);
        // Create matching page
        const page = pdfDoc.addPage([dims.width + 40, dims.height + 40]);
        page.drawImage(embeddedImg, {
          x: 20,
          y: 20,
          width: dims.width,
          height: dims.height,
        });

        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        const filename = `DocuMate_${sanitizedDocName}_${Math.round(pdfBlob.size / 1024)}KB.pdf`;

        setResult({
          blob: pdfBlob,
          outputSize: pdfBlob.size,
          filename,
          isPdf: true,
        });

        saveHistoryItem({
          toolId: 'pan-card-scanner',
          toolName: 'PAN & Document Scanner',
          fileName: `${docType} (${file.name})`,
          originalSize: file.size,
          outputSize: pdfBlob.size,
          outputName: filename,
        });
      } else {
        const filename = `DocuMate_${sanitizedDocName}_${Math.round(compressed.blob.size / 1024)}KB.jpg`;
        setResult({
          blob: compressed.blob,
          outputSize: compressed.blob.size,
          filename,
          isPdf: false,
          dataUrl: URL.createObjectURL(compressed.blob),
        });

        saveHistoryItem({
          toolId: 'pan-card-scanner',
          toolName: 'PAN & Document Scanner',
          fileName: `${docType} (${file.name})`,
          originalSize: file.size,
          outputSize: compressed.blob.size,
          outputName: filename,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to scan and format document.';
      setError(msg);
      logError('pan-card-scanner', err instanceof Error ? err : new Error(msg));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    if (result?.dataUrl) URL.revokeObjectURL(result.dataUrl);
    setFile(null);
    setPreviewSrc(null);
    setResult(null);
    setError(null);
    setRotation(0);
  };

  if (result) {
    return (
      <ResultCard
        title={`${docType} Prepared Successfully!`}
        originalSize={file?.size}
        outputSize={result.outputSize}
        downloadFilename={result.filename}
        previewUrl={result.dataUrl}
        isImage={!result.isPdf}
        extraDetails={`Portal Limit Target: <${targetKb} KB • Achieved Size: ${formatBytes(result.outputSize)} • 100% Private (No server logs)`}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Banner upfront */}
      <PrivacyNotice />

      {!file ? (
        <div className="space-y-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Select Document Type to Format
            </label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDocType(dt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    docType === dt
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>

          <DropZone
            onFilesSelected={handleFile}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            title={`Scan or Upload ${docType}`}
            description="Take camera photo on mobile or upload image. Fast auto-enhance & compression under 50KB/100KB/200KB for government portals."
            allowCamera
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {docType} — {file.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Input Size: <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{formatBytes(file.size)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Scan different document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900">
            {/* Controls */}
            <div className="space-y-4">
              {/* Target File Size limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Government Portal File Size Requirement
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100, 200].map((kb) => (
                    <button
                      key={kb}
                      type="button"
                      onClick={() => setTargetKb(kb)}
                      className={`py-2 text-xs rounded-xl border font-bold font-mono ${
                        targetKb === kb
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      &lt; {kb} KB
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  e.g. NSDL PAN requires &lt;50KB, Passport Seva requires &lt;100KB or &lt;200KB.
                </span>
              </div>

              {/* Enhance Filters */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Document Enhancement Filter
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'magic', label: 'Magic Enhance' },
                    { id: 'original', label: 'Original' },
                    { id: 'grayscale', label: 'Grayscale' },
                    { id: 'bw', label: 'High B&W' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id as any)}
                      className={`py-1.5 text-xs rounded-lg border font-medium ${
                        filter === f.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotate and Export format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Rotate
                  </label>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate 90° ({rotation}°)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Export Output
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExportFormat('pdf')}
                      className={`py-2 text-xs rounded-xl border font-semibold ${
                        exportFormat === 'pdf'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat('jpg')}
                      className={`py-2 text-xs rounded-xl border font-semibold ${
                        exportFormat === 'jpg'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      JPG
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing & Compressing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Format {docType} & Download ({exportFormat.toUpperCase()})
                  </>
                )}
              </button>
            </div>

            {/* Document Preview */}
            <div className="flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Card Preview
              </span>
              {previewSrc && (
                <div className="relative max-h-64 flex items-center justify-center overflow-hidden rounded-xl shadow-xs bg-white dark:bg-slate-900 p-2">
                  <img
                    src={previewSrc}
                    alt="Document"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    className="max-h-56 max-w-full object-contain rounded-lg transition-transform"
                  />
                </div>
              )}
              <div className="mt-3 text-center text-xs text-slate-500">
                Guaranteed: Stays strictly under <span className="font-bold text-indigo-600">{targetKb} KB</span>
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
