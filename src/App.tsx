import React, { useState, useEffect, useRef } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS, Step } from 'react-joyride';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { CenterEditor } from './components/CenterEditor';
import { RightPanel } from './components/RightPanel';
import { ProofreadModal } from './components/ProofreadModal';
import { ShowYourWorkModal } from './components/ShowYourWorkModal';
import { ExportModal } from './components/ExportModal';
import { TutorialModal } from './components/TutorialModal';
import { NewPaperModal } from './components/NewPaperModal';
import { PastProjectsModal } from './components/PastProjectsModal';
import { ImportModal } from './components/ImportModal';
import { AnalysisModal } from './components/AnalysisModal';
import { NoRubricPromptModal } from './components/NoRubricPromptModal';
import { SAMPLE_ASSIGNMENTS } from './data/sampleAssignments';
import {
  AssignmentRubric,
  ScholarlyPaper,
  OutlineSection,
  CitationStyle,
  ReviewFeedback,
  ProgressionStep,
  SavedPaper,
  ImportAnalysisResult,
  TitlePageConfig,
} from './types';
import { formatInTextCitation } from './utils/citationFormatter';
import {
  fetchUserProjects,
  saveProject,
  deleteProject,
  createNewProject,
  getLocalProjects,
} from './lib/projectsService';
import { auth } from './lib/firebase';
import {
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Search,
  Maximize2,
} from 'lucide-react';

export default function App() {
  const defaultScenario = SAMPLE_ASSIGNMENTS[0];

  // Core Document State
  const [rubric, setRubric] = useState<AssignmentRubric | null>(defaultScenario.rubric);
  const [references, setReferences] = useState<ScholarlyPaper[]>(defaultScenario.samplePapers);
  const [content, setContent] = useState<string>(defaultScenario.initialDraft);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(
    defaultScenario.rubric.requiredCitationStyle || 'APA7'
  );
  const [studentDirection, setStudentDirection] = useState<string>(defaultScenario.thesis);
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

  // Title Page & Metadata Configuration
  const [titlePageConfig, setTitlePageConfig] = useState<TitlePageConfig>({
    authorName: 'Jane Doe',
    institution: 'Department of Psychology, University of California',
    instructorName: 'Prof. Eleanor Vance, Ph.D.',
    courseName: 'PSYC 4020: Advanced Developmental Cognitive Neuroscience',
    includeTitlePage: true,
    paperTitle: 'Cognitive & Neural Mechanisms of Video Game-Induced Neuroplasticity',
    dueDate: '',
  });

  // Persistence & User Projects
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [userPapers, setUserPapers] = useState<SavedPaper[]>([]);
  const [isSavingToCloud, setIsSavingToCloud] = useState<boolean>(false);

  // Panel Collapsing States
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isNewPaperOpen, setIsNewPaperOpen] = useState(false);
  const [isPastProjectsOpen, setIsPastProjectsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isNoRubricPromptOpen, setIsNoRubricPromptOpen] = useState(false);
  const [importAnalysisResult, setImportAnalysisResult] = useState<ImportAnalysisResult | null>(null);
  const [extractedImportPapers, setExtractedImportPapers] = useState<ScholarlyPaper[]>([]);
  const [pendingImportText, setPendingImportText] = useState<string>('');

  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback | null>(null);
  const [isProofreadOpen, setIsProofreadOpen] = useState(false);
  const [isShowYourWorkOpen, setIsShowYourWorkOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Loading Flags
  const [isExtractingRubric, setIsExtractingRubric] = useState(false);
  const [isSearchingScholar, setIsSearchingScholar] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [draftingSectionId, setDraftingSectionId] = useState<string | null>(null);
  const [isAssisting, setIsAssisting] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Guided Tour State
  const [runTour, setRunTour] = useState(false);
  const [tourSteps] = useState<Step[]>([
    {
      target: '.tour-rubric',
      content: 'Start by pasting or uploading your assignment rubric and guidelines here. The AI extracts criteria, word counts, and formatting requirements.',
      placement: 'right',
      skipBeacon: true,
    },
    {
      target: '.tour-search',
      content: 'Search the Semantic Scholar database to query real peer-reviewed articles and add them directly to your reference pool.',
      placement: 'left',
      skipBeacon: true,
    },
    {
      target: '.tour-outline',
      content: 'Generate a structured academic outline mapping your thesis and arguments directly to your cited sources.',
      placement: 'left',
      skipBeacon: true,
    },
    {
      target: '.tour-editor',
      content: 'Write on a distraction-free canvas formatted to university standards. Type "@" to cite references instantly.',
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '.tour-proofread',
      content: 'When you are ready, run a strict academic Professor Review against your rubric criteria before exporting.',
      placement: 'bottom-end',
      skipBeacon: true,
    },
  ]);

  const handleJoyrideCallback = (data: any) => {
    const { status, type, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (
      finishedStatuses.includes(status) ||
      type === EVENTS.TOUR_END ||
      action === ACTIONS.CLOSE ||
      action === ACTIONS.SKIP ||
      action === ACTIONS.STOP ||
      action === ACTIONS.RESET
    ) {
      setRunTour(false);
    }
  };

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
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        { clipPath },
        { duration: 600, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // First Launch Tutorial Check & Local Projects Cache
  useEffect(() => {
    const initialPapers = getLocalProjects();
    if (initialPapers.length > 0) {
      setUserPapers(initialPapers);
    }
    const tutorialDone = localStorage.getItem('scholardesk_tutorial_completed');
    if (!tutorialDone) {
      setIsTutorialOpen(true);
    }
  }, []);

  // Fetch Firestore Projects on Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const papers = await fetchUserProjects(user.uid);
          setUserPapers(papers);
          const tutorialDone = localStorage.getItem('scholardesk_tutorial_completed');
          // If tutorial was already done and user has existing saved papers, load their most recent
          if (papers.length > 0 && tutorialDone && !currentPaperId) {
            loadPaperIntoWorkspace(papers[0]);
          }
        } catch (err) {
          console.error('Failed to load user papers:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Live word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Auto-Save Debouncer to Cloud
  useEffect(() => {
    if (!auth.currentUser || !currentPaperId) return;

    const timer = setTimeout(async () => {
      try {
        setIsSavingToCloud(true);
        const existingPaper = userPapers.find((p) => p.id === currentPaperId);
        const paperToSave: SavedPaper = {
          id: currentPaperId,
          userId: auth.currentUser!.uid,
          title: rubric?.title || 'Untitled Academic Paper',
          courseName: rubric?.courseName || 'General Academic Draft',
          citationStyle,
          content,
          studentDirection,
          wordCount,
          rubric: rubric || {
            title: 'Untitled Academic Paper',
            assignmentType: 'Research Paper',
            requiredWordCount: { min: 1500, max: 2500, target: 2000 },
            requiredCitationStyle: citationStyle,
            requiredSourceCount: 4,
            topicConstraints: [],
            keyQuestionsToAnswer: [],
            formattingRules: [],
            criteria: [],
          },
          references,
          outline,
          progressionSteps,
          createdAt: existingPaper?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveProject(paperToSave);
        const papers = await fetchUserProjects(auth.currentUser!.uid);
        setUserPapers(papers);
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setIsSavingToCloud(false);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [content, rubric, references, outline, citationStyle, studentDirection, currentPaperId, wordCount]);

  // Helpers to load / reset workspace
  const loadPaperIntoWorkspace = (paper: SavedPaper) => {
    setCurrentPaperId(paper.id);
    setContent(paper.content || '');
    setCitationStyle(paper.citationStyle || 'APA7');
    setStudentDirection(paper.studentDirection || '');
    setRubric(paper.rubric || null);
    setReferences(paper.references || []);
    setOutline(paper.outline || []);
    setProgressionSteps(
      paper.progressionSteps || [
        {
          id: `step-load-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stage: 'Project Loaded',
          summary: `Loaded "${paper.title}"`,
          details: `Synchronized from your Google Cloud workspace.`,
        },
      ]
    );
  };

  const handleStartFreshWorkspace = () => {
    setCurrentPaperId(null);
    setContent('');
    setRubric(null);
    setReferences([]);
    setOutline([]);
    setStudentDirection('');
    setProgressionSteps([
      {
        id: `step-fresh-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stage: 'Workspace Initialized',
        summary: 'Clean Academic Workspace ready',
        details: 'Upload your syllabus/rubric or import an existing document to begin.',
      },
    ]);
  };

  const handleCompleteTutorial = () => {
    localStorage.setItem('scholardesk_tutorial_completed', 'true');
    setIsTutorialOpen(false);
    // User requested that after tutorial completion/skip, sample data is no longer loaded
    handleStartFreshWorkspace();
  };

  const handleCreateNewPaper = async (params: {
    title: string;
    courseName?: string;
    citationStyle: CitationStyle;
    targetWordCount?: number;
    targetWords?: number;
    initialThesis?: string;
  }) => {
    if (!auth.currentUser) return;
    try {
      const createParams = {
        title: params.title,
        courseName: params.courseName,
        citationStyle: params.citationStyle,
        targetWordCount: params.targetWordCount || params.targetWords || 1000,
        initialThesis: params.initialThesis
      };
      const newPaper = await createNewProject(auth.currentUser.uid, createParams);
      loadPaperIntoWorkspace(newPaper);
      const papers = await fetchUserProjects(auth.currentUser.uid);
      setUserPapers(papers);
    } catch (err) {
      console.error('Error creating new paper:', err);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteProject(paperId);
      const papers = await fetchUserProjects(auth.currentUser.uid);
      setUserPapers(papers);
      if (currentPaperId === paperId) {
        if (papers.length > 0) {
          loadPaperIntoWorkspace(papers[0]);
        } else {
          handleStartFreshWorkspace();
        }
      }
    } catch (err) {
      console.error('Error deleting paper:', err);
    }
  };

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
      console.error(err);
      return [];
    } finally {
      setIsSearchingScholar(false);
    }
  };

  // 3. Add / Remove Reference from Pool
  const handleAddPaperToPool = (paper: ScholarlyPaper) => {
    if (references.some((r) => r.paperId === paper.paperId)) return;
    setReferences((prev) => [...prev, paper]);
    setProgressionSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stage: 'Scholarly Research',
        summary: `Added "${paper.title.slice(0, 45)}..." to Reference Pool`,
        details: `Authors: ${paper.authors?.slice(0, 2).map((a) => a.name).join(', ')} (${paper.year || 'n.d.'}).`,
      },
    ]);
  };

  const handleRemovePaperFromPool = (paperId: string) => {
    setReferences((prev) => prev.filter((r) => r.paperId !== paperId));
  };

  const handleTogglePaperSelection = (paper: ScholarlyPaper) => {
    const exists = references.some((r) => r.paperId === paper.paperId);
    if (exists) {
      handleRemovePaperFromPool(paper.paperId);
    } else {
      handleAddPaperToPool(paper);
    }
  };

  // 4. Insert Citation directly into Editor
  const handleInsertInTextToEditor = (paper: ScholarlyPaper, narrative = false) => {
    const cite = formatInTextCitation(paper, citationStyle, { narrative });
    setContent((prev) => prev + ' ' + cite + ' ');
  };

  // 5. Generate AI Outline
  const handleGenerateOutline = async () => {
    try {
      setIsGeneratingOutline(true);
      const res = await fetch('/api/outline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rubric,
          selectedPapers: references,
          studentDirection,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate outline');
      const data = await res.json();
      if (data.outline) {
        setOutline(data.outline);
        setProgressionSteps((prev) => [
          ...prev,
          {
            id: `step-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stage: 'Outline Synthesis',
            summary: `Synthesized ${data.outline.length}-section academic outline`,
            details: `Constructed argumentative flow cross-referencing ${references.length} reference pool studies.`,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate outline: ' + err.message);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // 6. Draft Outline Section
  const handleDraftSection = async (section: OutlineSection) => {
    try {
      setDraftingSectionId(section.id);
      const res = await fetch('/api/section/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          rubric,
          selectedPapers: references,
          studentDirection,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error('Failed to draft section');
      const data = await res.json();
      if (data.draft) {
        const nextOutline = outline.map((s) => (s.id === section.id ? { ...s, draftContent: data.draft } : s));
        setOutline(nextOutline);
        setProgressionSteps((prev) => [
          ...prev,
          {
            id: `step-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stage: 'Drafting',
            summary: `Drafted Section: ${section.heading}`,
            details: `Incorporated citations and rubric-aligned evidence.`,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to draft section: ' + err.message);
    } finally {
      setDraftingSectionId(null);
    }
  };

  const handleInsertDraftToEditor = (section: OutlineSection) => {
    if (!section.draftContent) return;
    setContent((prev) => {
      const divider = prev.trim().length > 0 ? '\n\n' : '';
      return `${prev}${divider}## ${section.heading}\n\n${section.draftContent}`;
    });
  };


  // 7. Contextual Editor Assistant Actions
  const handleEditorAssist = async (action: string, selectedText: string): Promise<string> => {
    try {
      setIsAssisting(true);
      const res = await fetch('/api/editor/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          currentText: content,
          selectedText,
          rubric,
          references,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error('Assist action failed');
      const data = await res.json();
      return data.resultText || '';
    } catch (err: any) {
      console.error(err);
      alert('Assistant failed: ' + err.message);
      return '';
    } finally {
      setIsAssisting(false);
    }
  };

  // 8. Strict Professor Proofread
  const handleRunProofread = async () => {
    try {
      setIsProofreading(true);
      const res = await fetch('/api/rubric/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: content,
          rubric,
          references,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error('Proofread failed');
      const data = await res.json();
      if (data.feedback) {
        setReviewFeedback(data.feedback);
        setIsProofreadOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      alert('Proofread review failed: ' + err.message);
    } finally {
      setIsProofreading(false);
    }
  };

  // 9. Import Document Flow & AI Source Identification
  const handleImportDocument = async (importedText: string) => {
    setPendingImportText(importedText);
    setContent(importedText);

    // Check if rubric exists
    const hasRubric = Boolean(rubric && rubric.criteria && rubric.criteria.length > 0);
    if (!hasRubric) {
      setIsNoRubricPromptOpen(true);
    }

    // Call AI document analysis endpoint
    try {
      const res = await fetch('/api/document/analyze-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: importedText,
          rubric: rubric,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const extractedTitle =
          data.analysis?.titlePageMetadata?.paperTitle?.trim() ||
          data.analysis?.extractedTitle?.trim() ||
          importedText.split('\n')[0].replace(/^#+\s*/, '').slice(0, 100).trim() ||
          'Imported Research Paper';
        const extractedCourse =
          data.analysis?.titlePageMetadata?.courseName?.trim() ||
          rubric?.courseName ||
          'Academic Research';

        if (data.analysis) {
          setImportAnalysisResult(data.analysis);
          setIsAnalysisOpen(true);

          // Auto-fill Title Page metadata fields if recognized
          if (data.analysis.titlePageMetadata || data.analysis.extractedTitle) {
            const meta = data.analysis.titlePageMetadata || {};
            setTitlePageConfig((prev) => ({
              ...prev,
              authorName: meta.authorName?.trim() || prev.authorName,
              institution: meta.institution?.trim() || prev.institution,
              instructorName: meta.instructorName?.trim() || prev.instructorName,
              courseName: meta.courseName?.trim() || prev.courseName,
              paperTitle: meta.paperTitle?.trim() || data.analysis.extractedTitle?.trim() || prev.paperTitle,
              dueDate: meta.dueDate?.trim() || prev.dueDate,
            }));
          }
        }

        // Auto-add all identified references directly to the reference pool
        let updatedRefs = references;
        if (data.extractedPapers && data.extractedPapers.length > 0) {
          setExtractedImportPapers(data.extractedPapers);
          const existingTitles = new Set(references.map((p) => p.title.toLowerCase().trim()));
          const newRefs = (data.extractedPapers as ScholarlyPaper[]).filter(
            (p) => !existingTitles.has(p.title.toLowerCase().trim())
          );
          updatedRefs = [...references, ...newRefs];
          setReferences(updatedRefs);
        }

        const newStep: ProgressionStep = {
          id: `step-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stage: 'AI Import Analysis',
          summary: `Imported & Analyzed "${extractedTitle}"`,
          details: `Indexed ${(data.extractedPapers || []).length} scholarly sources and registered to past projects.`,
        };
        const nextSteps = [...progressionSteps, newStep];
        setProgressionSteps(nextSteps);

        // Assign a distinct paper ID and register into Past Projects
        const newPaperId = `paper-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        setCurrentPaperId(newPaperId);

        const currentWordCount = data.analysis?.wordCount || (importedText.trim() ? importedText.trim().split(/\s+/).length : 0);

        const savedImportedPaper: SavedPaper = {
          id: newPaperId,
          userId: auth.currentUser ? auth.currentUser.uid : 'guest-user',
          title: extractedTitle,
          courseName: extractedCourse,
          citationStyle: citationStyle,
          content: importedText,
          studentDirection: '',
          wordCount: currentWordCount,
          rubric: rubric || {
            title: extractedTitle,
            courseName: extractedCourse,
            assignmentType: 'Research Paper',
            requiredWordCount: {
              min: Math.round(currentWordCount * 0.8),
              max: Math.round(currentWordCount * 1.2),
              target: currentWordCount || 2000,
            },
            requiredCitationStyle: citationStyle,
            requiredSourceCount: (data.extractedPapers || []).length || 4,
            topicConstraints: [],
            keyQuestionsToAnswer: [],
            formattingRules: ['1-inch margins', 'Standard font', 'Academic citation list'],
            criteria: [],
          },
          references: updatedRefs,
          outline: [],
          progressionSteps: nextSteps,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save project and update userPapers state so it appears in Past Projects modal immediately
        await saveProject(savedImportedPaper);
        const latestPapers = await fetchUserProjects(auth.currentUser?.uid);
        setUserPapers(latestPapers);
      }
    } catch (err) {
      console.error('Import analysis error:', err);
    }
  };

  // 10. Sample Scenario Switcher
  const handleSelectSample = (id: string) => {
    const scenario = SAMPLE_ASSIGNMENTS.find((s) => s.id === id);
    if (!scenario) return;

    setRubric(scenario.rubric);
    setReferences(scenario.samplePapers);
    setContent(scenario.initialDraft);
    setCitationStyle(scenario.rubric.requiredCitationStyle || 'APA7');
    setStudentDirection(scenario.thesis);
    setOutline(scenario.sampleOutline);
    setProgressionSteps([
      {
        id: 'step-init-1',
        timestamp: '10:00 AM',
        stage: 'Rubric Ingestion',
        summary: `Loaded "${scenario.name}" template`,
        details: `Configured criteria, word count target (${scenario.rubric.requiredWordCount?.target}), and guidelines.`,
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
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#09090B] bg-[radial-gradient(#E4E4E7_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272A_1px,transparent_1px)] flex flex-col font-sans antialiased text-[#1C1C1C] dark:text-gray-100 selection:bg-[#0078D4] selection:text-white">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        scrollToFirstStep
        options={{
          buttons: ['back', 'close', 'primary'],
          showProgress: true,
          skipBeacon: true,
          closeButtonAction: 'skip',
          overlayClickAction: 'close',
          dismissKeyAction: 'close',
          primaryColor: '#0078D4',
          textColor: isDarkMode ? '#F3F4F6' : '#1F2937',
          backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF',
          arrowColor: isDarkMode ? '#18181B' : '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.55)',
          spotlightPadding: 6,
          offset: 12,
        }}
        floatingOptions={{
          hideArrow: false,
          shiftOptions: {
            padding: 16,
          },
        }}
        styles={{
          tooltip: {
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '13px',
            maxWidth: '360px',
            border: isDarkMode ? '1px solid #3F3F46' : '1px solid #E5E7EB',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonPrimary: {
            backgroundColor: '#0078D4',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
          },
          buttonBack: {
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
            fontSize: '12px',
            marginRight: '8px',
          },
          buttonClose: {
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
            fontSize: '12px',
          },
        }}
        onEvent={handleJoyrideCallback}
      />
      {/* Studio Header */}
      <Header
        rubric={rubric}
        wordCount={wordCount}
        citationStyle={citationStyle}
        onCitationStyleChange={setCitationStyle}
        onOpenProofread={handleRunProofread}
        onOpenShowYourWork={() => setIsShowYourWorkOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onSelectSample={handleSelectSample}
        onOpenNewPaper={() => setIsNewPaperOpen(true)}
        onOpenPastProjects={() => setIsPastProjectsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onStartGuidedTour={() => setRunTour(true)}
        savedPaperCount={userPapers.length}
        isSavingToCloud={isSavingToCloud}
        isProofreading={isProofreading}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleTheme}
      />

      {/* Three-Pane Core Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Panel: Ingestion & Rubric Context */}
        <LeftPanel
          rubric={rubric}
          onUpdateRubric={setRubric}
          onExtractRubric={handleExtractRubric}
          isLoading={isExtractingRubric}
          progressionSteps={progressionSteps}
          onOpenShowYourWork={() => setIsShowYourWorkOpen(true)}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={() => setIsLeftPanelCollapsed((prev) => !prev)}
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
          documentContent={content}
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
          isCollapsed={isRightPanelCollapsed}
          onToggleCollapse={() => setIsRightPanelCollapsed((prev) => !prev)}
        />
      </div>

      {/* Modals & Workflows */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onComplete={handleCompleteTutorial}
      />

      <NewPaperModal
        isOpen={isNewPaperOpen}
        onClose={() => setIsNewPaperOpen(false)}
        onCreate={handleCreateNewPaper}
      />

      <PastProjectsModal
        isOpen={isPastProjectsOpen}
        onClose={() => setIsPastProjectsOpen(false)}
        projects={userPapers}
        activeProjectId={currentPaperId || undefined}
        isLoading={false}
        onSelectProject={loadPaperIntoWorkspace}
        onDeleteProject={handleDeletePaper}
        onNewPaperClick={() => setIsNewPaperOpen(true)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportAndAnalyze={handleImportDocument}
        isAnalyzing={isAnalysisOpen}
      />

      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        analysis={importAnalysisResult}
        extractedPapers={extractedImportPapers}
        onAddSourcesToPool={(papers) => {
          papers.forEach((s) => {
            handleAddPaperToPool(s);
          });
        }}
        onOpenRubricUpload={() => {
          setIsAnalysisOpen(false);
        }}
      />

      <NoRubricPromptModal
        isOpen={isNoRubricPromptOpen}
        onClose={() => setIsNoRubricPromptOpen(false)}
        onOpenRubricUpload={() => {
          setIsNoRubricPromptOpen(false);
        }}
        onContinueAnyway={() => {
          setIsNoRubricPromptOpen(false);
          setIsImportOpen(true);
        }}
      />

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
        titlePageConfig={titlePageConfig}
        onUpdateTitlePageConfig={setTitlePageConfig}
      />
    </div>
  );
}
