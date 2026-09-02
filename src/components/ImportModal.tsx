import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  FileCheck,
  AlignLeft,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAndAnalyze: (text: string, title?: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportAndAnalyze,
  isAnalyzing,
}) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        setIsExtractingFile(true);
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        setText(result.value);
      } catch (err) {
        console.error('Error parsing Word document:', err);
        alert('Failed to parse Word document. Please ensure it is a valid .docx file.');
      } finally {
        setIsExtractingFile(false);
      }
    } else if (file.type.startsWith('image/')) {
      try {
        setIsExtractingFile(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          // Send to OCR extraction endpoint
          const res = await fetch('/api/rubric/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, imageMimeType: file.type }),
          });
          const data = await res.json();
          if (data && data.title) {
            setText(`# ${data.title}\n\n${(data.topicConstraints || []).join('\n')}\n\n${(data.keyQuestionsToAnswer || []).join('\n')}`);
          }
          setIsExtractingFile(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error reading image paper:', err);
        setIsExtractingFile(false);
      }
    } else if (file.type === 'application/pdf' || fileNameLower.endsWith('.pdf')) {
      try {
        setIsExtractingFile(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          const res = await fetch('/api/rubric/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64 }),
          });
          const data = await res.json();
          if (data && data.title) {
            setText(`# ${data.title}\n\n${(data.keyQuestionsToAnswer || []).join('\n')}`);
          }
          setIsExtractingFile(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error reading PDF paper:', err);
        setIsExtractingFile(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onImportAndAnalyze(text, title || fileName || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0078D4] flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Import Paper & Identify Sources
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload existing draft, extract cited literature, and run AI evaluation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
              Document Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Analysis of Neural Networks in Natural Language"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
            />
          </div>

          {/* File Upload / Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-[#0078D4] bg-blue-50/50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#0078D4] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {fileName ? fileName : 'Click to select file or drag & drop here'}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <span className="px-1.5 py-0.5 rounded bg-blue-100/60 dark:bg-blue-950/40 text-[#0078D4] text-[9px] font-bold">DOCX</span>
                <span className="px-1.5 py-0.5 rounded bg-red-100/60 dark:bg-red-950/40 text-red-600 text-[9px] font-bold">PDF</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-100/60 dark:bg-purple-950/40 text-purple-600 text-[9px] font-bold">PNG / JPG</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[9px] font-bold">TXT</span>
              </div>
            </div>
          </div>

          {/* Or Paste Raw Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-gray-500" />
                Or Paste Essay / Paper Text Below
              </label>
              {text && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {text.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your essay, literature review, or drafted paragraphs here..."
              className="w-full p-3 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono leading-relaxed"
            />
          </div>

          {/* Notice */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-[#0078D4] dark:text-blue-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>
              Importing will automatically focus the editor, index all cited references, and benchmark your paper against rubric guidelines.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isAnalyzing}
              className="px-5 py-2 text-xs font-semibold bg-[#0078D4] hover:bg-blue-600 text-white rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Sources & Rubric...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Import & Run AI Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
