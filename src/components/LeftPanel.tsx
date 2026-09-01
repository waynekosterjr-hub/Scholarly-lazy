import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { AssignmentRubric, RubricCriterion, ProgressionStep } from '../types';

interface LeftPanelProps {
  rubric: AssignmentRubric | null;
  onUpdateRubric: (rubric: AssignmentRubric) => void;
  onExtractRubric: (payload: { rawText?: string; imageBase64?: string; imageMimeType?: string; pdfBase64?: string }) => Promise<void>;
  isLoading: boolean;
  progressionSteps: ProgressionStep[];
  onOpenShowYourWork: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  rubric,
  onUpdateRubric,
  onExtractRubric,
  isLoading,
  progressionSteps,
  onOpenShowYourWork,
}) => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'ingest' | 'constraints'>('rubric');
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onExtractRubric({ imageBase64: base64, imageMimeType: file.type });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onExtractRubric({ pdfBase64: base64 });
      };
      reader.readAsDataURL(file);
    } else {
      // Text file
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onExtractRubric({ rawText: text });
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onExtractRubric({ rawText: pastedText });
  };

  const toggleCriterionStatus = (critId: string) => {
    if (!rubric) return;
    const nextCriteria = rubric.criteria.map((c) => {
      if (c.id === critId) {
        const nextStatus = c.status === 'fulfilled' ? 'unmet' : c.status === 'unmet' ? 'partially_met' : 'fulfilled';
        return { ...c, status: nextStatus as 'fulfilled' | 'partially_met' | 'unmet' };
      }
      return c;
    });
    onUpdateRubric({ ...rubric, criteria: nextCriteria });
  };

  const toggleExpand = (id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fulfilledCount = rubric?.criteria.filter((c) => c.status === 'fulfilled').length || 0;
  const totalCriteria = rubric?.criteria.length || 0;

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-[calc(100vh-80px)] select-none">
      {/* Panel Top Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-[#F3F3F3] dark:bg-[#121212]/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('rubric')}
          className={`flex-1 py-2.5 px-3 font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'rubric'
              ? 'text-[#0078D4] border-b-2 border-blue-500 bg-white dark:bg-gray-900/80 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Rubric Criteria</span>
          {rubric && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              {fulfilledCount}/{totalCriteria}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('constraints')}
          className={`flex-1 py-2.5 px-3 font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'constraints'
              ? 'text-[#0078D4] border-b-2 border-blue-500 bg-white dark:bg-gray-900/80 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Constraints</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ingest')}
          className={`py-2.5 px-3 font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'ingest'
              ? 'text-[#0078D4] border-b-2 border-blue-500 bg-white dark:bg-gray-900/80 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
          }`}
          title="Upload New Syllabus / Assignment"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-gray-800 dark:text-gray-100">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="p-4 rounded-lg bg-blue-50/40 border border-blue-200/50 flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-5 h-5 text-[#0078D4] animate-spin" />
            <div className="text-xs">
              <p className="font-semibold text-[#0078D4]">AI Parsing Assignment & Rubric...</p>
              <p className="text-gray-600 dark:text-gray-300 text-[11px]">Performing OCR & extracting grading criteria</p>
            </div>
          </div>
        )}

        {/* Tab 1: Rubric Criteria Checklist */}
        {activeTab === 'rubric' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Grading Rubric Checklist
                </h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                  Click checkboxes to toggle fulfillment status
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ingest')}
                className="text-[11px] text-[#0078D4] hover:underline flex items-center gap-1"
              >
                <Upload className="w-3 h-3" /> Re-parse
              </button>
            </div>

            {/* Criteria List */}
            {rubric?.criteria && rubric.criteria.length > 0 ? (
              <div className="space-y-2.5">
                {rubric.criteria.map((crit) => {
                  const isExpanded = expandedCriteria[crit.id] || false;
                  return (
                    <div
                      key={crit.id}
                      className={`p-3 rounded-lg border transition text-xs ${
                        crit.status === 'fulfilled'
                          ? 'bg-emerald-50/20 border-emerald-200/60'
                          : crit.status === 'partially_met'
                          ? 'bg-amber-50/20 border-amber-200/60'
                          : 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700/70 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleCriterionStatus(crit.id)}
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition ${
                            crit.status === 'fulfilled'
                              ? 'bg-emerald-600 text-white'
                              : crit.status === 'partially_met'
                              ? 'bg-amber-600 text-white'
                              : 'border border-gray-400 hover:border-gray-500'
                          }`}
                          title={`Status: ${crit.status}. Click to change.`}
                        >
                          {crit.status === 'fulfilled' && <Check className="w-3 h-3 stroke-[3]" />}
                          {crit.status === 'partially_met' && <div className="w-2 h-0.5 bg-white dark:bg-gray-900" />}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-[#1C1C1C] dark:text-gray-100">{crit.category}</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                              {crit.weight}%
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed">
                            {crit.description}
                          </p>

                          {/* Expandable Guidelines */}
                          {crit.guidelines && crit.guidelines.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700/50">
                              <button
                                type="button"
                                onClick={() => toggleExpand(crit.id)}
                                className="text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 flex items-center gap-1"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <span>{crit.guidelines.length} Specific Guidelines</span>
                              </button>
                              {isExpanded && (
                                <ul className="mt-1.5 pl-3 space-y-1 text-[10px] text-gray-600 dark:text-gray-300 list-disc">
                                  {crit.guidelines.map((g, idx) => (
                                    <li key={idx}>{g}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">No rubric parsed yet</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Upload your assignment PDF/screenshot or paste syllabus text.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ingest')}
                  className="mt-3 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"
                >
                  Upload Syllabus
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Topic Constraints & Core Questions */}
        {activeTab === 'constraints' && (
          <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700">
                <span className="text-[10px] uppercase text-gray-600 dark:text-gray-300 font-semibold block">Word Range</span>
                <span className="text-sm font-bold text-[#1C1C1C] dark:text-gray-100">
                  {rubric?.requiredWordCount?.min} - {rubric?.requiredWordCount?.max}
                </span>
                <span className="text-[10px] text-gray-600 dark:text-gray-300 block">Target: {rubric?.requiredWordCount?.target}w</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700">
                <span className="text-[10px] uppercase text-gray-600 dark:text-gray-300 font-semibold block">Required Sources</span>
                <span className="text-sm font-bold text-[#0078D4]">
                  {rubric?.requiredSourceCount || 4}+ Peer-Reviewed
                </span>
                <span className="text-[10px] text-gray-600 dark:text-gray-300 block">Style: {rubric?.requiredCitationStyle || 'APA 7'}</span>
              </div>
            </div>

            {/* Key Questions to Answer */}
            {rubric?.keyQuestionsToAnswer && rubric.keyQuestionsToAnswer.length > 0 && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/80 space-y-2">
                <h4 className="text-xs font-semibold text-[#0078D4] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Key Questions to Address</span>
                </h4>
                <ul className="space-y-1.5 pl-3 list-disc text-xs text-gray-700 dark:text-gray-200">
                  {rubric.keyQuestionsToAnswer.map((q, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topic Boundaries / Constraints */}
            {rubric?.topicConstraints && rubric.topicConstraints.length > 0 && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/80 space-y-2">
                <h4 className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Topic Scope & Constraints</span>
                </h4>
                <ul className="space-y-1.5 pl-3 list-disc text-xs text-gray-700 dark:text-gray-200">
                  {rubric.topicConstraints.map((tc, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {tc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formatting Specifications */}
            {rubric?.formattingRules && rubric.formattingRules.length > 0 && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/80 space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Formatting & Mechanics</span>
                </h4>
                <ul className="space-y-1.5 pl-3 list-disc text-xs text-gray-600 dark:text-gray-300">
                  {rubric.formattingRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Assignment Ingestion (Dropzone & Text Input) */}
        {activeTab === 'ingest' && (
          <div className="space-y-4">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <p className="font-medium text-gray-800 dark:text-gray-100">Ingest Assignment & Rubric</p>
              <p className="text-[11px]">
                Drop PDF syllabus, assignment guidelines, or screenshot for automated OCR & rubric parsing.
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-lg border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/40 text-[#0078D4]'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-full bg-blue-100/40 text-[#0078D4] flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                  Drop PDF, image screenshot, or text
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Supports PDF, PNG, JPG, TXT</p>
              </div>
            </div>

            {/* Direct Text Syllabus Form */}
            <form onSubmit={handleTextSubmit} className="space-y-2">
              <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300 block">
                Or paste assignment text / prompt:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste rubric instructions, syllabus requirements, or essay questions here..."
                rows={5}
                className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[#1C1C1C] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              ></textarea>
              <button
                type="submit"
                disabled={isLoading || !pastedText.trim()}
                className="w-full py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Extract Rubric with Gemini</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Panel Bottom: Academic Integrity Status */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-[#F3F3F3] dark:bg-[#121212]/60">
        <button
          type="button"
          onClick={onOpenShowYourWork}
          className="w-full flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition group"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <span className="font-medium block leading-tight">Academic Integrity Log</span>
              <span className="text-[10px] text-gray-600 dark:text-gray-300">{progressionSteps.length} milestone records</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:text-gray-200 transition" />
        </button>
      </div>
    </aside>
  );
};
