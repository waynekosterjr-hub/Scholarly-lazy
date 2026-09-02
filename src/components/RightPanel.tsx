import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronsLeft,
  Lightbulb,
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
  documentContent?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  documentContent = '',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'pool' | 'strategy'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScholarlyPaper[]>([]);
  const [expandedPaperIds, setExpandedPaperIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ query: string; label: string; rationale?: string }[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Derive dynamic context-aware suggestions from center panel text & left panel rubric
  const dynamicSuggestions = React.useMemo(() => {
    const list: { query: string; label: string }[] = [];

    // 1. From Rubric
    if (rubric) {
      if (rubric.title) {
        list.push({ query: `${rubric.title} empirical meta-analysis`, label: `Topic: ${rubric.title.slice(0, 20)}...` });
      }
      if (rubric.keyQuestionsToAnswer && rubric.keyQuestionsToAnswer.length > 0) {
        const q = rubric.keyQuestionsToAnswer[0].replace(/[?.,]/g, '');
        list.push({ query: q, label: 'Key Question' });
      }
      if (rubric.topicConstraints && rubric.topicConstraints.length > 0) {
        list.push({ query: `${rubric.topicConstraints[0]} systematic review`, label: 'Constraint' });
      }
      if (rubric.criteria && rubric.criteria.length > 0) {
        const crit = rubric.criteria[0];
        list.push({ query: `${crit.category} research literature`, label: crit.category.slice(0, 16) });
      }
    }

    // 2. From Center Panel Draft
    if (documentContent && documentContent.trim().length > 30) {
      const headings = documentContent.match(/^(?:#|\b[A-Z][a-zA-Z\s]{4,30}:)/gm);
      if (headings && headings.length > 0) {
        const cleanHeading = headings[0].replace(/^#+\s*/, '').trim();
        list.push({ query: `${cleanHeading} evidence study`, label: `Draft: ${cleanHeading.slice(0, 18)}` });
      }

      // Check for prominent keywords
      if (documentContent.toLowerCase().includes('dorsolateral') || documentContent.toLowerCase().includes('dlpfc')) {
        list.push({ query: 'dorsolateral prefrontal cortex executive control fMRI', label: 'dlPFC fMRI' });
      }
      if (documentContent.toLowerCase().includes('memory') || documentContent.toLowerCase().includes('cognit')) {
        list.push({ query: 'working memory digital media task switching', label: 'Working Memory' });
      }
      if (documentContent.toLowerCase().includes('attention') || documentContent.toLowerCase().includes('multitask')) {
        list.push({ query: 'media multitasking attention cognitive control', label: 'Media Multitasking' });
      }
    }

    // Fallbacks if nothing detected yet
    if (list.length === 0) {
      list.push(
        { query: 'prefrontal cortex algorithmic media attention', label: 'dlPFC & Attention' },
        { query: 'working memory dual task digital media', label: 'Working Memory' },
        { query: 'digital visual search cognitive speed', label: 'Visual Search' },
        { query: 'empirical neural correlates media multitasking', label: 'Neural Correlates' }
      );
    }

    return list.slice(0, 6);
  }, [rubric, documentContent]);

  // AI-powered suggestion fetcher from backend
  const fetchAiSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      const res = await fetch('/api/scholarly/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: documentContent,
          rubric,
          studentDirection,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestions && data.suggestions.length > 0) {
          setAiSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Search Semantic Scholar API
  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || searchQuery;
    if (!q.trim()) return;
    const results = await onSearchSemanticScholar(q);
    setSearchResults(results);
  };

  const handleApplySuggestion = (query: string) => {
    setSearchQuery(query);
    handleSearch(undefined, query);
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

  if (isCollapsed) {
    return (
      <aside
        onClick={onToggleCollapse}
        className="tour-search w-11 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-3 select-none transition-all duration-300 ease-in-out relative group cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 z-10"
        title="Expand Research & Outline Panel (Click to open)"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-[#0078D4] group-hover:text-white transition-all shadow-sm"
          title="Expand Research & Outline"
          aria-label="Expand Research & Outline"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center gap-2 mt-6">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#0078D4] flex items-center justify-center">
            <Search className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0078D4] dark:text-blue-300">
            {references.length}
          </span>
        </div>

        <div className="-rotate-90 whitespace-nowrap text-[11px] font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 group-hover:text-[#0078D4] transition-colors mt-20">
          Research & AI
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="tour-search w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-[calc(100vh-80px)] select-none transition-all duration-300 ease-in-out relative"
    >
      {/* Tab Navigation with Minimize Button */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-800 bg-[#F3F3F3] dark:bg-[#121212]/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`tour-search flex-1 py-2.5 px-3 font-medium flex items-center justify-center gap-1.5 transition ${
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
          className={`flex-1 py-2.5 px-3 font-medium flex items-center justify-center gap-1.5 transition ${
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
          className={`tour-outline flex-1 py-2.5 px-3 font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'strategy'
              ? 'text-[#0078D4] border-b-2 border-blue-500 bg-white dark:bg-gray-900/80 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100'
          }`}
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>AI Strategy</span>
        </button>

        {/* Minimize Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="px-2.5 py-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition"
            title="Minimize Research & Strategy Panel"
            aria-label="Minimize Research & Strategy Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
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

              {/* Context-Aware Search Suggestions (Related to Center & Left Panels) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    Context-Aware Suggestions (Center Draft & Rubric)
                  </span>
                  <button
                    type="button"
                    onClick={fetchAiSuggestions}
                    disabled={isLoadingSuggestions}
                    className="text-[10px] text-[#0078D4] hover:underline flex items-center gap-0.5"
                    title="Generate AI-powered literature queries matching your center text and rubric"
                  >
                    {isLoadingSuggestions ? (
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5" />
                    )}
                    <span>AI Deep Suggest</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(aiSuggestions.length > 0 ? aiSuggestions : dynamicSuggestions).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySuggestion(item.query)}
                      className="px-2 py-1 text-[10px] rounded-md bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0078D4] dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition flex items-center gap-1 text-left"
                      title={item.query}
                    >
                      <span>+ {item.label}</span>
                    </button>
                  ))}
                </div>
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
                                className="text-[#0078D4] hover:underline flex items-center gap-0.5"
                              >
                                <span>Link</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Abstract Toggle */}
                          {paper.abstract && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => toggleAbstract(paper.paperId)}
                                className="text-[10px] text-[#0078D4] hover:underline flex items-center gap-0.5"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span>{isExpanded ? 'Hide Abstract' : 'View Abstract'}</span>
                              </button>
                              {isExpanded && (
                                <p className="mt-1.5 p-2 rounded bg-gray-200/60 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed italic border border-gray-300 dark:border-gray-700">
                                  "{paper.abstract}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Direct Actions: Cite In-Text */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-300 dark:border-gray-700/60">
                            <button
                              type="button"
                              onClick={() => onInsertInTextToEditor(paper, false)}
                              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-[10px] font-medium text-gray-700 dark:text-gray-200 transition flex items-center gap-1"
                              title="Insert parenthetical citation (e.g. (Smith, 2023))"
                            >
                              <Quote className="w-2.5 h-2.5" />
                              <span>(Author, Year)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onInsertInTextToEditor(paper, true)}
                              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-[10px] font-medium text-gray-700 dark:text-gray-200 transition flex items-center gap-1"
                              title="Insert narrative citation (e.g. Smith (2023))"
                            >
                              <span>Author (Year)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <Search className="w-6 h-6 text-gray-500 dark:text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">Ready to discover research</p>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                  Click any context suggestion above or type keywords to query 200M+ scholarly papers.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Curated Reference Pool */}
        {activeTab === 'pool' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Curated Reference Pool ({references.length})
                </h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                  Citations and sources indexed in your document.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className="text-[11px] text-[#0078D4] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Search More
              </button>
            </div>

            {references.length === 0 ? (
              <div className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">No references saved yet</p>
                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                  Search Semantic Scholar or import a paper with citations to populate your pool.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"
                >
                  Explore Research
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {references.map((paper, idx) => {
                  const inText = formatInTextCitation(paper, citationStyle, { narrative: false });
                  const fullBib = formatFullReference(paper, citationStyle, idx);
                  const isCopied = copiedId === paper.paperId;

                  return (
                    <div
                      key={paper.paperId}
                      className="p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-xs space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={paper.selected !== false}
                            onChange={() => onTogglePaperSelection(paper)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                            title="Include in AI Outline synthesis"
                          />
                          <h4 className="font-semibold text-[#1C1C1C] dark:text-gray-100 line-clamp-2">
                            {paper.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemovePaperFromPool(paper.paperId)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded transition"
                          title="Remove from pool"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300">
                        {(paper.authors || []).map((a) => a.name).join(', ')} ({paper.year || 'n.d.'})
                      </p>

                      {/* Citation Pill Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => onInsertInTextToEditor(paper, false)}
                          className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-[#0078D4] dark:text-blue-300 text-[10px] font-medium border border-blue-200 dark:border-blue-800 transition"
                          title="Insert in-text citation into document"
                        >
                          + {inText}
                        </button>
                        <button
                          type="button"
                          onClick={() => onInsertInTextToEditor(paper, true)}
                          className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-[#0078D4] dark:text-blue-300 text-[10px] font-medium border border-blue-200 dark:border-blue-800 transition"
                          title="Insert narrative in-text citation"
                        >
                          + Narrative
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(fullBib, paper.paperId)}
                          className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 text-[10px] border border-gray-300 dark:border-gray-600 transition flex items-center gap-1 ml-auto"
                          title="Copy formatted bibliography reference"
                        >
                          {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy Ref'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: AI Outline & Argument Synthesis */}
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                AI Argument & Outline Strategy
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">
                Synthesize rubric requirements with selected peer-reviewed literature.
              </p>
            </div>

            {/* Student Direction / Thesis Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Your Thesis / Research Direction</span>
              </label>
              <textarea
                rows={3}
                value={studentDirection}
                onChange={(e) => onChangeStudentDirection(e.target.value)}
                placeholder="Specify your unique hypothesis, argument angle, or methodological focus..."
                className="w-full p-2.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[#1C1C1C] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Generate / Regenerate Outline Button */}
            <button
              type="button"
              onClick={onGenerateOutline}
              disabled={isGeneratingOutline || references.length === 0}
              className="w-full py-2.5 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGeneratingOutline ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Literature & Rubric...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {outline.length > 0 ? 'Regenerate Argument Outline' : 'Generate Evidence-Grounded Outline'}
                  </span>
                </>
              )}
            </button>

            {/* Render Outline Sections */}
            {outline.length > 0 ? (
              <div className="space-y-3 pt-2">
                {outline.map((sec, sIdx) => {
                  const isDrafting = draftingSectionId === sec.id;
                  return (
                    <div
                      key={sec.id}
                      className="p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/90 text-xs space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1C1C1C] dark:text-gray-100">
                          {sIdx + 1}. {sec.heading}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          ~{sec.targetWordCount} words
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                        {sec.description}
                      </p>

                      {/* Points & Cited Papers */}
                      {sec.points && sec.points.length > 0 && (
                        <div className="space-y-1.5 pl-2 border-l-2 border-blue-400 dark:border-blue-500 my-1">
                          {sec.points.map((pt) => (
                            <div key={pt.id} className="text-[11px] text-gray-700 dark:text-gray-200">
                              <p className="font-medium text-gray-800 dark:text-gray-100">• {pt.title}</p>
                              <p className="text-[10px] text-gray-600 dark:text-gray-300 pl-2">{pt.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Draft Section Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => onDraftSection(sec)}
                          disabled={isDrafting}
                          className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/70 text-[#0078D4] dark:text-blue-300 font-medium text-[11px] transition flex items-center gap-1 disabled:opacity-50"
                        >
                          {isDrafting ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Drafting Paragraphs...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>AI Draft with Citations</span>
                            </>
                          )}
                        </button>

                        {sec.draftContent && (
                          <button
                            type="button"
                            onClick={() => onInsertDraftToEditor(sec)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition flex items-center gap-1 ml-auto"
                            title="Insert generated draft into center editor"
                          >
                            <FilePlus2 className="w-3 h-3" />
                            <span>Insert to Paper</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <Layers className="w-6 h-6 text-gray-500 dark:text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">No outline generated</p>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                  Select at least 2 sources from your pool and click above to generate an evidence-backed structure.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
