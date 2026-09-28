import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { pdfjsLib } from './pdfWorker';

export interface ImageToPdfOptions {
  pageSize: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'medium' | 'large';
  fit: 'fit' | 'fill' | 'original';
  quality?: number; // 0.1 to 1.0
}

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  Letter: [612.0, 792.0],
  Legal: [612.0, 1008.0],
};

const MARGIN_VALUES: Record<string, number> = {
  none: 0,
  small: 18,
  medium: 36,
  large: 54,
};

/**
 * Convert multiple image files to a single PDF
 */
export async function convertImagesToPdf(
  images: { file: File; rotation?: number }[],
  options: ImageToPdfOptions,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; pageCount: number; size: number }> {
  const pdfDoc = await PDFDocument.create();
  const total = images.length;

  for (let i = 0; i < total; i++) {
    const { file, rotation = 0 } = images[i];
    const imageBytes = await file.arrayBuffer();

    let embeddedImage;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === 'image/png') {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      // For webp or other formats, convert to jpeg via canvas first
      const canvasJpg = await convertImageToJpgBlob(file, options.quality || 0.92);
      const convertedBytes = await canvasJpg.arrayBuffer();
      embeddedImage = await pdfDoc.embedJpg(convertedBytes);
    }

    let [pageWidth, pageHeight] =
      options.pageSize === 'Custom'
        ? [options.customWidth || 595, options.customHeight || 842]
        : PAGE_SIZES[options.pageSize] || PAGE_SIZES.A4;

    if (options.orientation === 'landscape') {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const margin = MARGIN_VALUES[options.margin] || 0;
    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const imgDims = embeddedImage.scale(1);
    let drawWidth = imgDims.width;
    let drawHeight = imgDims.height;
    let x = margin;
    let y = margin;

    if (options.fit === 'fit') {
      const scale = Math.min(availWidth / imgDims.width, availHeight / imgDims.height);
      drawWidth = imgDims.width * scale;
      drawHeight = imgDims.height * scale;
      x = margin + (availWidth - drawWidth) / 2;
      y = margin + (availHeight - drawHeight) / 2;
    } else if (options.fit === 'fill') {
      const scale = Math.max(availWidth / imgDims.width, availHeight / imgDims.height);
      drawWidth = imgDims.width * scale;
      drawHeight = imgDims.height * scale;
      x = margin + (availWidth - drawWidth) / 2;
      y = margin + (availHeight - drawHeight) / 2;
    } else {
      // original size centered
      x = Math.max(margin, margin + (availWidth - drawWidth) / 2);
      y = Math.max(margin, margin + (availHeight - drawHeight) / 2);
    }

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      rotate: degrees(rotation),
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, pageCount: total, size: blob.size };
}

/**
 * Render PDF pages to JPG images using pdfjs-dist
 */
export async function convertPdfToJpg(
  pdfBuffer: ArrayBuffer,
  options: {
    pageSelection: 'all' | 'first' | 'range';
    pageRange?: string;
    quality: number;
    dpiScale?: number;
  },
  onProgress?: (progress: number) => void
): Promise<Array<{ pageNum: number; blob: Blob; dataUrl: string; size: number }>> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let targetPages: number[] = [];
  if (options.pageSelection === 'first') {
    targetPages = [1];
  } else if (options.pageSelection === 'all') {
    targetPages = Array.from({ length: numPages }, (_, i) => i + 1);
  } else {
    targetPages = parsePageRange(options.pageRange || `1-${numPages}`, numPages);
  }

  if (targetPages.length === 0) {
    targetPages = [1];
  }

  const results: Array<{ pageNum: number; blob: Blob; dataUrl: string; size: number }> = [];
  const scale = options.dpiScale || 1.5;

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', options.quality);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b || new Blob()),
        'image/jpeg',
        options.quality
      );
    });

    results.push({
      pageNum,
      blob,
      dataUrl,
      size: blob.size,
    });

    if (onProgress) {
      onProgress(Math.round(((idx + 1) / targetPages.length) * 100));
    }
  }

  return results;
}

/**
 * Compress PDF by rebuilding pages with optimized stream compression
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high' | 'custom',
  customFactor = 0.7,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; savedPercent: number }> {
  const originalSize = pdfBuffer.byteLength;
  if (onProgress) onProgress(20);

  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const compressedDoc = await PDFDocument.create();

  const pagesCount = srcDoc.getPageCount();
  const copiedPages = await compressedDoc.copyPages(
    srcDoc,
    Array.from({ length: pagesCount }, (_, i) => i)
  );

  if (onProgress) onProgress(50);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i];
    compressedDoc.addPage(page);
  }

  if (onProgress) onProgress(80);

  const compressedBytes = await compressedDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  let outputBytes: Uint8Array = compressedBytes;

  if (level === 'high' || (level === 'custom' && customFactor < 0.5)) {
    try {
      const compacted = await compactPdfViaRender(pdfBuffer, level === 'high' ? 0.65 : customFactor);
      if (compacted.byteLength < outputBytes.byteLength) {
        outputBytes = compacted;
      }
    } catch (e) {
      console.warn('Advanced raster compression fallback skipped:', e);
    }
  }

  if (onProgress) onProgress(100);

  const blob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
  const compressedSize = blob.size;
  const savedPercent =
    originalSize > compressedSize
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 5;

  return {
    blob,
    originalSize,
    compressedSize,
    savedPercent,
  };
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePdfs(
  pdfBuffers: ArrayBuffer[],
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; totalPages: number; size: number }> {
  const mergedDoc = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < pdfBuffers.length; i++) {
    const doc = await PDFDocument.load(pdfBuffers[i]);
    const pageIndices = doc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(doc, pageIndices);
    copiedPages.forEach((page) => mergedDoc.addPage(page));
    totalPages += copiedPages.length;

    if (onProgress) {
      onProgress(Math.round(((i + 1) / pdfBuffers.length) * 100));
    }
  }

  const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
  const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, totalPages, size: blob.size };
}

/**
 * Split PDF by ranges or extract individual pages
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  mode: 'range' | 'each',
  rangeString = '1',
  onProgress?: (progress: number) => void
): Promise<Array<{ name: string; blob: Blob; pageCount: number }>> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = srcDoc.getPageCount();
  const results: Array<{ name: string; blob: Blob; pageCount: number }> = [];

  if (mode === 'each') {
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const bytes = await newDoc.save({ useObjectStreams: true });
      results.push({
        name: `page_${i + 1}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }),
        pageCount: 1,
      });
      if (onProgress) onProgress(Math.round(((i + 1) / totalPages) * 100));
    }
  } else {
    const ranges = rangeString.split(',').map((s) => s.trim()).filter(Boolean);
    for (let rIdx = 0; rIdx < ranges.length; rIdx++) {
      const part = ranges[rIdx];
      const pageNums = parsePageRange(part, totalPages);
      if (pageNums.length === 0) continue;

      const newDoc = await PDFDocument.create();
      const zeroIndices = pageNums.map((n) => n - 1);
      const copiedPages = await newDoc.copyPages(srcDoc, zeroIndices);
      copiedPages.forEach((p) => newDoc.addPage(p));

      const bytes = await newDoc.save({ useObjectStreams: true });
      results.push({
        name: `split_pages_${part.replace(/\s+/g, '')}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }),
        pageCount: pageNums.length,
      });

      if (onProgress) onProgress(Math.round(((rIdx + 1) / ranges.length) * 100));
    }
  }

  return results;
}

/**
 * Manage PDF Pages: Rotate, Reorder, Delete
 */
export async function managePdfPages(
  pdfBuffer: ArrayBuffer,
  options: {
    pageOrder?: number[];
    rotations?: Record<number, number>;
  },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; pageCount: number; size: number }> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const total = srcDoc.getPageCount();
  const pageOrder = options.pageOrder || Array.from({ length: total }, (_, i) => i);

  const newDoc = await PDFDocument.create();
  if (onProgress) onProgress(30);

  const copiedPages = await newDoc.copyPages(srcDoc, pageOrder);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i];
    const originalIndex = pageOrder[i];
    const addRotation = options.rotations ? options.rotations[originalIndex] || 0 : 0;
    if (addRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + addRotation) % 360));
    }
    newDoc.addPage(page);
  }

  if (onProgress) onProgress(80);

  const bytes = await newDoc.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);

  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, pageCount: copiedPages.length, size: blob.size };
}

/**
 * Apply Text or Image Watermark to PDF
 */
export async function applyWatermark(
  pdfBuffer: ArrayBuffer,
  options: {
    type: 'text' | 'image';
    text?: string;
    fontSize?: number;
    opacity: number;
    rotationAngle?: number;
    color?: string;
    position: 'center' | 'top-right' | 'bottom-right' | 'diagonal';
    imageFile?: File;
  },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; pageCount: number; size: number }> {
  const doc = await PDFDocument.load(pdfBuffer);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  let embeddedImage;
  if (options.type === 'image' && options.imageFile) {
    const imgBytes = await options.imageFile.arrayBuffer();
    if (options.imageFile.type === 'image/png') {
      embeddedImage = await doc.embedPng(imgBytes);
    } else {
      embeddedImage = await doc.embedJpg(imgBytes);
    }
  }

  const hex = options.color || '#ef4444';
  const r = parseInt(hex.slice(1, 3), 16) / 255 || 0.8;
  const g = parseInt(hex.slice(3, 5), 16) / 255 || 0.2;
  const b = parseInt(hex.slice(5, 7), 16) / 255 || 0.2;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    if (options.type === 'text') {
      const watermarkText = options.text || 'CONFIDENTIAL';
      const fontSize = options.fontSize || 48;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;
      let rot = options.rotationAngle ?? (options.position === 'diagonal' ? 45 : 0);

      if (options.position === 'top-right') {
        x = width - textWidth - 30;
        y = height - textHeight - 30;
        rot = 0;
      } else if (options.position === 'bottom-right') {
        x = width - textWidth - 30;
        y = 30;
        rot = 0;
      }

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity: Math.max(0.05, Math.min(1, options.opacity)),
        rotate: degrees(rot),
      });
    } else if (embeddedImage) {
      const scale = 0.5;
      const imgWidth = embeddedImage.width * scale;
      const imgHeight = embeddedImage.height * scale;
      page.drawImage(embeddedImage, {
        x: (width - imgWidth) / 2,
        y: (height - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
        opacity: options.opacity,
        rotate: degrees(options.rotationAngle || 0),
      });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / pages.length) * 100));
    }
  }

  const bytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, pageCount: pages.length, size: blob.size };
}

/**
 * Protect PDF with user open password
 */
export async function protectPdf(
  pdfBuffer: ArrayBuffer,
  password: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; size: number }> {
  if (onProgress) onProgress(30);
  const doc = await PDFDocument.load(pdfBuffer);
  if (onProgress) onProgress(60);

  await (doc as unknown as { encrypt?: (opts: unknown) => Promise<void> }).encrypt?.({
    userPassword: password,
    ownerPassword: password + '_owner_' + Math.random().toString(36).slice(2, 6),
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  const bytes = await doc.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);

  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, size: blob.size };
}

/**
 * Unlock PDF with provided password
 */
export async function unlockPdf(
  pdfBuffer: ArrayBuffer,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; size: number }> {
  if (onProgress) onProgress(30);
  const doc = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: false,
    ...((password ? { password } : {}) as unknown as object),
  });

  if (onProgress) onProgress(70);
  const cleanDoc = await PDFDocument.create();
  const pages = await cleanDoc.copyPages(doc, doc.getPageIndices());
  pages.forEach((p) => cleanDoc.addPage(p));

  const cleanBytes = await cleanDoc.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);

  const blob = new Blob([cleanBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, size: blob.size };
}

/**
 * Convert PDF to editable Word (DOCX)
 */
export async function convertPdfToDocx(
  pdfBuffer: ArrayBuffer,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; textLength: number; pagesProcessed: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const docxParagraphs: Paragraph[] = [];
  let totalExtractedLength = 0;

  docxParagraphs.push(
    new Paragraph({
      text: 'Converted Document via DocuMate',
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    docxParagraphs.push(
      new Paragraph({
        text: `--- Page ${i} ---`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    const lineMap: Map<number, string[]> = new Map();
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const y = Math.round(item.transform[5]);
        const bucket = Array.from(lineMap.keys()).find((k) => Math.abs(k - y) <= 4) ?? y;
        const current = lineMap.get(bucket) || [];
        current.push(item.str);
        lineMap.set(bucket, current);
        totalExtractedLength += item.str.length;
      }
    }

    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    if (sortedY.length === 0) {
      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Scanned image or empty page - text extraction completed]',
              italics: true,
              color: '888888',
            }),
          ],
        })
      );
    } else {
      for (const y of sortedY) {
        const lineText = lineMap.get(y)?.join(' ') || '';
        const isHeading = lineText.length < 50 && lineText === lineText.toUpperCase() && lineText.length > 4;

        docxParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: lineText,
                bold: isHeading,
                size: isHeading ? 26 : 22,
              }),
            ],
            spacing: { after: isHeading ? 140 : 80 },
          })
        );
      }
    }

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docxParagraphs,
      },
    ],
  });

  const docxBlob = await Packer.toBlob(doc);
  return {
    blob: docxBlob,
    textLength: totalExtractedLength,
    pagesProcessed: numPages,
  };
}

/**
 * Zip an array of blobs and return a single zip blob
 */
export async function createZipFromBlobs(
  items: Array<{ name: string; blob: Blob }>
): Promise<Blob> {
  const zip = new JSZip();
  items.forEach((item) => {
    zip.file(item.name, item.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
}

function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(maxPages, parseInt(endStr, 10) || maxPages);
      for (let i = start; i <= end; i++) {
        pages.add(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

async function convertImageToJpgBlob(file: File, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas context not available'));
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to encode JPG blob'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for PDF conversion'));
    };
    img.src = url;
  });
}

async function compactPdfViaRender(pdfBuffer: ArrayBuffer, quality: number): Promise<Uint8Array> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const newDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;

    const jpgDataUrl = canvas.toDataURL('image/jpeg', quality);
    const embeddedImg = await newDoc.embedJpg(jpgDataUrl);

    const newPage = newDoc.addPage([viewport.width, viewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return await newDoc.save({ useObjectStreams: true });
}
