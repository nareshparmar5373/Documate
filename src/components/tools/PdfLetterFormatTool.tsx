import React, { useState } from 'react';
import {
  ScrollText,
  FileDown,
  Printer,
  FileCode2,
  CheckCircle,
  AlertCircle,
  Copy,
  PenTool,
} from 'lucide-react';
import {
  LETTER_TEMPLATES,
  LetterFormData,
  generateLetterPdf,
  generateLetterDocx,
} from '../../utils/letterTemplates';
import { downloadBlob } from '../../utils/formatters';
import { saveHistoryItem, logError } from '../../utils/storage';

export const PdfLetterFormatTool: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(LETTER_TEMPLATES[0].id);

  const activeTemplate =
    LETTER_TEMPLATES.find((t) => t.id === selectedTemplateId) || LETTER_TEMPLATES[0];

  const [formData, setFormData] = useState<LetterFormData>({
    senderName: 'Rahul Sharma',
    senderAddress: 'B-402, Shivalik Residency, Ring Road\nAhmedabad, Gujarat - 380015',
    senderPhone: '+91 98765 43210',
    senderEmail: 'rahul.sharma@example.com',
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    recipientDetails: activeTemplate.defaultRecipient,
    subject: activeTemplate.defaultSubject,
    body: activeTemplate.defaultBody,
    signOff: 'Yours sincerely,',
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = LETTER_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setFormData((prev) => ({
        ...prev,
        recipientDetails: tmpl.defaultRecipient,
        subject: tmpl.defaultSubject,
        body: tmpl.defaultBody,
      }));
    }
  };

  const handleDownloadPdf = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateLetterPdf(formData);
      const filename = `DocuMate_Letter_${(formData.subject || 'Application')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30)}.pdf`;
      downloadBlob(res.blob, filename);

      saveHistoryItem({
        toolId: 'pdf-letter-format',
        toolName: 'Letter Generator',
        fileName: formData.subject || 'Formal Letter',
        originalSize: 0,
        outputSize: res.size,
        outputName: filename,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF letter.';
      setError(msg);
      logError('pdf-letter-format', err instanceof Error ? err : new Error(msg));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadDocx = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateLetterDocx(formData);
      const filename = `DocuMate_Letter_${(formData.subject || 'Application')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30)}.docx`;
      downloadBlob(res.blob, filename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate DOCX letter.';
      setError(msg);
      logError('pdf-letter-format', err instanceof Error ? err : new Error(msg));
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Template picker pills */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
          Choose Ready-Made Letter Template
        </label>
        <div className="flex flex-wrap gap-2">
          {LETTER_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                selectedTemplateId === tmpl.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (6 cols) */}
        <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PenTool className="w-4 h-4 text-indigo-600" />
            Letter Details & Sender Info
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Your Full Name (Sender)
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Sender Address & Contact
            </label>
            <textarea
              rows={2}
              value={formData.senderAddress}
              onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.senderPhone || ''}
                onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.senderEmail || ''}
                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Recipient Designation & Office Address
            </label>
            <textarea
              rows={3}
              value={formData.recipientDetails}
              onChange={(e) => setFormData({ ...formData, recipientDetails: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Letter Body Paragraphs
            </label>
            <textarea
              rows={8}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Live A4 Sheet Preview & Export (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ScrollText className="w-4 h-4 text-indigo-500" />
                Live A4 Document Sheet Preview
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Official Formal Format
              </span>
            </div>

            {/* Simulated Paper A4 sheet */}
            <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl flex items-center justify-center">
              <div
                id="printable-letter-area"
                className="bg-white text-slate-900 w-full max-w-[420px] min-h-[540px] p-6 shadow-md rounded-xs border border-slate-200 text-[11px] leading-relaxed font-sans flex flex-col justify-between select-text"
              >
                <div>
                  {/* Sender Header */}
                  <div className="border-b border-slate-200 pb-2 mb-3">
                    <div className="font-bold text-xs text-slate-900">{formData.senderName}</div>
                    <div className="text-[10px] text-slate-500 whitespace-pre-line">
                      {formData.senderAddress}
                    </div>
                    {(formData.senderPhone || formData.senderEmail) && (
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {[formData.senderPhone, formData.senderEmail].filter(Boolean).join(' | ')}
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-right text-[10px] font-semibold text-slate-600 mb-3">
                    Date: {formData.date}
                  </div>

                  {/* Recipient */}
                  <div className="mb-3 text-[10px]">
                    <div className="font-semibold text-slate-800">To,</div>
                    <div className="text-slate-600 whitespace-pre-line">
                      {formData.recipientDetails}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-3 text-[10.5px] font-bold text-indigo-900 border-l-2 border-indigo-600 pl-2">
                    Subject: {formData.subject}
                  </div>

                  {/* Body */}
                  <div className="text-slate-700 whitespace-pre-line text-justify mb-4 text-[10px] leading-relaxed">
                    {formData.body}
                  </div>
                </div>

                {/* Sign-off */}
                <div className="mt-4 pt-2">
                  <div className="text-[10px] text-slate-600">Yours sincerely,</div>
                  <div className="h-6" /> {/* signature room */}
                  <div className="font-bold text-[10.5px] text-slate-900">
                    {formData.senderName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5 justify-end">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={handleDownloadDocx}
              disabled={generating}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Download Word (.docx)
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={generating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download A4 PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
