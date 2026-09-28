import React, { useRef } from 'react';
import { Upload, Camera, FileCheck } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  description?: string;
  allowCamera?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  accept = '*/*',
  multiple = false,
  title = 'Click or drag files here to upload',
  description = 'Supports standard document and image formats',
  allowCamera = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = ''; // reset so same file can be selected again
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className="group relative border-2 border-dashed border-indigo-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-indigo-50/40 dark:bg-slate-900/40 hover:bg-indigo-50/70 dark:hover:bg-slate-900/70 transition-all rounded-2xl p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center shadow-xs"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      {allowCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
      )}

      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Upload className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">{description}</p>

      <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors active:scale-95"
        >
          <FileCheck className="w-4 h-4" />
          Choose {multiple ? 'Files' : 'File'}
        </button>

        {allowCamera && (
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm transition-colors active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Capture with Camera
          </button>
        )}
      </div>
    </div>
  );
};
