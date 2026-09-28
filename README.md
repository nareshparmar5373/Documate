# DocuMate — PDF & Document Tools

An all-in-one, client-side first document utility web application. Perform PDF, image, Word, document scanner, and identity document operations directly inside the browser with zero cloud file storage and 100% privacy.

---

## 🚀 Key Features & 22 Utilities

### 1. PDF Suite
- **Image to PDF**: Convert JPG, PNG, WEBP images to PDF. Multi-image upload, reorder, rotate 90°, page sizes (A4, A5, Letter, Legal, Custom), orientation (Portrait/Landscape), margins, image fit (fit, fill, original), and instant download.
- **PDF to JPG**: Extract all pages, first page, or custom range (e.g. `1-3, 5`) into high-resolution JPGs (up to 300 DPI). Download individually or as a single ZIP archive.
- **PDF Compressor**: Rebuild and compress PDF streams (Low, Medium, High). Live calculation of original size, compressed size, and percentage saved.
- **PDF to Word (DOCX)**: Extract paragraphs, headings, and lines from text-based PDFs into an editable Microsoft Word `.docx` file using the `docx` library.
- **PDF Merge**: Combine multiple PDF documents into a single unified file. Drag/arrow reordering and page count summary.
- **PDF Split**: Extract specific page ranges (e.g. `1-3, 4-7`) or split every page into separate individual documents packaged in a ZIP file.
- **PDF Rotate & Page Management**: Visual thumbnail-based manager. Rotate individual pages (90°/180°/270°), reorder, duplicate, or delete unwanted blank pages.
- **PDF Watermark**: Stamp text (CONFIDENTIAL, DRAFT, APPROVED, or custom) or image logo watermarks across all pages with custom opacity, rotation angle, color, and positioning.
- **PDF Password Protect**: Secure sensitive documents with user passwords and AES encryption.
- **PDF Unlock**: Decrypt and remove password restrictions from authorized PDFs.

### 2. Image Suite
- **Image Compressor**: Compress JPG, PNG, WEBP with a quality slider (1–100%) or exact target sizes (`20 KB`, `50 KB`, `100 KB`, `200 KB`, `500 KB`, `1 MB`).
- **Target File Size Tool**: Iterative binary search canvas compression specifically tailored for government exam & job portal limits.
- **Image Resize & Custom Image Size**: Resize width and height with physical unit support (`px`, `mm`, `cm`, `inch`), aspect ratio lock/unlock, and fit/crop/fill modes.

### 3. Document Scanner & Identity Tools
- **PAN Card & Identity Document Scanner**: Dedicated portal sizing for PAN Card, Aadhaar, Driving License, Passport, and Voter ID. Camera capture on mobile, rotate, enhance, and export under `< 50 KB`, `< 100 KB`, or `< 200 KB` as PDF or JPG.
- **Document Scanner**: Multi-page camera capture with filters: *Magic Enhance*, *High-Contrast B&W*, *Grayscale*, and *Original*. Multi-page reordering and multi-page A4 PDF export.
- **Passport Photo Maker**: Presets for `35 × 45 mm` (India, UK, Schengen) and `2 × 2 inch` (US Visa). Zoom & face alignment sliders, background tint adjustment (White, Light Blue, Light Gray), and multi-copy print sheet generation on standard A4 (4, 8, 12, 16 copies) with cutting guide marks. Download as high-res JPG or ready-to-print A4 PDF.

### 4. Letter Formats & Calculators
- **PDF Letter Templates (10+ Formats)**: Ready-made templates for Office Leave, School/College Leave, Job Application Cover Letter, Bank Address Change, Bank Account Closure, Complaint Letter, Permission Letter, Certificate Request, and General Application.
- **Application & Letter Generator**: Form inputs for sender, date, recipient, subject, body paragraphs, and sign-off. Live paper preview, export to A4 PDF, editable DOCX, or direct print.
- **EMI Calculator**: Home, car, and personal loan calculations using the standard banking formula:
  $$EMI = P \times r \times \frac{(1+r)^n}{(1+r)^n - 1}$$
  Includes monthly & yearly amortization schedule table, principal vs interest visual ratio, and currency switching (₹ INR / $ USD).

### 5. History & Admin Dashboard
- **Local History**: Tracks processed files with timestamps, tool names, original size, output size, and reduction percentage. Stored locally on device.
- **Admin Portal**: Password-protected administrative console (`admin2026` default) showing operation counters, bandwidth/storage saved, tool distribution breakdown, diagnostic error logs, maintenance mode toggle, and maximum upload size limits.

---

## 🔒 Privacy Architecture

DocuMate operates strictly under an **in-browser, client-side first architecture**:
- **Zero Permanent Storage**: File contents are processed in RAM memory and are never uploaded to remote cloud storage.
- **Auto-Cleanup**: Temporary blob objects are garbage-collected upon session end.
- **Safe for Confidential Data**: Safe for sensitive identity documents (PAN, Aadhaar, passport photos) and financial letters.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **PDF Processing**: `pdf-lib` + `pdfjs-dist`
- **Document Generation**: `docx` (Native Word DOCX generation)
- **Archive Utilities**: `jszip`
- **Celebration Effects**: `canvas-confetti`

---

## 📦 Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Production Build & Lint
```bash
npm run lint
npm run build
npm run preview
```
