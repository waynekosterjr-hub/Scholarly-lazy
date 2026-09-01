import React from 'react';
import {
  X,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  BookOpen,
  FileCheck,
  Check,
  TrendingUp,
} from 'lucide-react';
import { ReviewFeedback, AssignmentRubric } from '../types';

interface ProofreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: ReviewFeedback | null;
  rubric: AssignmentRubric | null;
  onApplyFix?: (fix: string) => void;
}

export const ProofreadModal: React.FC<ProofreadModalProps> = ({
  isOpen,
  onClose,
  feedback,
  rubric,
  onApplyFix,
}) => {
  if (!isOpen || !feedback) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 border-emerald-500 bg-emerald-50/40';
    if (score >= 80) return 'text-[#0078D4] border-blue-500 bg-blue-50/40';
    if (score >= 70) return 'text-amber-600 border-amber-500 bg-amber-50/40';
    return 'text-rose-600 border-rose-500 bg-rose-50/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3F3F3] dark:bg-[#121212]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-[#1C1C1C] dark:text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F3F3F3] dark:bg-[#121212]/90 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1C1C] dark:text-gray-100">
                Academic Professor Evaluation & Rubric Audit
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Strict evaluation against {rubric?.title || 'Assignment Rubric'}
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
          {/* Top Grade Summary Card */}
          <div className="p-5 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg ${getScoreColor(
                  feedback.overallScore
                )}`}
              >
                <span className="text-2xl font-black">{feedback.overallScore}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1C1C1C] dark:text-gray-100">
                    Grade: {feedback.letterGrade}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                    Peer-Reviewed Evaluation
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-xs max-w-lg">
                  {feedback.overallScore >= 90
                    ? 'Excellent scholarly rigor with coherent argumentation and APA compliance.'
                    : feedback.overallScore >= 80
                    ? 'Good scholarly foundation with minor opportunities to deepen evidence synthesis.'
                    : 'Requires revisions on rubric adherence, citation accuracy, and argument depth.'}
                </p>
              </div>
            </div>

            {/* Word Count Status */}
            <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center min-w-[180px]">
              <span className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400 block">
                Word Count Check
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {feedback.wordCountAnalysis?.currentWords?.toLocaleString() || 0} words
              </span>
              <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">
                Target: {feedback.wordCountAnalysis?.targetWords?.toLocaleString() || 2000}
              </p>
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50/20 border border-emerald-200/60 space-y-2">
              <h3 className="font-bold text-emerald-600 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Identified Strengths</span>
              </h3>
              <ul className="space-y-1.5 pl-4 list-disc text-gray-700 dark:text-gray-200">
                {feedback.strengths.map((s, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-rose-50/20 border border-rose-200/60 space-y-2">
              <h3 className="font-bold text-rose-600 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Weaknesses & Gaps</span>
              </h3>
              <ul className="space-y-1.5 pl-4 list-disc text-gray-700 dark:text-gray-200">
                {feedback.weaknesses.map((w, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Rubric Criteria Adherence Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#0078D4]" />
              <span>Rubric Criterion-by-Criterion Breakdown</span>
            </h3>

            <div className="space-y-2.5">
              {feedback.rubricAdherence.map((item, idx) => {
                const percent = Math.round((item.scoreObtained / item.maxScore) * 100);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.status === 'fulfilled' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : item.status === 'partially_met' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-[#1C1C1C] dark:text-gray-100 text-xs">
                          {item.criterionTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-300 text-[11px]">
                          <strong>{item.scoreObtained}</strong> / {item.maxScore} pts ({percent}%)
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-700 dark:text-gray-200 pl-6 leading-relaxed">
                      {item.feedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* In-Text Citation Verification Table */}
          {feedback.citationChecks && feedback.citationChecks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>In-Text Citation & APA Style Verification</span>
              </h3>

              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F3F3F3] dark:bg-[#121212] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="py-2 px-3 font-semibold">In-Text Citation</th>
                      <th className="py-2 px-3 font-semibold">Reference Match</th>
                      <th className="py-2 px-3 font-semibold">Style Compliant</th>
                      <th className="py-2 px-3 font-semibold">Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-900/60">
                    {feedback.citationChecks.map((cit, idx) => (
                      <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800/40">
                        <td className="py-2 px-3 font-mono text-[#0078D4]">{cit.citationText}</td>
                        <td className="py-2 px-3">
                          {cit.paperFound ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-medium">
                              <Check className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-rose-600 font-medium">Not in pool</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {cit.styleCompliant ? (
                            <span className="text-emerald-600 font-medium">Valid APA</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Style issue</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-300 text-[11px]">{cit.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actionable Suggestions */}
          {feedback.actionableSuggestions && feedback.actionableSuggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Actionable Recommendations</span>
              </h3>

              <div className="space-y-2">
                {feedback.actionableSuggestions.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
                          {rec.priority} Priority
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{rec.section}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 text-[11px] leading-relaxed">
                        <strong className="text-gray-600 dark:text-gray-300">Issue:</strong> {rec.issue}
                      </p>
                      <p className="text-[#0078D4] text-[11px] leading-relaxed">
                        <strong className="text-[#0078D4]">Fix:</strong> {rec.suggestion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F3F3F3] dark:bg-[#121212]/90 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Audit generated by ScholarDesk Academic Review Engine
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#1C1C1C] dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-md transition"
          >
            Close Evaluation
          </button>
        </div>
      </div>
    </div>
  );
};
