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
  FilePlus,
  FolderKanban,
  UploadCloud,
  HelpCircle,
  Cloud,
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
  onOpenNewPaper: () => void;
  onOpenPastProjects: () => void;
  onOpenImport: () => void;
  onOpenTutorial: () => void;
  onStartGuidedTour: () => void;
  savedPaperCount?: number;
  isSavingToCloud?: boolean;
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
  onOpenNewPaper,
  onOpenPastProjects,
  onOpenImport,
  onOpenTutorial,
  onStartGuidedTour,
  savedPaperCount = 0,
  isSavingToCloud = false,
  isProofreading = false,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const targetWords = rubric?.requiredWordCount?.target || 2000;
  const minWords = rubric?.requiredWordCount?.min || 1500;
  const maxWords = rubric?.requiredWordCount?.max || 2500;
  const wordPercent = Math.min(Math.round((wordCount / targetWords) * 100), 100);

  const getWordCountColor = () => {
    if (wordCount >= minWords && wordCount <= maxWords) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    if (wordCount < minWords) return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-[#1C1C1C] dark:text-gray-100 select-none sticky top-0 z-30 shadow-md">
      {/* Windows 11 Title Bar Simulation */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#F3F3F3] dark:bg-[#121212]/80 border-b border-gray-200 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-200">
            <GraduationCap className="w-3.5 h-3.5 text-[#0078D4]" />
            <span className="font-semibold">ScholarDesk</span>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <span className="text-gray-600 dark:text-gray-300 font-normal">Academic Writing & Research Studio</span>
          </div>

          {/* Quick Cloud Save Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <Cloud className={`w-3.5 h-3.5 ${isSavingToCloud ? 'text-amber-500 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span>{isSavingToCloud ? 'Saving to Google Cloud...' : 'Saved to Cloud'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onStartGuidedTour}
            className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            title="Start Interactive Guided Tour"
          >
            <Sparkles className="w-3 h-3" />
            <span>Guided Tour</span>
          </button>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            title="View App Functions & Info"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Functions Info</span>
          </button>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Semantic Scholar: Connected</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>AI Model:</span>
            <select
              aria-label="AI Reasoning Engine Selector"
              className="bg-transparent text-gray-700 dark:text-gray-200 font-medium focus:outline-none cursor-pointer hover:text-[#1C1C1C] dark:text-gray-100 transition-colors"
              defaultValue="gemini-3.5-flash"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900">
        {/* Left: Project Controls & Title */}
        <div className="flex items-center gap-2">
          {/* New Paper Button */}
          <button
            type="button"
            onClick={onOpenNewPaper}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white shadow-sm transition flex-shrink-0"
            title="Create New Blank Paper"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New Paper</span>
          </button>

          {/* Past Projects Button */}
          <button
            type="button"
            onClick={onOpenPastProjects}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition flex-shrink-0"
            title="Browse Saved Papers from your Google Account"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Past Projects</span>
            {savedPaperCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-[#0078D4]">
                {savedPaperCount}
              </span>
            )}
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 transition flex-shrink-0"
            title="Import existing essay/paper, collapse left panel, and identify sources"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-1 hidden sm:block" />

          {/* Project Title Display */}
          <div className="hidden lg:flex items-center gap-2 max-w-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-[#0078D4] flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-[#1C1C1C] dark:text-gray-100 leading-tight truncate">
                {rubric?.title || 'Untitled Workspace'}
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {rubric?.courseName || 'General Academic Draft'}
              </p>
            </div>
          </div>

          {/* Sample Loader Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 transition"
              title="Load Pre-configured Assignment Scenario"
            >
              <Layers className="w-3 h-3 text-gray-500" />
              <span className="hidden md:inline">Samples</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                Sample Course Templates
              </div>
              <button
                type="button"
                onClick={() => onSelectSample('cognitive-psych')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col gap-0.5"
              >
                <span className="font-medium text-[#0078D4]">Cognitive Neuroscience (APA 7)</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Adolescent Attention & Algorithmic Feeds</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectSample('environmental-econ')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col gap-0.5"
              >
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Environmental Economics (APA 7)</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Carbon Pricing vs Clean Tech Subsidies</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Live Word Progress & Citation Style */}
        <div className="flex items-center gap-2.5">
          {/* Word Count Progress */}
          <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-2 ${getWordCountColor()}`}>
            <span>
              <strong>{wordCount.toLocaleString()}</strong> / {targetWords.toLocaleString()} words
            </span>
            <div className="w-14 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  wordCount >= minWords && wordCount <= maxWords ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${wordPercent}%` }}
              />
            </div>
            <span className="text-[10px] opacity-80">({wordPercent}%)</span>
          </div>

          {/* Citation Style Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-[#0078D4]" />
            <select
              aria-label="Academic citation style selector"
              value={citationStyle}
              onChange={(e) => onCitationStyleChange(e.target.value as CitationStyle)}
              className="bg-transparent text-[#1C1C1C] dark:text-gray-100 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="APA7" className="bg-white dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                APA 7th
              </option>
              <option value="MLA9" className="bg-white dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                MLA 9th
              </option>
              <option value="CHICAGO" className="bg-white dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                Chicago
              </option>
              <option value="IEEE" className="bg-white dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
                IEEE
              </option>
              <option value="HARVARD" className="bg-white dark:bg-gray-800 text-[#1C1C1C] dark:text-gray-100">
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
            className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Show Your Work Integrity Report */}
          <button
            type="button"
            onClick={onOpenShowYourWork}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg transition shadow-sm"
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
            className="tour-proofread flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-100 bg-purple-600 hover:bg-purple-500 rounded-lg transition shadow-sm disabled:opacity-50"
            title="Run Strict Academic Professor Review against Rubric"
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-200" />
            <span>{isProofreading ? 'Reviewing...' : 'Professor Review'}</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-sm"
            title="Export to Word (.docx), PDF, or Text"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 border border-gray-300 dark:border-gray-700 transition ml-1"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

