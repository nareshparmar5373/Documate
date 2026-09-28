/**
 * Formatting helpers for file size, dates, currency, and dimension conversions
 */

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Convert physical units to pixels at standard 96 DPI screen or 300 DPI print
export function unitToPx(value: number, unit: 'px' | 'mm' | 'cm' | 'inch', dpi = 96): number {
  switch (unit) {
    case 'px':
      return Math.round(value);
    case 'inch':
      return Math.round(value * dpi);
    case 'mm':
      return Math.round((value / 25.4) * dpi);
    case 'cm':
      return Math.round((value / 2.54) * dpi);
  }
}

export function pxToUnit(px: number, unit: 'px' | 'mm' | 'cm' | 'inch', dpi = 96): number {
  switch (unit) {
    case 'px':
      return Math.round(px);
    case 'inch':
      return parseFloat((px / dpi).toFixed(2));
    case 'mm':
      return parseFloat(((px / dpi) * 25.4).toFixed(1));
    case 'cm':
      return parseFloat(((px / dpi) * 2.54).toFixed(2));
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
