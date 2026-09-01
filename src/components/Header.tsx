import React from 'react';
import {
  FileText,
  Sparkles,
  Download,
  BookOpen,
  GraduationCap,
  History,
  CheckCircle2,
  Layers,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { CitationStyle, AssignmentRubric } from '../types';
import { logout } from '../lib/firebase';

interface HeaderProps {
  rubric: AssignmentRubric | null;
  wordCount: number;
  citationStyle: CitationStyle;
  onCitationStyleChange: (style: CitationStyle) => void;
  onOpenProofread: () => void;
  onOpenShowYourWork: () => void;
  onOpenExport: () => void;
  onSelectSample: (id: string) => void;
  isProofreading?: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: (e: React.MouseEvent) => void;
}

export const Header: React.FC<HeaderProps> = ({
  rubric,
  wordCount,
  citationStyle,
  onCitationStyleChange,
  onOpenProofread,
  onOpenShowYourWork,
  onOpenExport,
  onSelectSample,
  isProofreading = false,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const targetWords = rubric?.requiredWordCount?.target || 2000;
  const minWords = rubric?.requiredWordCount?.min || 1500;
  const maxWords = rubric?.requiredWordCount?.max || 2500;
  const wordPercent = Math.min(Math.round((wordCount / targetWords) * 100), 100);

  const getWordCountColor = () => {
    if (wordCount >= minWords && wordCount <= maxWords) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (wordCount < minWords) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-[#1C1C1C] dark:text-gray-100 select-none sticky top-0 z-30 shadow-md">
      {/* Windows 11 Title Bar Simulation */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#F3F3F3] dark:bg-[#121212]/80 border-b border-gray-200 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-200">
            <GraduationCap className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>ScholarDesk</span>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <span className="text-gray-600 dark:text-gray-300 font-normal">Academic Writing & Research Studio (v2.6)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Semantic Scholar API: Connected</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>AI Reasoning:</span>
            <select
              aria-label="AI Reasoning Engine Selector"
              className="bg-transparent text-gray-700 dark:text-gray-200 font-medium focus:outline-none cursor-pointer hover:text-[#1C1C1C] dark:text-gray-100 transition-colors"
              defaultValue="gemini-3.7-flash"
            >
              <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
              <option value="gemini-3.6-pro">Gemini 3.6 Pro</option>
              <option value="local-ollama">Local Inference (Ollama)</option>
              <option value="external-api">External API (BYOK)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900">
        {/* Left: Project Title & Quick Load */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-200 flex items-center justify-center text-[#0078D4]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#1C1C1C] dark:text-gray-100 leading-tight truncate max-w-xs md:max-w-md">
                {rubric?.title || 'Academic Writing Workspace'}
              </h1>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate max-w-xs">
                {rubric?.courseName || 'Upload syllabus or select sample scenario'}
              </p>
            </div>
          </div>

          {/* Sample Loader Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition"
              title="Load Pre-configured Assignment Scenario"
            >
              <Layers className="w-3 h-3 text-[#0078D4]" />
              <span>Sample Papers</span>
              <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="absolute left-0 mt-1 w-72 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                Load Academic Scenario
              </div>
              <button
                type="button"
                onClick={() => onSelectSample('cognitive-psych')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col gap-0.5"
              >
                <span className="font-medium text-[#0078D4]">Cognitive Neuroscience (APA 7)</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300">Adolescent Attention & Algorithmic Feeds</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectSample('environmental-econ')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col gap-0.5"
              >
                <span className="font-medium text-emerald-700">Environmental Economics (APA 7)</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300">Carbon Pricing vs Clean Tech Subsidies</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Live Word Progress & Citation Style */}
        <div className="flex items-center gap-3">
          {/* Word Count Progress */}
          <div className={`px-3 py-1 rounded-md border text-xs font-medium flex items-center gap-2 ${getWordCountColor()}`}>
            <span>
              <strong>{wordCount.toLocaleString()}</strong> / {targetWords.toLocaleString()} words
            </span>
            <div className="w-16 h-1.5 rounded-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  wordCount >= minWords && wordCount <= maxWords ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${wordPercent}%` }}
              ></div>
            </div>
            <span className="text-[10px] opacity-80">({wordPercent}%)</span>
          </div>

          {/* Citation Style Selector */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2.5 py-1 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-[#0078D4]" />
            <span className="text-gray-600 dark:text-gray-300">Style:</span>
            <select
              aria-label="Academic citation style selector"
              value={citationStyle}
              onChange={(e) => onCitationStyleChange(e.target.value as CitationStyle)}
              className="bg-transparent text-[#1C1C1C] dark:text-gray-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="APA7" className="bg-gray-100 dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                APA 7th
              </option>
              <option value="MLA9" className="bg-gray-100 dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                MLA 9th
              </option>
              <option value="CHICAGO" className="bg-gray-100 dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                Chicago (Author-Date)
              </option>
              <option value="IEEE" className="bg-gray-100 dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                IEEE
              </option>
              <option value="HARVARD" className="bg-gray-100 dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                Harvard
              </option>
            </select>
          </div>
        </div>

        {/* Right: Key Action Triggers */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          {/* Sign Out */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 border border-gray-300 dark:border-gray-700 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          {/* Show Your Work Integrity Report */}
          <button
            type="button"
            onClick={onOpenShowYourWork}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-md transition shadow-sm"
            title="View Academic Integrity & Thought Progression Log"
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Show Your Work</span>
          </button>

          {/* Strict Academic Review Button */}
          <button
            type="button"
            onClick={onOpenProofread}
            disabled={isProofreading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-purple-100 bg-purple-600 hover:bg-purple-500 border border-purple-500/60 rounded-md transition shadow-sm disabled:opacity-50"
            title="Run Strict Academic Professor Review against Rubric"
          >
            <GraduationCap className="w-4 h-4 text-purple-200" />
            <span>{isProofreading ? 'Reviewing...' : 'Professor Review'}</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/60 rounded-md transition shadow-sm"
            title="Export to Word (.docx), PDF, or Text"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
