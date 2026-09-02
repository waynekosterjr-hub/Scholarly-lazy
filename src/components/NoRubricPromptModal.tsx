import React from 'react';
import { AlertCircle, FileCheck, ArrowRight, X, Sparkles } from 'lucide-react';

interface NoRubricPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRubricUpload: () => void;
  onContinueAnyway: () => void;
}

export const NoRubricPromptModal: React.FC<NoRubricPromptModalProps> = ({
  isOpen,
  onClose,
  onOpenRubricUpload,
  onContinueAnyway,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 px-6 py-4 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                No Rubric or Directions Detected
              </h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Recommended for highest evaluation accuracy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            ScholarDesk delivers the most accurate proofreading and source verification when evaluated against your specific course syllabus, assignment prompts, or rubric criteria.
          </p>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs space-y-2">
            <p className="font-semibold text-gray-800 dark:text-gray-200">Why provide directions?</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-[11px]">
              <li>Aligns citations with required source counts and styles</li>
              <li>Grades specific thesis constraints and critical questions</li>
              <li>Calculates exact grade bands based on your professor's weights</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRubricUpload();
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white shadow-sm transition flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Provide Rubric / Assignment Guidelines</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onContinueAnyway();
              }}
              className="w-full py-2 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              Continue with Universal Academic Standards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
