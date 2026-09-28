import { PDFDocument } from 'pdf-lib';
import { unitToPx } from './formatters';

export interface ImageCompressOptions {
  quality: number; // 1-100
  targetSizeBytes?: number; // exact target bytes e.g. 50 * 1024
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ImageResizeOptions {
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'cm' | 'inch';
  lockAspectRatio: boolean;
  mode: 'fit' | 'fill' | 'crop';
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
}

export interface PassportPhotoOptions {
  preset: '35x45mm' | '2x2inch' | 'custom';
  customWidthMm?: number;
  customHeightMm?: number;
  backgroundColor: 'original' | 'white' | 'light-blue' | 'light-gray';
  copiesCount: number; // 4, 8, 12, 16, 24, 32
  zoom: number; // 1.0 to 2.5
  offsetX: number;
  offsetY: number;
}

export type ScanFilter = 'original' | 'magic' | 'grayscale' | 'bw';

/**
 * Load any Image File/Blob into an HTMLImageElement
 */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. Please check file format.'));
    };
    img.src = url;
  });
}

/**
 * Compress an image with quality slider or iterative target file size
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressOptions,
  onProgress?: (percent: number) => void
): Promise<{
  blob: Blob;
  originalSize: number;
  outputSize: number;
  savedPercent: number;
  dataUrl: string;
  width: number;
  height: number;
}> {
  const originalSize = file.size;
  const img = await loadImage(file);

  let targetWidth = img.naturalWidth;
  let targetHeight = img.naturalHeight;

  // Max width/height constraints
  if (options.maxWidth && targetWidth > options.maxWidth) {
    const ratio = options.maxWidth / targetWidth;
    targetWidth = options.maxWidth;
    targetHeight = Math.round(targetHeight * ratio);
  }
  if (options.maxHeight && targetHeight > options.maxHeight) {
    const ratio = options.maxHeight / targetHeight;
    targetHeight = options.maxHeight;
    targetWidth = Math.round(targetWidth * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas context');

  // Fill white for transparency safety when converting PNG to JPEG
  const format = options.outputFormat || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (onProgress) onProgress(40);

  // If Target File Size is requested (e.g. 50KB or 20KB for govt portals), binary search quality and resolution
  if (options.targetSizeBytes && options.targetSizeBytes > 0) {
    const target = options.targetSizeBytes;
    let minQ = 0.05;
    let maxQ = 0.95;
    let bestBlob: Blob | null = null;
    let bestDiff = Infinity;
    let scale = 1.0;

    // Up to 6 binary iterations
    for (let iter = 0; iter < 6; iter++) {
      const q = (minQ + maxQ) / 2;
      const testBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', q);
      });

      const diff = Math.abs(testBlob.size - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestBlob = testBlob;
      }

      if (testBlob.size > target) {
        maxQ = q;
      } else {
        minQ = q;
      }

      if (onProgress) onProgress(40 + iter * 10);
    }

    // If still oversized at min quality, downscale canvas
    if (bestBlob && bestBlob.size > target && targetWidth > 400) {
      while (bestBlob.size > target && scale > 0.3) {
        scale *= 0.82;
        const downCanvas = document.createElement('canvas');
        downCanvas.width = Math.round(targetWidth * scale);
        downCanvas.height = Math.round(targetHeight * scale);
        const dCtx = downCanvas.getContext('2d');
        if (dCtx) {
          dCtx.fillStyle = '#FFFFFF';
          dCtx.fillRect(0, 0, downCanvas.width, downCanvas.height);
          dCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);
          bestBlob = await new Promise<Blob>((resolve) => {
            downCanvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.65);
          });
        }
      }
    }

    const finalBlob = bestBlob || (await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), format, 0.7)));
    const dataUrl = URL.createObjectURL(finalBlob);
    const savedPercent = originalSize > finalBlob.size ? Math.round(((originalSize - finalBlob.size) / originalSize) * 100) : 0;

    return {
      blob: finalBlob,
      originalSize,
      outputSize: finalBlob.size,
      savedPercent,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
    };
  }

  // Standard slider compression (quality: 1 to 100)
  const qualityDecimal = Math.max(0.01, Math.min(1.0, options.quality / 100));
  const resultBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), format, qualityDecimal);
  });

  const dataUrl = URL.createObjectURL(resultBlob);
  const savedPercent = originalSize > resultBlob.size ? Math.round(((originalSize - resultBlob.size) / originalSize) * 100) : 0;

  if (onProgress) onProgress(100);

  return {
    blob: resultBlob,
    originalSize,
    outputSize: resultBlob.size,
    savedPercent,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Resize image by dimensions and unit
 */
export async function resizeImage(
  file: File | Blob,
  options: ImageResizeOptions
): Promise<{
  blob: Blob;
  outputSize: number;
  dataUrl: string;
  width: number;
  height: number;
}> {
  const img = await loadImage(file);
  const targetPxW = Math.max(1, unitToPx(options.width, options.unit));
  const targetPxH = Math.max(1, unitToPx(options.height, options.unit));

  const canvas = document.createElement('canvas');
  canvas.width = targetPxW;
  canvas.height = targetPxH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetPxW, targetPxH);
  }

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  if (options.mode === 'fit') {
    const scale = Math.min(targetPxW / srcW, targetPxH / srcH);
    const w = srcW * scale;
    const h = srcH * scale;
    const x = (targetPxW - w) / 2;
    const y = (targetPxH - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  } else if (options.mode === 'fill') {
    ctx.drawImage(img, 0, 0, targetPxW, targetPxH);
  } else {
    // Crop / Center cover
    const scale = Math.max(targetPxW / srcW, targetPxH / srcH);
    const w = srcW * scale;
    const h = srcH * scale;
    const x = (targetPxW - w) / 2;
    const y = (targetPxH - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  const qualityDecimal = Math.max(0.1, Math.min(1.0, options.quality / 100));
  const resultBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), options.format, qualityDecimal);
  });

  return {
    blob: resultBlob,
    outputSize: resultBlob.size,
    dataUrl: URL.createObjectURL(resultBlob),
    width: targetPxW,
    height: targetPxH,
  };
}

/**
 * Passport Photo Maker
 * Generates individual passport photo crop and A4 multi-photo print sheet
 */
export async function createPassportPhotos(
  file: File | Blob,
  options: PassportPhotoOptions
): Promise<{
  singlePhotoBlob: Blob;
  singlePhotoUrl: string;
  a4SheetBlob: Blob;
  a4SheetUrl: string;
  a4PdfBlob: Blob;
}> {
  const img = await loadImage(file);

  // Passport dimensions at 300 DPI
  // 35 x 45 mm = ~413 x 531 px
  // 2 x 2 inch = 600 x 600 px
  let photoWidth = 413;
  let photoHeight = 531;

  if (options.preset === '2x2inch') {
    photoWidth = 600;
    photoHeight = 600;
  } else if (options.preset === 'custom' && options.customWidthMm && options.customHeightMm) {
    photoWidth = unitToPx(options.customWidthMm, 'mm', 300);
    photoHeight = unitToPx(options.customHeightMm, 'mm', 300);
  }

  // 1. Render single photo canvas
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = photoWidth;
  photoCanvas.height = photoHeight;
  const pCtx = photoCanvas.getContext('2d');
  if (!pCtx) throw new Error('Canvas context error');

  // Background tint
  if (options.backgroundColor === 'white') {
    pCtx.fillStyle = '#FFFFFF';
  } else if (options.backgroundColor === 'light-blue') {
    pCtx.fillStyle = '#DCEAFE';
  } else if (options.backgroundColor === 'light-gray') {
    pCtx.fillStyle = '#F3F4F6';
  } else {
    pCtx.fillStyle = '#FFFFFF';
  }
  pCtx.fillRect(0, 0, photoWidth, photoHeight);

  // Draw image with zoom and offset
  const baseScale = Math.max(photoWidth / img.naturalWidth, photoHeight / img.naturalHeight);
  const zoomScale = baseScale * (options.zoom || 1.0);
  const drawW = img.naturalWidth * zoomScale;
  const drawH = img.naturalHeight * zoomScale;
  const drawX = (photoWidth - drawW) / 2 + (options.offsetX || 0);
  const drawY = (photoHeight - drawH) / 2 + (options.offsetY || 0);

  pCtx.drawImage(img, drawX, drawY, drawW, drawH);

  // Add subtle border / cut line
  pCtx.strokeStyle = '#D1D5DB';
  pCtx.lineWidth = 2;
  pCtx.strokeRect(1, 1, photoWidth - 2, photoHeight - 2);

  const singlePhotoBlob = await new Promise<Blob>((res) => photoCanvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.95));
  const singlePhotoUrl = URL.createObjectURL(singlePhotoBlob);

  // 2. Render A4 Print Sheet (2480 x 3508 px at 300 DPI)
  const a4W = 2480;
  const a4H = 3508;
  const a4Canvas = document.createElement('canvas');
  a4Canvas.width = a4W;
  a4Canvas.height = a4H;
  const a4Ctx = a4Canvas.getContext('2d');
  if (!a4Ctx) throw new Error('A4 canvas context error');

  a4Ctx.fillStyle = '#FFFFFF';
  a4Ctx.fillRect(0, 0, a4W, a4H);

  // Header guide
  a4Ctx.font = '32px sans-serif';
  a4Ctx.fillStyle = '#64748B';
  a4Ctx.fillText('DocuMate — Ready-to-Print Passport Photo Sheet (A4 Standard 300 DPI)', 100, 100);

  // Grid layout calculation
  const copies = Math.min(32, Math.max(1, options.copiesCount || 8));
  const gap = 40;
  const marginLeft = 100;
  const marginTop = 160;

  const cols = Math.min(5, Math.floor((a4W - marginLeft * 2 + gap) / (photoWidth + gap))) || 4;

  for (let i = 0; i < copies; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = marginLeft + col * (photoWidth + gap);
    const y = marginTop + row * (photoHeight + gap);

    if (y + photoHeight > a4H - 80) break; // stay within page boundaries

    a4Ctx.drawImage(photoCanvas, x, y);

    // Cutting guide marks around each photo
    a4Ctx.strokeStyle = '#CBD5E1';
    a4Ctx.lineWidth = 1;
    a4Ctx.setLineDash([4, 4]);
    a4Ctx.strokeRect(x - 2, y - 2, photoWidth + 4, photoHeight + 4);
    a4Ctx.setLineDash([]);
  }

  const a4SheetBlob = await new Promise<Blob>((res) => a4Canvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.95));
  const a4SheetUrl = URL.createObjectURL(a4SheetBlob);

  // 3. Generate ready-to-print A4 PDF
  const pdfDoc = await PDFDocument.create();
  const pdfPage = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const sheetJpgBytes = await a4SheetBlob.arrayBuffer();
  const embeddedSheet = await pdfDoc.embedJpg(sheetJpgBytes);

  pdfPage.drawImage(embeddedSheet, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  const pdfBytes = await pdfDoc.save();
  const a4PdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  return {
    singlePhotoBlob,
    singlePhotoUrl,
    a4SheetBlob,
    a4SheetUrl,
    a4PdfBlob,
  };
}

/**
 * Filter Document Scanner canvas (Magic enhance, Grayscale, High-contrast B&W)
 */
export async function applyScanFilter(
  imageSource: File | Blob | string,
  filter: ScanFilter,
  rotationDegrees = 0
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImage(imageSource);
  const canvas = document.createElement('canvas');

  const isRotated90or270 = rotationDegrees % 180 !== 0;
  canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotationDegrees * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();

  if (filter !== 'original') {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (filter === 'grayscale') {
        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      } else if (filter === 'bw') {
        // High contrast document thresholding
        const val = gray > 140 ? 255 : 0;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      } else if (filter === 'magic') {
        // Auto enhance contrast & saturation
        const enhancedGray = (gray - 128) * 1.35 + 128;
        const factor = 1.25;
        d[i] = Math.min(255, Math.max(0, (r - gray) * factor + enhancedGray));
        d[i + 1] = Math.min(255, Math.max(0, (g - gray) * factor + enhancedGray));
        d[i + 2] = Math.min(255, Math.max(0, (b - gray) * factor + enhancedGray));
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.92));
  return {
    blob,
    dataUrl: URL.createObjectURL(blob),
  };
}
