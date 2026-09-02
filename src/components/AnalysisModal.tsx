import React from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  ShieldCheck,
  Award,
  Layers,
  ListOrdered,
  ArrowRight,
} from 'lucide-react';
import { ImportAnalysisResult, ScholarlyPaper } from '../types';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ImportAnalysisResult | null;
  extractedPapers: ScholarlyPaper[];
  onAddSourcesToPool: (papers: ScholarlyPaper[]) => void;
  onOpenRubricUpload: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  extractedPapers,
  onAddSourcesToPool,
  onOpenRubricUpload,
}) => {
  if (!isOpen || !analysis) return null;

  const sources = analysis.identifiedSources || [];
  const evalData = analysis.overallEvaluation;
  const rubricAlignment = analysis.rubricAlignment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                AI Document Analysis & Source Breakdown
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Extracted {sources.length} cited source{sources.length === 1 ? '' : 's'} • {analysis.wordCount || 0} words
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Missing Rubric Banner if not found */}
          {!analysis.rubricFound && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    No Assignment Rubric Detected
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    This analysis was performed using universal scholarly writing standards. For tailored grading, upload your course syllabus.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRubricUpload();
                }}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition flex items-center gap-1"
              >
                <span>Add Rubric</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0078D4]" />
                Executive Assessment
              </span>
              {evalData?.estimatedGradeBand && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Estimated Grade: {evalData.estimatedGradeBand}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {evalData?.executiveSummary}
            </p>
          </div>

          {/* Identified Sources Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0078D4]" />
                Identified Sources Used in Document ({sources.length})
              </h4>

              {extractedPapers.length > 0 && (
                <button
                  type="button"
                  onClick={() => onAddSourcesToPool(extractedPapers)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add All ({extractedPapers.length}) to Reference Pool</span>
                </button>
              )}
            </div>

            {sources.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                No formal in-text citations or bibliography entries were detected in this document.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/40 text-xs space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                        {src.paperTitle}
                      </p>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-50 dark:bg-blue-900/30 text-[#0078D4] flex-shrink-0">
                        {src.inTextOccurrences}x cited
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                      {(src.authors || []).join(', ')} {src.year ? `(${src.year})` : ''}
                    </p>

                    <div className="p-1.5 rounded bg-gray-50 dark:bg-gray-900/60 text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">
                      {src.rawCitation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rubric Alignment if present */}
          {rubricAlignment && rubricAlignment.matchedCriteria && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Rubric Alignment Score: {rubricAlignment.alignmentScore}%
                </h4>
              </div>

              <div className="space-y-2">
                {rubricAlignment.matchedCriteria.map((c, idx) => {
                  const statusColors = {
                    strong: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200',
                    moderate: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200',
                    weak: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200',
                    missing: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200',
                  };

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/40 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {c.criterionTitle}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            statusColors[c.status] || statusColors.moderate
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      {c.evidenceSnippet && (
                        <p className="text-gray-500 dark:text-gray-400 italic text-[11px]">
                          "{c.evidenceSnippet}"
                        </p>
                      )}

                      <p className="text-gray-700 dark:text-gray-300 text-[11px] font-medium">
                        💡 {c.recommendation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths & Actionable Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
              <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Key Scholarly Strengths
              </h5>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                {(evalData?.strengths || []).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Immediate Action Items */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-2">
              <h5 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-[#0078D4]" />
                Immediate Recommendations
              </h5>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                {(evalData?.immediateActionItems || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#0078D4] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#161616]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white shadow-sm transition"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
