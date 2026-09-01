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
import { AssignmentRubric, ScholarlyPaper, CitationStyle } from '../types';
import { generateDocxBlob } from '../utils/docxExport';
import { formatFullReference } from '../utils/citationFormatter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentContent: string;
  rubric: AssignmentRubric | null;
  references: ScholarlyPaper[];
  citationStyle: CitationStyle;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  documentContent,
  rubric,
  references,
  citationStyle,
}) => {
  const [authorName, setAuthorName] = useState('Jane Doe');
  const [institution, setInstitution] = useState('Department of Psychology, University of California');
  const [instructorName, setInstructorName] = useState('Prof. Eleanor Vance, Ph.D.');
  const [courseName, setCourseName] = useState(rubric?.courseName || 'PSYC 4020: Cognitive Neuroscience');
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // 1. Export as Word (.docx)
  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const blob = await generateDocxBlob({
        title: rubric?.title || 'Academic Research Essay',
        authorName,
        institution,
        courseName,
        instructorName,
        content: documentContent,
        references,
        citationStyle,
        includeTitlePage,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(rubric?.title || 'Academic_Paper').replace(/\s+/g, '_')}_APA7.docx`;
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

  // 2. Export as PDF / Print
  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the print-ready PDF.');
      return;
    }

    const title = rubric?.title || 'Academic Research Paper';
    const sortedRefs = [...references].sort((a, b) => {
      const nameA = (a.authors?.[0]?.name || a.title).toLowerCase();
      const nameB = (b.authors?.[0]?.name || b.title).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const refsHtml = sortedRefs
      .map((r, idx) => `<p class="ref-item">${formatFullReference(r, citationStyle, idx)}</p>`)
      .join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: letter;
            margin: 1in;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 2;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .title-page {
            text-align: center;
            padding-top: 2.5in;
            page-break-after: always;
          }
          .title {
            font-weight: bold;
            margin-bottom: 24pt;
          }
          .meta {
            margin-bottom: 12pt;
          }
          h1 {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
            margin-top: 18pt;
            margin-bottom: 12pt;
          }
          h2 {
            font-size: 12pt;
            font-weight: bold;
            text-align: left;
            margin-top: 18pt;
            margin-bottom: 12pt;
          }
          p {
            text-indent: 0.5in;
            margin: 0;
          }
          .page-break {
            page-break-before: always;
          }
          .references-title {
            font-weight: bold;
            text-align: center;
            margin-bottom: 18pt;
          }
          .ref-item {
            text-indent: -0.5in;
            padding-left: 0.5in;
            margin-bottom: 12pt;
          }
        </style>
      </head>
      <body>
        ${
          includeTitlePage
            ? `
          <div class="title-page">
            <div class="title">${title}</div>
            <div class="meta">${authorName}</div>
            <div class="meta">${institution}</div>
            <div class="meta">${courseName}</div>
            <div class="meta">${instructorName}</div>
            <div class="meta">${new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}</div>
          </div>
        `
            : ''
        }

        <h1>${title}</h1>
        <div>
          ${documentContent
            .split('\n')
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return '';
              if (trimmed.startsWith('# ')) return `<h1>${trimmed.replace(/^#\s+/, '')}</h1>`;
              if (trimmed.startsWith('## ')) return `<h2>${trimmed.replace(/^##\s+/, '')}</h2>`;
              return `<p>${trimmed}</p>`;
            })
            .join('')}
        </div>

        ${
          references.length > 0
            ? `
          <div class="page-break">
            <div class="references-title">${citationStyle === 'MLA9' ? 'Works Cited' : 'References'}</div>
            ${refsHtml}
          </div>
        `
            : ''
        }
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);

    confetti({ particleCount: 50, spread: 45, origin: { y: 0.6 } });
  };

  // 3. Export as Markdown / Plain Text
  const handleExportText = () => {
    let fullText = `${rubric?.title || 'Academic Paper'}\n`;
    fullText += `Author: ${authorName}\n`;
    fullText += `Course: ${courseName}\n`;
    fullText += `Date: ${new Date().toLocaleDateString()}\n\n`;
    fullText += `${documentContent}\n\n`;

    if (references.length > 0) {
      fullText += `\n${citationStyle === 'MLA9' ? 'Works Cited' : 'References'}\n`;
      fullText += `======================================================\n`;
      [...references]
        .sort((a, b) => (a.authors?.[0]?.name || a.title).localeCompare(b.authors?.[0]?.name || b.title))
        .forEach((r, idx) => {
          fullText += `${formatFullReference(r, citationStyle, idx)}\n\n`;
        });
    }

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(rubric?.title || 'Academic_Paper').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3F3F3] dark:bg-[#121212]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-[#1C1C1C] dark:text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F3F3F3] dark:bg-[#121212]/90 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Metadata Customization for Title Page */}
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-wider">
                Title Page Configuration ({citationStyle})
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTitlePage}
                  onChange={(e) => setIncludeTitlePage(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-gray-700 dark:text-gray-200 text-xs">Include APA Title Page</span>
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
                    onChange={(e) => setAuthorName(e.target.value)}
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
                    onChange={(e) => setCourseName(e.target.value)}
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
                    onChange={(e) => setInstitution(e.target.value)}
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
                    onChange={(e) => setInstructorName(e.target.value)}
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
                    Standard APA 7: Times New Roman 12pt, double spaced, 1-inch margins, 0.5-inch hanging indent.
                  </p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0078D4] group-hover:text-[#0078D4]">
                {isExporting ? 'Compiling Word...' : 'Download .docx →'}
              </span>
            </button>

            {/* PDF Option */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-left transition flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1C1C1C] dark:text-gray-100 text-xs">Print-Ready PDF</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                    Formatted letter size with running head, clean typography, and page breaks.
                  </p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 group-hover:text-purple-300">
                Print / Save PDF →
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
                    Clean plain-text formatting with appended APA bibliographic entries.
                  </p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 group-hover:text-emerald-700">
                Download .md →
              </span>
            </button>
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
