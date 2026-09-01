import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ListTree,
  Plus,
  Check,
  ExternalLink,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Trash2,
  Quote,
  RefreshCw,
  Sliders,
  Send,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ScholarlyPaper, OutlineSection, CitationStyle, AssignmentRubric } from '../types';
import { formatInTextCitation, formatFullReference } from '../utils/citationFormatter';

interface RightPanelProps {
  rubric: AssignmentRubric | null;
  references: ScholarlyPaper[];
  onTogglePaperSelection: (paper: ScholarlyPaper) => void;
  onAddPaperToPool: (paper: ScholarlyPaper) => void;
  onRemovePaperFromPool: (paperId: string) => void;
  onInsertInTextToEditor: (paper: ScholarlyPaper, narrative?: boolean) => void;
  citationStyle: CitationStyle;
  studentDirection: string;
  onChangeStudentDirection: (direction: string) => void;
  outline: OutlineSection[];
  onGenerateOutline: () => Promise<void>;
  onDraftSection: (section: OutlineSection) => Promise<void>;
  onInsertDraftToEditor: (section: OutlineSection) => void;
  isSearching: boolean;
  isGeneratingOutline: boolean;
  draftingSectionId: string | null;
  onSearchSemanticScholar: (query: string) => Promise<ScholarlyPaper[]>;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  rubric,
  references,
  onTogglePaperSelection,
  onAddPaperToPool,
  onRemovePaperFromPool,
  onInsertInTextToEditor,
  citationStyle,
  studentDirection,
  onChangeStudentDirection,
  outline,
  onGenerateOutline,
  onDraftSection,
  onInsertDraftToEditor,
  isSearching,
  isGeneratingOutline,
  draftingSectionId,
  onSearchSemanticScholar,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'pool' | 'strategy'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScholarlyPaper[]>([]);
  const [expandedPaperIds, setExpandedPaperIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search Semantic Scholar API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = await onSearchSemanticScholar(searchQuery);
    setSearchResults(results);
  };

  const toggleAbstract = (paperId: string) => {
    setExpandedPaperIds((prev) => ({ ...prev, [paperId]: !prev[paperId] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isPaperSaved = (paperId: string) => {
    return references.some((r) => r.paperId === paperId);
  };

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-[calc(100vh-80px)] select-none">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-[#F3F3F3] dark:bg-[#121212]/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2.5 px-2 font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'search'
              ? 'text-[#0078D4] border-b-2 border-blue-500 bg-white dark:bg-gray-900/80 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Research</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pool')}
          className={`flex-1 py-2.5 px-2 font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'pool'
              ? 'text-[#0078D4] border-b-2 border-blue-500 bg-white dark:bg-gray-900/80 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reference Pool</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-[#0078D4] border border-blue-200">
            {references.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 py-2.5 px-2 font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'strategy'
              ? 'text-[#0078D4] border-b-2 border-blue-500 bg-white dark:bg-gray-900/80 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
          }`}
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>AI Strategy</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-gray-800 dark:text-gray-100">
        {/* Tab 1: Semantic Scholar Search */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Article Reference Assistant
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">
                Query Semantic Scholar API for peer-reviewed academic papers.
              </p>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Adolescent executive function screen time fMRI..."
                  className="w-full pl-3 pr-9 py-2 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[#1C1C1C] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-1.5 top-1.5 p-1 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition"
                  title="Search Semantic Scholar"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Quick Search Recommendations */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('prefrontal cortex algorithmic media attention');
                  }}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition"
                >
                  + dlPFC & Attention
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('working memory dual task digital media');
                  }}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition"
                >
                  + Working Memory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('micro learning digital visual search speed');
                  }}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition"
                >
                  + Visual Search
                </button>
              </div>
            </form>

            {/* Results List */}
            {isSearching ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-[#0078D4] animate-spin mx-auto" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">Searching Semantic Scholar...</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Retrieving titles, authors, and abstracts</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span>Found {searchResults.length} scholarly articles</span>
                  <span className="text-[11px] text-[#0078D4]">Select to save to pool</span>
                </div>

                {searchResults.map((paper) => {
                  const isSaved = isPaperSaved(paper.paperId);
                  const isExpanded = expandedPaperIds[paper.paperId] || false;
                  const authorsStr = (paper.authors || []).map((a) => a.name).join(', ');

                  return (
                    <div
                      key={paper.paperId}
                      className={`p-3 rounded-lg border transition text-xs ${
                        isSaved
                          ? 'bg-blue-50/30 border-blue-200/80 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Save Checkbox */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isSaved) {
                              onRemovePaperFromPool(paper.paperId);
                            } else {
                              onAddPaperToPool(paper);
                            }
                          }}
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition flex-shrink-0 ${
                            isSaved
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-400 hover:border-blue-400'
                          }`}
                          title={isSaved ? 'Remove from Reference Pool' : 'Add to Reference Pool'}
                        >
                          {isSaved && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#1C1C1C] dark:text-gray-100 leading-snug">
                            {paper.title}
                          </h4>
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                            {authorsStr || 'Anonymous'} ({paper.year || 'n.d.'})
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-600 dark:text-gray-300">
                            {paper.venue && (
                              <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 truncate max-w-[140px]">
                                {paper.venue}
                              </span>
                            )}
                            {paper.citationCount !== undefined && (
                              <span>{paper.citationCount} citations</span>
                            )}
                            {paper.url && (
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0078D4] hover:underline flex items-center gap-0.5 ml-auto"
                              >
                                <span>DOI</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Abstract Toggle */}
                          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700/50 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => toggleAbstract(paper.paperId)}
                              className="text-[11px] text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              <span>{isExpanded ? 'Hide Abstract' : 'View Abstract'}</span>
                            </button>

                            {isSaved && (
                              <button
                                type="button"
                                onClick={() => onInsertInTextToEditor(paper)}
                                className="text-[11px] text-[#0078D4] hover:text-[#0078D4] font-medium flex items-center gap-1"
                              >
                                <Quote className="w-3 h-3" />
                                <span>Insert Citation</span>
                              </button>
                            )}
                          </div>

                          {/* Expanded Abstract */}
                          {isExpanded && (
                            <div className="mt-2 p-2.5 rounded bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed">
                              <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Abstract:</p>
                              <p>{paper.abstract || 'No abstract available for this publication.'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800/30 border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-2">
                <Search className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto" />
                <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">Search for Scholarly Articles</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Search Semantic Scholar by topic, author, or research query.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Dynamic Reference Pool */}
        {activeTab === 'pool' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Saved Reference Pool ({references.length})
                </h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                  Formatted in <strong>{citationStyle}</strong>
                </p>
              </div>
            </div>

            {references.length > 0 ? (
              <div className="space-y-3">
                {references.map((paper, idx) => {
                  const inText = formatInTextCitation(paper, citationStyle);
                  const inTextNarrative = formatInTextCitation(paper, citationStyle, { narrative: true });
                  const fullBib = formatFullReference(paper, citationStyle, idx);
                  const isExpanded = expandedPaperIds[paper.paperId] || false;

                  return (
                    <div
                      key={paper.paperId}
                      className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-[#1C1C1C] dark:text-gray-100 leading-snug line-clamp-2">
                          {paper.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemovePaperFromPool(paper.paperId)}
                          className="p-1 text-gray-500 dark:text-gray-400 hover:text-rose-600 transition flex-shrink-0"
                          title="Remove from pool"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300">
                        {(paper.authors || []).map((a) => a.name).join(', ')} ({paper.year || 'n.d.'})
                      </p>

                      {/* In-Text Quick Buttons */}
                      <div className="p-2 rounded bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Parenthetical:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="text-[#0078D4] font-mono">{inText}</code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(inText, `${paper.paperId}-par`)}
                              className="p-0.5 text-gray-600 dark:text-gray-300 hover:text-[#1C1C1C] dark:text-gray-100"
                              title="Copy in-text"
                            >
                              {copiedId === `${paper.paperId}-par` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onInsertInTextToEditor(paper, false)}
                              className="px-1.5 py-0.5 rounded bg-blue-100/60 hover:bg-blue-200 text-[#0078D4] text-[10px]"
                              title="Insert into document"
                            >
                              Insert
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200 dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Narrative:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="text-[#0078D4] font-mono">{inTextNarrative}</code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(inTextNarrative, `${paper.paperId}-nar`)}
                              className="p-0.5 text-gray-600 dark:text-gray-300 hover:text-[#1C1C1C] dark:text-gray-100"
                              title="Copy narrative citation"
                            >
                              {copiedId === `${paper.paperId}-nar` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onInsertInTextToEditor(paper, true)}
                              className="px-1.5 py-0.5 rounded bg-blue-100/60 hover:bg-blue-200 text-[#0078D4] text-[10px]"
                              title="Insert narrative into document"
                            >
                              Insert
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Full Bibliography Entry */}
                      <div className="pt-1 flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-300">
                        <button
                          type="button"
                          onClick={() => toggleAbstract(paper.paperId)}
                          className="hover:text-gray-800 dark:text-gray-100 flex items-center gap-0.5"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          <span>{isExpanded ? 'Hide Abstract' : 'View Abstract'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(fullBib, `${paper.paperId}-bib`)}
                          className="hover:text-[#0078D4] flex items-center gap-1 text-gray-600 dark:text-gray-300"
                        >
                          {copiedId === `${paper.paperId}-bib` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Full Reference</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="p-2.5 rounded bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed">
                          <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Abstract:</p>
                          <p>{paper.abstract || 'No abstract available.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800/30 border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto" />
                <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">Reference Pool is Empty</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Search Semantic Scholar in the Research tab and add articles to your pool.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"
                >
                  Search Articles
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: AI Strategy & Cross-Referencing Engine */}
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Strategy & Cross-Referencing
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">
                Map your thesis and selected papers directly to an academic outline.
              </p>
            </div>

            {/* Student Direction / Thesis Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 block">
                Research Direction / Thesis Statement:
              </label>
              <textarea
                value={studentDirection}
                onChange={(e) => onChangeStudentDirection(e.target.value)}
                placeholder="Enter your central research question or thesis direction..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[#1C1C1C] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Generate Outline Action */}
            <button
              type="button"
              onClick={onGenerateOutline}
              disabled={isGeneratingOutline || references.length === 0}
              className="w-full py-2 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isGeneratingOutline ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Outline & Cross-References...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Generate Cross-Referenced Outline</span>
                </>
              )}
            </button>

            {references.length === 0 && (
              <p className="text-[10px] text-amber-600 text-center">
                * Please add at least 1-2 papers to your Reference Pool first.
              </p>
            )}

            {/* Generated Outline Sections */}
            {outline.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span>Structured Outline ({outline.length} Sections)</span>
                </div>

                {outline.map((sec, secIdx) => {
                  const isDrafting = draftingSectionId === sec.id;

                  return (
                    <div
                      key={sec.id}
                      className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[10px] font-mono text-[#0078D4] uppercase font-semibold">
                            Section {secIdx + 1} (~{sec.targetWordCount}w)
                          </span>
                          <h4 className="font-semibold text-[#1C1C1C] dark:text-gray-100 text-xs leading-snug">
                            {sec.heading}
                          </h4>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed">{sec.description}</p>

                      {/* Mapped Points & Citations */}
                      {sec.points && sec.points.length > 0 && (
                        <div className="pl-2 border-l-2 border-gray-300 dark:border-gray-700 space-y-1.5 text-[11px]">
                          {sec.points.map((p) => {
                            const citedArticles = references.filter((r) =>
                              p.citedPaperIds.includes(r.paperId)
                            );

                            return (
                              <div key={p.id} className="space-y-0.5">
                                <div className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-100">
                                  <span>• {p.title}</span>
                                  {p.isCounterArgument && (
                                    <span className="px-1 py-0.2 rounded text-[9px] bg-rose-50 text-rose-700 border border-rose-200">
                                      Counter-Argument
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-600 dark:text-gray-300">{p.description}</p>
                                {citedArticles.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {citedArticles.map((ca) => (
                                      <span
                                        key={ca.paperId}
                                        className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-[#0078D4] border border-blue-200"
                                      >
                                        Cite: {ca.authors?.[0]?.name?.split(/\s+/).pop() || 'Author'} (
                                        {ca.year || 'n.d.'})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Section Draft Actions */}
                      <div className="pt-2 border-t border-gray-300 dark:border-gray-700/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onDraftSection(sec)}
                          disabled={isDrafting}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-[11px] font-medium transition disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{isDrafting ? 'Drafting...' : 'Draft Section with AI'}</span>
                        </button>

                        {sec.draftContent && (
                          <button
                            type="button"
                            onClick={() => onInsertDraftToEditor(sec)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-medium transition"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Insert to Doc</span>
                          </button>
                        )}
                      </div>

                      {/* Draft Content Preview if Generated */}
                      {sec.draftContent && (
                        <div className="mt-2 p-2.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-700 dark:text-gray-200 font-serif leading-relaxed max-h-32 overflow-y-auto">
                          <p className="font-semibold text-emerald-600 font-sans text-[10px] mb-1">
                            Generated Draft Preview:
                          </p>
                          <p>{sec.draftContent}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
