/**
 * Safe PDF.js loader with worker configuration
 */
import * as pdfjsLib from 'pdfjs-dist';

// Use cloudflare/cdnjs CDN worker matching pdfjs-dist version for rock-solid cross-browser client-side rendering
const PDFJS_VERSION = pdfjsLib.version || '4.10.38';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

export { pdfjsLib };
