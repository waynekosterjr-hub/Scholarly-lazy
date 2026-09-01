import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  History,
  CheckCircle,
  Copy,
  Check,
  Download,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProgressionStep, AssignmentRubric, ScholarlyPaper } from '../types';

interface ShowYourWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressionSteps: ProgressionStep[];
  rubric: AssignmentRubric | null;
  references: ScholarlyPaper[];
}

export const ShowYourWorkModal: React.FC<ShowYourWorkModalProps> = ({
  isOpen,
  onClose,
  progressionSteps,
  rubric,
  references,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateAuditReportText = () => {
    let report = `========================================================================\n`;
    report += `SCHOLARDESK ACADEMIC INTEGRITY & THOUGHT PROGRESSION AUDIT DOSSIER\n`;
    report += `========================================================================\n\n`;
    report += `Project Title: ${rubric?.title || 'Academic Paper'}\n`;
    report += `Course: ${rubric?.courseName || 'N/A'}\n`;
    report += `Generated At: ${new Date().toLocaleString()}\n`;
    report += `Citation Format: ${rubric?.requiredCitationStyle || 'APA 7th Edition'}\n\n`;

    report += `1. ASSIGNMENT CONSTRAINTS & RUBRIC INGESTION:\n`;
    report += `------------------------------------------------------------------------\n`;
    report += `Target Words: ${rubric?.requiredWordCount?.target || 2000} (Range: ${
      rubric?.requiredWordCount?.min || 1500
    } - ${rubric?.requiredWordCount?.max || 2500})\n`;
    report += `Required Sources: ${rubric?.requiredSourceCount || 4}\n`;
    (rubric?.criteria || []).forEach((c, idx) => {
      report += `  Criteria ${idx + 1} [${c.weight}%]: ${c.category} - ${c.description} (Status: ${c.status})\n`;
    });

    report += `\n2. SCHOLARLY LITERATURE CURATION POOL (${references.length} Peer-Reviewed Articles):\n`;
    report += `------------------------------------------------------------------------\n`;
    references.forEach((r, idx) => {
      const auth = (r.authors || []).map((a) => a.name).join(', ');
      report += `  [${idx + 1}] "${r.title}" by ${auth} (${r.year || 'n.d.'})\n`;
      report += `      Venue: ${r.venue || 'Journal'} | DOI: ${r.doi || 'N/A'}\n`;
    });

    report += `\n3. CHRONOLOGICAL THOUGHT PROGRESSION MILESTONES:\n`;
    report += `------------------------------------------------------------------------\n`;
    progressionSteps.forEach((step, idx) => {
      report += `  [${step.timestamp}] ${step.stage.toUpperCase()}: ${step.summary}\n`;
      report += `     Details: ${step.details}\n\n`;
    });

    report += `========================================================================\n`;
    report += `End of Academic Integrity Verification Report.\n`;
    return report;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateAuditReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generateAuditReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Academic_Integrity_Dossier_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3F3F3] dark:bg-[#121212]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col text-[#1C1C1C] dark:text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F3F3F3] dark:bg-[#121212]/90 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1C1C] dark:text-gray-100">
                Academic Integrity & "Show Your Work" Progression
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Verifiable audit trail demonstrating student research and iterative drafting
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Integrity Banner */}
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-[#1C1C1C] dark:text-gray-100 text-xs">
                Transparent Research Progression
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-200 text-xs leading-relaxed">
              This dossier records the progressive steps of your inquiry from assignment ingestion,
              scholarly literature curation on Semantic Scholar, structured outline formulation, to
              final draft synthesis and professor rubric grading. Students can provide this report
              to professors to prove thought process and adherence to academic integrity guidelines.
            </p>
          </div>

          {/* Chronological Timeline */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-[#0078D4]" />
              <span>Milestone Progression Log</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
              {progressionSteps.map((step, idx) => (
                <div key={step.id || idx} className="relative space-y-1">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-900" />
                  </div>

                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0078D4] text-xs">{step.stage}</span>
                      <span className="text-[10px] text-gray-600 dark:text-gray-300">{step.timestamp}</span>
                    </div>
                    <p className="font-medium text-[#1C1C1C] dark:text-gray-100 text-xs">{step.summary}</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F3F3F3] dark:bg-[#121212]/90 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-md transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Dossier' : 'Copy Audit Dossier'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0078D4] bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt Dossier</span>
            </button>
          </div>

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
