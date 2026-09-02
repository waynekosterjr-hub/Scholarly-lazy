import React, { useState } from 'react';
import { FilePlus, X, BookOpen, Layers, Sparkles } from 'lucide-react';
import { CitationStyle } from '../types';

interface NewPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    title: string;
    courseName: string;
    citationStyle: CitationStyle;
    targetWords: number;
  }) => void;
}

export const NewPaperModal: React.FC<NewPaperModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA7');
  const [targetWords, setTargetWords] = useState<number>(2000);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      courseName: courseName.trim(),
      citationStyle,
      targetWords: Number(targetWords) || 2000,
    });
    // Reset
    setTitle('');
    setCourseName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0078D4] flex items-center justify-center">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Create New Paper</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Initialize a clean academic workspace</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
              Paper Title or Working Topic <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cognitive Effects of Digital Media on Adolescent Attention"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
                Course / Seminar (Optional)
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. PSYC 4020 / Dr. Vance"
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
                Target Word Count
              </label>
              <input
                type="number"
                min={200}
                max={50000}
                step={100}
                value={targetWords}
                onChange={(e) => setTargetWords(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
              Required Citation Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['APA7', 'MLA9', 'CHICAGO', 'IEEE', 'HARVARD'] as CitationStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setCitationStyle(style)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition ${
                    citationStyle === style
                      ? 'bg-blue-50 dark:bg-blue-900/40 border-[#0078D4] text-[#0078D4] font-semibold ring-1 ring-[#0078D4]'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {style === 'APA7' && 'APA 7th'}
                  {style === 'MLA9' && 'MLA 9th'}
                  {style === 'CHICAGO' && 'Chicago'}
                  {style === 'IEEE' && 'IEEE'}
                  {style === 'HARVARD' && 'Harvard'}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#0078D4] hover:bg-blue-600 text-white rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Paper</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
