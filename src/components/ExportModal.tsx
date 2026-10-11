import { ExportOptions } from '../utils/documentLayout';
import { ExportReadiness } from './ExportReadiness';
import { loadStudentDetails, saveStudentDetails } from '../utils/exportReadiness';
import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileCheck,
  CheckCircle2,
  BookOpen,
  Printer,
  Sparkles,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AssignmentRubric, ScholarlyPaper, CitationStyle, TitlePageConfig } from '../types';
import { generateDocxBlob } from '../utils/docxExport';
import { formatFullReference, sortReferences } from '../utils/citationFormatter';

const PdfPreview = React.lazy(() => import('./PdfPreview'));

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentContent: string;
  rubric: AssignmentRubric | null;
  references: ScholarlyPaper[];
  citationStyle: CitationStyle;
  titlePageConfig?: TitlePageConfig;
  onUpdateTitlePageConfig?: (config: TitlePageConfig) => void;
  onChangeContent?: (content: string) => void;
  userId?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  documentContent,
  rubric,
  references,
  citationStyle,
  titlePageConfig,
  onUpdateTitlePageConfig,
  onChangeContent,
  userId,
}) => {
  const [authorName, setAuthorName] = useState(titlePageConfig?.authorName ?? '');
  const [institution, setInstitution] = useState(
    titlePageConfig?.institution ?? ''
  );
  const [instructorName, setInstructorName] = useState(
    titlePageConfig?.instructorName ?? ''
  );
  const [courseName, setCourseName] = useState(
    titlePageConfig?.courseName ?? rubric?.courseName ?? ''
  );
  const [includeTitlePage, setIncludeTitlePage] = useState(
    titlePageConfig?.includeTitlePage ?? true
  );
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [detailsMessage, setDetailsMessage] = useState('');
  const detailsRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  React.useEffect(() => { setPreviewUrl(''); }, [documentContent, titlePageConfig, references, citationStyle, isOpen]);
  const exportOptions: ExportOptions = {
    title: titlePageConfig?.paperTitle || rubric?.title || 'Academic Paper',
    dateStr: titlePageConfig?.dueDate || '', authorName, institution, courseName,
    instructorName, content: documentContent, references, citationStyle, includeTitlePage,
  };

  // Sync state whenever titlePageConfig changes
  React.useEffect(() => {
    if (titlePageConfig) {
      setAuthorName(titlePageConfig.authorName || '');
      setInstitution(titlePageConfig.institution || '');
      setInstructorName(titlePageConfig.instructorName || '');
      setCourseName(titlePageConfig.courseName || '');
      if (titlePageConfig.includeTitlePage !== undefined) setIncludeTitlePage(titlePageConfig.includeTitlePage);
    } else if (rubric?.courseName) {
      setCourseName(rubric.courseName);
    }
  }, [titlePageConfig, rubric?.courseName]);

  const updateConfig = (updates: Partial<TitlePageConfig>) => {
    if (onUpdateTitlePageConfig) {
      onUpdateTitlePageConfig({
        ...titlePageConfig,
        authorName,
        institution,
        instructorName,
        courseName,
        includeTitlePage,
        ...updates,
      });
    }
  };

  const saveDetails = () => {
    if (!userId) return;
    try {
      saveStudentDetails(userId, { authorName, institution, courseName, instructorName });
      setDetailsMessage('Student and course details saved for this account on this device. Titles and due dates are not reused.');
    } catch { setDetailsMessage('Could not save reusable details on this device. This paper still keeps its own details.'); }
  };
  const useDetails = () => {
    const details = userId ? loadStudentDetails(userId) : null;
    if (!details) { setDetailsMessage('No saved student/course details for this account on this device yet.'); return; }
    setAuthorName(details.authorName); setInstitution(details.institution);
    setCourseName(details.courseName); setInstructorName(details.instructorName);
    updateConfig(details);
    setDetailsMessage('Saved details applied. Check the course and instructor for this assignment.');
  };

  if (!isOpen) return null;

  // 1. Export as Word (.docx)
  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const blob = await generateDocxBlob(exportOptions);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(titlePageConfig?.paperTitle || rubric?.title || 'Academic_Paper').replace(/\s+/g, '_')}_${citationStyle}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Failed to export docx:', err);
      alert('Error generating Word document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Preview and download the same PDF bytes; browser print settings cannot alter them.
  const handleExportPdf = async (preview = false) => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exportOptions),
      });
      if (!response.ok) throw new Error('PDF generation failed. Please retry.');
      const url = URL.createObjectURL(await response.blob());
      if (preview) setPreviewUrl(url);
      else {
        const a = document.createElement('a'); a.href = url;
        a.download = `${exportOptions.title.replace(/[^a-z0-9_-]+/gi, '_')}_${citationStyle}.pdf`;
        a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) { alert(error instanceof Error ? error.message : 'PDF generation failed'); }
    finally { setIsExporting(false); }
  };

  // 3. Export as Markdown / Plain Text
  const handleExportText = () => {
    let fullText = `${titlePageConfig?.paperTitle || rubric?.title || 'Academic Paper'}\n`;
    fullText += `Author: ${authorName}\n`;
    fullText += `Course: ${courseName}\n`;
    fullText += `Date: ${titlePageConfig?.dueDate || new Date().toLocaleDateString()}\n\n`;
    fullText += `${documentContent}\n\n`;

    if (references.length > 0) {
      fullText += `\n${citationStyle === 'MLA9' ? 'Works Cited' : 'References'}\n`;
      fullText += `======================================================\n`;
      sortReferences(references, citationStyle)
        .forEach((r, idx) => {
          fullText += `${formatFullReference(r, citationStyle, idx)}\n\n`;
        });
    }

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(titlePageConfig?.paperTitle || rubric?.title || 'Academic_Paper').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-[#1C1C1C] dark:text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8F9FA] dark:bg-[#161616] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-200 flex items-center justify-center text-[#0078D4]">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1C1C] dark:text-gray-100">Export Academic Document</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Generate formatted Word (.docx), print-ready PDF, or Markdown files
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-[#1C1C1C] dark:text-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4 space-y-2">
          <ExportReadiness options={exportOptions} onChangeContent={onChangeContent} onEditDetails={() => {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            detailsRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
          }} />
          <p className="text-xs text-gray-600 dark:text-gray-300">Professor Review checks writing. Preview the export and verify student details, citations, and assignment requirements before submitting.</p>
          {/\[Evidence needed\s*:/i.test(documentContent) && <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">Unresolved evidence gaps remain. Find supporting sources and revise each [Evidence needed: ...] passage before submitting. These markers will remain in the export.</p>}
          <button type="button" disabled={isExporting} onClick={() => handleExportPdf(true)} className="text-sm text-blue-600 underline disabled:opacity-50">{isExporting ? 'Preparing document...' : 'Preview exported pages'}</button>
          {previewUrl && <React.Suspense fallback={<p>Rendering pages…</p>}><PdfPreview url={previewUrl} /></React.Suspense>}
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Metadata Customization for Title Page */}
          <div ref={detailsRef} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-wider">
                Document details ({citationStyle})
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTitlePage}
                  onChange={(e) => { setIncludeTitlePage(e.target.checked); updateConfig({ includeTitlePage: e.target.checked }); }}
                  className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-gray-700 dark:text-gray-200 text-xs">Include APA Title Page</span>
              </label>
            </div>

            {userId && <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={saveDetails} className="text-blue-600 underline">Save student/course details for reuse</button>
                <button type="button" onClick={useDetails} className="text-blue-600 underline">Use saved student/course details</button>
              </div>
              {detailsMessage && <p role="status">{detailsMessage}</p>}
            </div>}

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">Paper Title
                <input aria-label="Paper Title" className="block w-full p-2 border rounded bg-transparent" value={titlePageConfig?.paperTitle || ''} onChange={e => updateConfig({ paperTitle: e.target.value })} />
              </label>
              <label className="text-xs">Due Date
                <input aria-label="Due Date" className="block w-full p-2 border rounded bg-transparent" value={titlePageConfig?.dueDate || ''} onChange={e => updateConfig({ dueDate: e.target.value })} />
              </label>
            </div>

            {includeTitlePage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    Author Name:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => {
                      setAuthorName(e.target.value);
                      updateConfig({ authorName: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    Course / Module:
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => {
                      setCourseName(e.target.value);
                      updateConfig({ courseName: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    Institutional Affiliation:
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => {
                      setInstitution(e.target.value);
                      updateConfig({ institution: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    Instructor / Professor:
                  </label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={(e) => {
                      setInstructorName(e.target.value);
                      updateConfig({ instructorName: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Options Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Word .docx Option */}
            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isExporting}
              className="p-4 rounded-xl bg-blue-50/40 hover:bg-blue-50/70 border border-blue-200/80 text-left transition flex flex-col justify-between group disabled:opacity-50"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-[#0078D4] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1C1C1C] dark:text-gray-100 text-xs">Microsoft Word (.docx)</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                    12pt Times New Roman, double spacing, page numbers, 1-inch margins, and hanging references. Check assignment-specific requirements.
                  </p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0078D4] group-hover:text-[#0078D4]">
                {isExporting ? 'Compiling Word...' : 'Download .docx'}
              </span>
            </button>

            {/* PDF Option */}
            <button
              type="button"
              onClick={() => handleExportPdf()}
              disabled={isExporting}
              className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-left transition flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1C1C1C] dark:text-gray-100 text-xs">Print-Ready PDF</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                    Letter size, numbered pages, consistent spacing, and no browser headers or footers.
                  </p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 group-hover:text-purple-300">
                Download .pdf
              </span>
            </button>

            {/* Markdown / Text Option */}
            <button
              type="button"
              onClick={handleExportText}
              className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-left transition flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1C1C1C] dark:text-gray-100 text-xs">Markdown / Text (.md)</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                    Editable Markdown with references in the selected citation style.
                  </p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 group-hover:text-emerald-700">
                Download .md
              </span>
            </button>
          </div>
        </div>

        </div>
        {/* Footer */}
        <div className="px-6 py-3 bg-[#F3F3F3] dark:bg-[#121212]/90 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            All exports include automated {citationStyle} Reference page compilation
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#1C1C1C] dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
