import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AtSign,
  Sparkles,
  Search,
  BookOpen,
  Copy,
  Check,
  AlignLeft,
  Clock,
  FileText,
  Bookmark,
  ChevronDown,
  Wand2,
} from 'lucide-react';
import { ScholarlyPaper, CitationStyle } from '../types';
import { formatInTextCitation, formatFullReference } from '../utils/citationFormatter';

interface CenterEditorProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  references: ScholarlyPaper[];
  citationStyle: CitationStyle;
  onAssistAction: (action: string, selectedText: string) => Promise<string>;
  isAssisting: boolean;
}

export const CenterEditor: React.FC<CenterEditorProps> = ({
  content,
  onChangeContent,
  references,
  citationStyle,
  onAssistAction,
  isAssisting,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCitationMenu, setShowCitationMenu] = useState(false);
  const [citationFilter, setCitationFilter] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [citationMode, setCitationMode] = useState<'parenthetical' | 'narrative'>('parenthetical');
  const [selectedTextRange, setSelectedTextRange] = useState<{ start: number; end: number } | null>(null);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);
  const [showAiMenu, setShowAiMenu] = useState(false);

  // Calculate statistics
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const characters = content.length;
  const readingTime = Math.ceil(words / 200);

  // Count how many references are cited in-text
  const citedPapersCount = references.filter((paper) => {
    const lastName = paper.authors?.[0]?.name?.split(/\s+/).pop() || '';
    return lastName && content.includes(lastName);
  }).length;

  // Handle key triggers like `@`
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorIndex = textarea.selectionStart;
      setSelectedTextRange({ start: cursorIndex, end: cursorIndex });

      // Approximate menu coordinates based on textarea box
      const rect = textarea.getBoundingClientRect();
      setMenuPosition({
        top: 60,
        left: 20,
      });
      setShowCitationMenu(true);
      setCitationFilter('');
    } else if (e.key === 'Escape') {
      setShowCitationMenu(false);
      setShowAiMenu(false);
    }
  };

  // Insert formatted text or markdown styling
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    onChangeContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  // Insert in-text citation from dropdown
  const handleInsertCitation = (paper: ScholarlyPaper, narrative: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const citationStr = formatInTextCitation(paper, citationStyle, { narrative });
    const cursor = textarea.selectionStart;
    const text = textarea.value;

    // Check if previous char was '@'
    let startPos = cursor;
    if (cursor > 0 && text[cursor - 1] === '@') {
      startPos = cursor - 1;
    }

    const newContent = text.substring(0, startPos) + citationStr + text.substring(cursor);
    onChangeContent(newContent);
    setShowCitationMenu(false);

    setTimeout(() => {
      textarea.focus();
      const newCursor = startPos + citationStr.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  // Handle AI Writing Assistance
  const handleRunAiAssist = async (action: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end).trim();

    if (!selected) {
      alert('Please select a paragraph or sentence in the editor to enhance.');
      return;
    }

    setShowAiMenu(false);
    const result = await onAssistAction(action, selected);
    if (result) {
      const newContent = textarea.value.substring(0, start) + result + textarea.value.substring(end);
      onChangeContent(newContent);
    }
  };

  // Filtered reference papers for autocomplete
  const filteredReferences = references.filter((p) => {
    const q = citationFilter.toLowerCase();
    const authors = (p.authors || []).map((a) => a.name.toLowerCase()).join(' ');
    return p.title.toLowerCase().includes(q) || authors.includes(q) || (p.year?.toString() || '').includes(q);
  });

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-80px)] bg-[#F3F3F3] dark:bg-[#121212] overflow-hidden relative">
      {/* Editor Formatting Ribbon */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20 shadow-sm">
        {/* Left Formatting Group */}
        <div className="flex items-center gap-1">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertFormatting('\n# ', '\n')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Heading 1 (Main Title)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n## ', '\n')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Heading 2 (Section Title)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n### ', '\n')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Heading 3 (Sub-section)"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Formatting */}
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Bold Text"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Italic Text"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n> ', '\n')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n- ', '')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n1. ', '')}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* In-Text Citation Tool Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowCitationMenu(!showCitationMenu);
              setCitationFilter('');
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-blue-50/80 text-[#0078D4] hover:bg-blue-100 border border-blue-200/80 transition"
            title="Insert In-Text Citation (or type '@')"
          >
            <AtSign className="w-3.5 h-3.5" />
            <span>Insert Citation</span>
          </button>
        </div>

        {/* Right AI Enhancement Group */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAiMenu(!showAiMenu)}
            disabled={isAssisting}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-amber-700 border border-gray-300 dark:border-gray-700 transition disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAssisting ? 'Enhancing...' : 'AI Prose Tools'}</span>
            <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </button>

          {showAiMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700">
                Transform Selected Passage
              </div>
              <button
                type="button"
                onClick={() => handleRunAiAssist('improve-academic-tone')}
                className="w-full text-left px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col"
              >
                <span className="font-medium text-[#1C1C1C] dark:text-gray-100">Elevate Academic Tone</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300">Formalize vocabulary & objectivity</span>
              </button>
              <button
                type="button"
                onClick={() => handleRunAiAssist('expand-argument')}
                className="w-full text-left px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col"
              >
                <span className="font-medium text-[#1C1C1C] dark:text-gray-100">Expand Argument & Reasoning</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300">Deepen critical analysis</span>
              </button>
              <button
                type="button"
                onClick={() => handleRunAiAssist('counter-argument')}
                className="w-full text-left px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col"
              >
                <span className="font-medium text-[#1C1C1C] dark:text-gray-100">Add Counter-Argument & Rebuttal</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300">Incorporate critical nuance</span>
              </button>
              <button
                type="button"
                onClick={() => handleRunAiAssist('synthesize-citations')}
                className="w-full text-left px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex flex-col"
              >
                <span className="font-medium text-[#1C1C1C] dark:text-gray-100">Synthesize with Reference Pool</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300">Embed citations into sentences</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Document Workspace (Word-like Academic Page Layout) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#F3F3F3] dark:bg-[#121212]">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-6 md:p-12 relative flex flex-col min-h-[850px]">
          {/* APA Page Header Simulation */}
          <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 pb-4 mb-4 border-b border-gray-200 dark:border-gray-800/80 select-none">
            <span className="uppercase tracking-wider font-mono">Running head: ACADEMIC ESSAY</span>
            <span>Page 1</span>
          </div>

          {/* Textarea Editor */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChangeContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Begin typing your academic paper here... (Type '@' to insert a citation from your Reference Pool)"
              className="w-full h-full min-h-[500px] bg-transparent text-[#1C1C1C] dark:text-gray-100 text-sm md:text-base leading-relaxed placeholder-gray-500 focus:outline-none resize-none font-serif tracking-normal"
              style={{
                lineHeight: '1.8',
              }}
            />

            {/* Floating Autocomplete Popover for In-Text Citation '@' */}
            {showCitationMenu && (
              <div
                className="absolute top-4 left-4 right-4 md:right-auto md:w-96 bg-white dark:bg-gray-900 border border-blue-500/80 rounded-lg shadow-2xl z-50 p-2 text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-[#0078D4] font-semibold">
                    <AtSign className="w-3.5 h-3.5" />
                    <span>Insert Citation ({citationStyle})</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded">
                    <button
                      type="button"
                      onClick={() => setCitationMode('parenthetical')}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        citationMode === 'parenthetical' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      (Smith, 2023)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCitationMode('narrative')}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        citationMode === 'narrative' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Smith (2023)
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    value={citationFilter}
                    onChange={(e) => setCitationFilter(e.target.value)}
                    placeholder="Search author, title, or year..."
                    autoFocus
                    className="w-full pl-7 pr-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredReferences.length > 0 ? (
                    filteredReferences.map((paper) => {
                      const inText = formatInTextCitation(paper, citationStyle, {
                        narrative: citationMode === 'narrative',
                      });
                      return (
                        <button
                          key={paper.paperId}
                          type="button"
                          onClick={() => handleInsertCitation(paper, citationMode === 'narrative')}
                          className="w-full text-left p-2 rounded hover:bg-blue-50/60 hover:border-blue-200/60 border border-transparent text-gray-800 dark:text-gray-100 flex flex-col gap-0.5 transition group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#0078D4] group-hover:text-[#0078D4]">
                              {inText}
                            </span>
                            <span className="text-[10px] text-gray-600 dark:text-gray-300">{paper.year || 'n.d.'}</span>
                          </div>
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1 group-hover:text-gray-700 dark:text-gray-200">
                            {paper.title}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                      No matching papers in reference pool.
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                  <span>Press Esc to close</span>
                  <span>{references.length} papers in pool</span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic References Page Preview */}
          {references.length > 0 && (
            <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-800 select-none">
              <div className="text-center mb-4">
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 tracking-wide">
                  {citationStyle === 'MLA9' ? 'Works Cited' : 'References'}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
                  ({citationStyle} Format • Automatically Appended on Export)
                </p>
              </div>

              <div className="space-y-3 text-xs text-gray-700 dark:text-gray-200 font-serif leading-relaxed">
                {[...references]
                  .sort((a, b) => {
                    const nameA = (a.authors?.[0]?.name || a.title).toLowerCase();
                    const nameB = (b.authors?.[0]?.name || b.title).toLowerCase();
                    return nameA.localeCompare(nameB);
                  })
                  .map((paper, idx) => {
                    const formatted = formatFullReference(paper, citationStyle, idx);
                    return (
                      <div
                        key={paper.paperId}
                        className="pl-6 -indent-6 text-gray-700 dark:text-gray-200 hover:text-[#1C1C1C] dark:text-gray-100 transition group relative"
                      >
                        <span>{formatted}</span>
                        {paper.doi && (
                          <span className="text-[#0078D4] text-[11px] ml-1 opacity-80 group-hover:opacity-100">
                            [DOI: {paper.doi}]
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Bottom Status Bar */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-gray-600 dark:text-gray-300 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>
              <strong>{words.toLocaleString()}</strong> words
            </span>
          </div>
          <span className="text-gray-300">•</span>
          <span>{characters.toLocaleString()} characters</span>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            <span>~{readingTime} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Sources Cited In-Text: <strong>{citedPapersCount}</strong> of {references.length}
            </span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Auto-saved to session</span>
        </div>
      </footer>
    </main>
  );
};
