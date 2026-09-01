import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { CenterEditor } from './components/CenterEditor';
import { RightPanel } from './components/RightPanel';
import { ProofreadModal } from './components/ProofreadModal';
import { ShowYourWorkModal } from './components/ShowYourWorkModal';
import { ExportModal } from './components/ExportModal';
import { SAMPLE_ASSIGNMENTS, SampleScenario } from './data/sampleAssignments';
import {
  AssignmentRubric,
  ScholarlyPaper,
  OutlineSection,
  CitationStyle,
  ReviewFeedback,
  ProgressionStep,
} from './types';
import { formatInTextCitation } from './utils/citationFormatter';

export default function App() {
  // Initial state loaded from default psychology scenario
  const defaultScenario = SAMPLE_ASSIGNMENTS[0];

  const [rubric, setRubric] = useState<AssignmentRubric | null>(defaultScenario.rubric);
  const [references, setReferences] = useState<ScholarlyPaper[]>(defaultScenario.samplePapers);
  const [content, setContent] = useState<string>(defaultScenario.initialDraft);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(
    defaultScenario.rubric.requiredCitationStyle || 'APA7'
  );
  const [studentDirection, setStudentDirection] = useState<string>(defaultScenario.thesis);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const handleToggleTheme = (e: React.MouseEvent) => {
    const isDark = !isDarkMode;

    if (!('startViewTransition' in document)) {
      setIsDarkMode(isDark);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setIsDarkMode(isDark);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 600,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  const [outline, setOutline] = useState<OutlineSection[]>(defaultScenario.sampleOutline);
  const [progressionSteps, setProgressionSteps] = useState<ProgressionStep[]>([
    {
      id: 'step-1',
      timestamp: '10:15 AM',
      stage: 'Rubric Ingestion',
      summary: 'Parsed PSYC 4020 assignment rubric & constraints',
      details: 'Identified 2,000 target word count, APA 7th style, 4+ required peer-reviewed sources, and 4 grading criteria.',
    },
    {
      id: 'step-2',
      timestamp: '10:22 AM',
      stage: 'Scholarly Research',
      summary: 'Curated 4 peer-reviewed fMRI & cognitive studies from Semantic Scholar',
      details: 'Selected Rostova et al. (2023), Jenkins & O’Connor (2024), Al-Mansoor & Patel (2023), and Lindqvist & Berg (2022).',
    },
    {
      id: 'step-3',
      timestamp: '10:35 AM',
      stage: 'Outline Synthesis',
      summary: 'Formulated 5-section cross-referenced outline',
      details: 'Mapped striatal/dlPFC neuroimaging to Section 2, and visual search agility to Section 3 as counter-argument.',
    },
    {
      id: 'step-4',
      timestamp: '11:10 AM',
      stage: 'Drafting',
      summary: 'Assembled full 5-section academic draft with in-text APA citations',
      details: 'Integrated parenthetical and narrative citations matching the Reference Pool.',
    },
  ]);

  // Modals & Feedback
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback | null>(null);
  const [isProofreadOpen, setIsProofreadOpen] = useState(false);
  const [isShowYourWorkOpen, setIsShowYourWorkOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Loading flags
  const [isExtractingRubric, setIsExtractingRubric] = useState(false);
  const [isSearchingScholar, setIsSearchingScholar] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [draftingSectionId, setDraftingSectionId] = useState<string | null>(null);
  const [isAssisting, setIsAssisting] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);

  // Calculate live word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // 1. Ingest Rubric (Text, Image OCR, or PDF)
  const handleExtractRubric = async (payload: {
    rawText?: string;
    imageBase64?: string;
    imageMimeType?: string;
    pdfBase64?: string;
  }) => {
    try {
      setIsExtractingRubric(true);
      const res = await fetch('/api/rubric/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to extract rubric');
      const data = await res.json();
      if (data.rubric) {
        setRubric(data.rubric);
        if (data.rubric.requiredCitationStyle) {
          setCitationStyle(data.rubric.requiredCitationStyle);
        }

        // Add milestone step
        setProgressionSteps((prev) => [
          ...prev,
          {
            id: `step-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stage: 'Rubric Ingestion',
            summary: `Parsed rubric for "${data.rubric.title}"`,
            details: `Extracted ${data.rubric.criteria?.length || 0} criteria, ${data.rubric.requiredWordCount?.target || 2000} target words, and ${data.rubric.requiredCitationStyle} style.`,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error parsing assignment rubric: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExtractingRubric(false);
    }
  };

  // 2. Search Semantic Scholar
  const handleSearchSemanticScholar = async (query: string): Promise<ScholarlyPaper[]> => {
    try {
      setIsSearchingScholar(true);
      const res = await fetch('/api/scholarly/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 8 }),
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return data.papers || [];
    } catch (err) {
      console.error('Error searching scholarly papers:', err);
      return [];
    } finally {
      setIsSearchingScholar(false);
    }
  };

  // 3. Add / Remove papers from Reference Pool
  const handleAddPaperToPool = (paper: ScholarlyPaper) => {
    if (!references.some((p) => p.paperId === paper.paperId)) {
      const updated = [...references, { ...paper, selected: true }];
      setReferences(updated);

      setProgressionSteps((prev) => [
        ...prev,
        {
          id: `step-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stage: 'Scholarly Research',
          summary: `Added "${paper.title.slice(0, 45)}..." to reference pool`,
          details: `Indexed peer-reviewed study by ${(paper.authors || []).map((a) => a.name).join(', ')} (${paper.year || 'n.d.'}).`,
        },
      ]);
    }
  };

  const handleRemovePaperFromPool = (paperId: string) => {
    setReferences(references.filter((p) => p.paperId !== paperId));
  };

  const handleTogglePaperSelection = (paper: ScholarlyPaper) => {
    setReferences(
      references.map((p) => (p.paperId === paper.paperId ? { ...p, selected: !p.selected } : p))
    );
  };

  // 4. Insert In-Text Citation into Document
  const handleInsertInTextToEditor = (paper: ScholarlyPaper, narrative: boolean = false) => {
    const citation = formatInTextCitation(paper, citationStyle, { narrative });
    setContent((prev) => `${prev} ${citation}`);
  };

  // 5. Generate Structured Cross-Referenced Outline
  const handleGenerateOutline = async () => {
    try {
      setIsGeneratingOutline(true);
      const res = await fetch('/api/strategy/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rubric,
          studentDirection,
          selectedArticles: references,
        }),
      });

      if (!res.ok) throw new Error('Outline generation failed');
      const data = await res.json();
      if (data.outline) {
        setOutline(data.outline);

        setProgressionSteps((prev) => [
          ...prev,
          {
            id: `step-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stage: 'Outline Synthesis',
            summary: `Synthesized ${data.outline.length}-section cross-referenced outline`,
            details: `Mapped student thesis "${studentDirection.slice(0, 50)}..." and ${references.length} reference papers across section arguments.`,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error generating outline: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // 6. Draft Specific Section with AI
  const handleDraftSection = async (section: OutlineSection) => {
    try {
      setDraftingSectionId(section.id);
      const res = await fetch('/api/strategy/draft-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          rubric,
          studentDirection,
          selectedArticles: references,
          existingDocumentText: content,
        }),
      });

      if (!res.ok) throw new Error('Section draft failed');
      const data = await res.json();
      if (data.draftContent) {
        const updatedOutline = outline.map((s) =>
          s.id === section.id ? { ...s, draftContent: data.draftContent, status: 'drafting' as const } : s
        );
        setOutline(updatedOutline);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error drafting section: ' + (err.message || 'Unknown error'));
    } finally {
      setDraftingSectionId(null);
    }
  };

  // 7. Insert Drafted Section into Document Editor
  const handleInsertDraftToEditor = (section: OutlineSection) => {
    if (!section.draftContent) return;
    const formattedSection = `\n\n## ${section.heading}\n${section.draftContent}\n`;
    setContent((prev) => `${prev.trim()}${formattedSection}`);

    setProgressionSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stage: 'Drafting',
        summary: `Integrated section "${section.heading}" into main document`,
        details: `Appended ${section.draftContent?.split(/\s+/).length || 0} words with citations to editor draft.`,
      },
    ]);
  };

  // 8. Run Strict Academic Professor Review
  const handleRunProofread = async () => {
    try {
      setIsProofreading(true);
      const res = await fetch('/api/proofread/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: content,
          rubric,
          selectedArticles: references,
        }),
      });

      if (!res.ok) throw new Error('Proofread evaluation failed');
      const data = await res.json();
      if (data.feedback) {
        setReviewFeedback(data.feedback);
        setIsProofreadOpen(true);

        setProgressionSteps((prev) => [
          ...prev,
          {
            id: `step-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stage: 'Academic Review',
            summary: `Professor evaluation completed: Score ${data.feedback.overallScore}/100 (Grade ${data.feedback.letterGrade})`,
            details: `Evaluated ${data.feedback.rubricAdherence?.length || 0} rubric criteria and ${data.feedback.citationChecks?.length || 0} in-text citations.`,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error running academic evaluation: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProofreading(false);
    }
  };

  // 9. Editor In-situ Assistance
  const handleEditorAssist = async (action: string, selectedText: string): Promise<string> => {
    try {
      setIsAssisting(true);
      const res = await fetch('/api/editor/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText,
          fullDocument: content,
          citationStyle,
          references,
        }),
      });

      if (!res.ok) throw new Error('Assistance action failed');
      const data = await res.json();
      return data.result || '';
    } catch (err: any) {
      console.error(err);
      alert('Assistant error: ' + (err.message || 'Unknown error'));
      return '';
    } finally {
      setIsAssisting(false);
    }
  };

  // 10. Load Sample Scenario
  const handleSelectSample = (id: string) => {
    const scenario = SAMPLE_ASSIGNMENTS.find((s) => s.id === id);
    if (!scenario) return;

    setRubric(scenario.rubric);
    setReferences(scenario.samplePapers);
    setContent(scenario.initialDraft);
    setCitationStyle(scenario.rubric.requiredCitationStyle);
    setStudentDirection(scenario.thesis);
    setOutline(scenario.sampleOutline);
    setProgressionSteps([
      {
        id: 'step-init-1',
        timestamp: '10:00 AM',
        stage: 'Rubric Ingestion',
        summary: `Loaded ${scenario.name}`,
        details: `Configured ${scenario.category} curriculum parameters and rubric.`,
      },
      {
        id: 'step-init-2',
        timestamp: '10:05 AM',
        stage: 'Scholarly Research',
        summary: `Populated ${scenario.samplePapers.length} peer-reviewed seminal studies`,
        details: `Prepared citation pool formatted in ${scenario.rubric.requiredCitationStyle}.`,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] dark:bg-[#121212] flex flex-col font-sans antialiased text-[#1C1C1C] dark:text-gray-100 selection:bg-[#0078D4] selection:text-white">
      {/* Fluent Window Header */}
      <Header
        rubric={rubric}
        wordCount={wordCount}
        citationStyle={citationStyle}
        onCitationStyleChange={setCitationStyle}
        onOpenProofread={handleRunProofread}
        onOpenShowYourWork={() => setIsShowYourWorkOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onSelectSample={handleSelectSample}
        isProofreading={isProofreading}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleTheme}
      />

      {/* Three-Pane Core Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Ingestion & Rubric Context */}
        <LeftPanel
          rubric={rubric}
          onUpdateRubric={setRubric}
          onExtractRubric={handleExtractRubric}
          isLoading={isExtractingRubric}
          progressionSteps={progressionSteps}
          onOpenShowYourWork={() => setIsShowYourWorkOpen(true)}
        />

        {/* Center Panel: Main Academic Rich Text Editor */}
        <CenterEditor
          content={content}
          onChangeContent={setContent}
          references={references}
          citationStyle={citationStyle}
          onAssistAction={handleEditorAssist}
          isAssisting={isAssisting}
        />

        {/* Right Panel: Research & Semantic Scholar Citations */}
        <RightPanel
          rubric={rubric}
          references={references}
          onTogglePaperSelection={handleTogglePaperSelection}
          onAddPaperToPool={handleAddPaperToPool}
          onRemovePaperFromPool={handleRemovePaperFromPool}
          onInsertInTextToEditor={handleInsertInTextToEditor}
          citationStyle={citationStyle}
          studentDirection={studentDirection}
          onChangeStudentDirection={setStudentDirection}
          outline={outline}
          onGenerateOutline={handleGenerateOutline}
          onDraftSection={handleDraftSection}
          onInsertDraftToEditor={handleInsertDraftToEditor}
          isSearching={isSearchingScholar}
          isGeneratingOutline={isGeneratingOutline}
          draftingSectionId={draftingSectionId}
          onSearchSemanticScholar={handleSearchSemanticScholar}
        />
      </div>

      {/* Modals */}
      <ProofreadModal
        isOpen={isProofreadOpen}
        onClose={() => setIsProofreadOpen(false)}
        feedback={reviewFeedback}
        rubric={rubric}
      />

      <ShowYourWorkModal
        isOpen={isShowYourWorkOpen}
        onClose={() => setIsShowYourWorkOpen(false)}
        progressionSteps={progressionSteps}
        rubric={rubric}
        references={references}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        documentContent={content}
        rubric={rubric}
        references={references}
        citationStyle={citationStyle}
      />
    </div>
  );
}
