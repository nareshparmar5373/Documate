export type ToolCategory = 'all' | 'pdf' | 'image' | 'scanner' | 'letters' | 'utility';

export type ToolId =
  | 'image-to-pdf'
  | 'pdf-to-jpg'
  | 'pdf-to-word'
  | 'pdf-compress'
  | 'image-compress'
  | 'image-resize'
  | 'custom-image-size'
  | 'passport-photo'
  | 'pan-card-scanner'
  | 'document-scanner'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-rotate'
  | 'pdf-reorder'
  | 'pdf-page-delete'
  | 'pdf-watermark'
  | 'pdf-protect'
  | 'pdf-unlock'
  | 'pdf-letter-format'
  | 'letter-generator'
  | 'emi-calculator'
  | 'target-file-size';

export interface ToolDefinition {
  id: ToolId;
  title: string;
  shortDesc: string;
  description: string;
  category: ToolCategory;
  icon: string;
  badge?: string;
  featured?: boolean;
  acceptedFileTypes?: string[];
  maxFiles?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  toolId: ToolId;
  toolName: string;
  fileName: string;
  originalSize: number;
  outputSize: number;
  outputName: string;
  downloadUrl?: string;
  fileBlob?: Blob;
}

export interface AdminSettings {
  maintenanceMode: boolean;
  maxUploadSizeMb: number;
  rateLimitPerMinute: number;
  allowedFormats: string[];
  autoCleanupMinutes: number;
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  toolId?: string;
  message: string;
  stack?: string;
}

export interface ProcessingStats {
  totalProcessedCount: number;
  totalSavedBytes: number;
  toolCounts: Record<string, number>;
  lastProcessedTimestamp: number;
}

export interface LetterTemplate {
  id: string;
  name: string;
  category: 'formal' | 'academic' | 'banking' | 'official' | 'personal';
  description: string;
  defaultRecipient: string;
  defaultSubject: string;
  defaultBody: string;
}

export interface EMICalculationResult {
  monthlyEMI: number;
  principalAmount: number;
  totalInterest: number;
  totalRepayment: number;
  interestRatio: number;
  schedule: Array<{
    month: number;
    year: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}
