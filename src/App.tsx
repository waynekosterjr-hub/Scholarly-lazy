import { draftWithoutRepeatedHeading } from './utils/documentLayout';
import { aiFetch, apiErrorMessage } from './lib/aiApi';
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
  DraftSectionResponse,
  EditorAssistResponse,
  SaveStatus,
} from './types';
import { formatInTextCitation } from './utils/citationFormatter';
import {
  fetchUserProjects,
  saveProject,
  deleteProject,
  createNewProject,
  getLocalProjects,
  cacheProject,
  setLocalProjects,
  createDefaultBlankPaper,
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
  const [initialPaper] = useState(() => {
    const userId = auth.currentUser?.uid || 'local-user';
    return getLocalProjects(userId).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0]
      || createDefaultBlankPaper(userId);
  });
  const hadCachedPaper = useRef(getLocalProjects(auth.currentUser?.uid).some(p => p.id === initialPaper.id));
  const workspaceEdited = useRef(false);
  const emptyTitlePage: TitlePageConfig = { authorName: '', institution: '', instructorName: '', courseName: '', includeTitlePage: true, paperTitle: '', dueDate: '' };
  const [rubric, setRubric] = useState<AssignmentRubric | null>(initialPaper.rubric);
  const [references, setReferences] = useState<ScholarlyPaper[]>(initialPaper.references);
  const [content, setContent] = useState(initialPaper.content);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(initialPaper.citationStyle);
  const [studentDirection, setStudentDirection] = useState(initialPaper.studentDirection);
  const [outline, setOutline] = useState<OutlineSection[]>(initialPaper.outline);
  const [progressionSteps, setProgressionSteps] = useState<ProgressionStep[]>(initialPaper.progressionSteps);
  const [titlePageConfig, setTitlePageConfig] = useState<TitlePageConfig>(initialPaper.titlePageConfig || { ...emptyTitlePage, paperTitle: initialPaper.title, courseName: initialPaper.courseName || '' });
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(initialPaper.id);
  const [userPapers, setUserPapers] = useState<SavedPaper[]>(getLocalProjects(auth.currentUser?.uid));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const initialWorkspace = useRef(JSON.stringify({ currentPaperId, content, rubric, references, outline, citationStyle, studentDirection, titlePageConfig, progressionSteps }));
  const [saveError, setSaveError] = useState('');
  const isSavingToCloud = saveStatus === 'syncing';
  const saveMessage = saveStatus === 'cloud' ? 'Saved to Cloud' : saveStatus === 'syncing' ? 'Saved on this device · syncing…' : saveStatus === 'local' ? 'Saved on this device' : saveStatus === 'error' ? saveError : 'Unsaved changes';

  // Panel Collapsing States
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isNewPaperOpen, setIsNewPaperOpen] = useState(false);
  const [isPastProjectsOpen, setIsPastProjectsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
    const initialPapers = getLocalProjects(auth.currentUser?.uid);
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
          if (!workspaceEdited.current) {
            const recent = hadCachedPaper.current
              ? papers.find(p => p.id === initialPaper.id)
              : papers.find(p => p.id !== initialPaper.id);
            if (recent) {
              if (!hadCachedPaper.current) setLocalProjects(getLocalProjects().filter(p => p.id !== initialPaper.id));
              loadPaperIntoWorkspace(recent);
              setUserPapers(hadCachedPaper.current ? papers : papers.filter(p => p.id !== initialPaper.id));
            }
          }
        } catch (err) {
          console.error('Failed to load user papers:', err);
        } finally {
          setProjectsLoaded(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Live word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Cache every change immediately; debounce only the network write.
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId || !currentPaperId) return;
    const snapshot = JSON.stringify({ currentPaperId, content, rubric, references, outline, citationStyle, studentDirection, titlePageConfig, progressionSteps });
    if (snapshot !== initialWorkspace.current) workspaceEdited.current = true;
    const existing = getLocalProjects(userId).find(p => p.id === currentPaperId);
    const paper: SavedPaper = {
      id: currentPaperId, userId,
      title: titlePageConfig.paperTitle?.trim() || rubric?.title || 'Untitled Academic Paper',
      courseName: titlePageConfig.courseName || rubric?.courseName || '',
      citationStyle, content, studentDirection, wordCount, rubric, references, outline, progressionSteps, titlePageConfig,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: !workspaceEdited.current && existing ? existing.updatedAt : new Date().toISOString(),
    };
    try {
      cacheProject(paper);
      setUserPapers(getLocalProjects(userId));
      setSaveStatus('local');
      setSaveError('');
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Draft could not be saved.');
      return;
    }
    // Do not push an old cached draft before comparing it with the initial cloud read.
    if (!projectsLoaded || userId === 'local-user' || userId === 'guest-user') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSaveStatus('syncing');
      try {
        await saveProject(paper);
        if (!cancelled) setSaveStatus('cloud');
      } catch (error) {
        if (!cancelled) {
          setSaveStatus('error');
          setSaveError('Saved on this device · cloud sync failed');
        }
      }
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [content, rubric, references, outline, citationStyle, studentDirection, currentPaperId, wordCount, titlePageConfig, progressionSteps, projectsLoaded]);

  // Helpers to load / reset workspace
  const loadPaperIntoWorkspace = (paper: SavedPaper) => {
    setCurrentPaperId(paper.id);
    setTitlePageConfig(paper.titlePageConfig || { ...emptyTitlePage, paperTitle: paper.title, courseName: paper.courseName || '' });
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
    setCurrentPaperId(crypto.randomUUID());
    setTitlePageConfig({ ...emptyTitlePage });
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
    // The initial workspace is already a blank, persistent project.
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
      alert('Could not create the paper. Your existing draft is unchanged.');
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
      alert('The paper could not be deleted. Check your connection and try again.');
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
      const res = await aiFetch('/api/rubric/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to extract rubric');
      const data = await res.json();
      if (data.rubric) {
        setRubric(data.rubric);
        setTitlePageConfig(prev => ({ ...prev, paperTitle: data.rubric.title, courseName: data.rubric.courseName || prev.courseName }));
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
      const res = await aiFetch('/api/scholarly/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 8 }),
      });

      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Search failed'); }
      const data = await res.json();
      return data.papers || [];
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Scholarly search failed.');
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
    const index = references.findIndex(p => p.paperId === paperId);
    if (citationStyle === 'IEEE' && index >= 0) {
      setContent(previous => previous.replace(/\[(\d+)\]/g, (match, value) => {
        const number = Number(value);
        return number === index + 1 ? '[citation needed]' : number > index + 1 ? '[' + (number - 1) + ']' : match;
      }));
    }
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
    const cite = formatInTextCitation(paper, citationStyle, { narrative, citationIndex: references.findIndex(r => r.paperId === paper.paperId) });
    setContent((prev) => prev + ' ' + cite + ' ');
  };

  // 5. Generate AI Outline
  const handleGenerateOutline = async () => {
    try {
      setIsGeneratingOutline(true);
      const res = await aiFetch('/api/strategy/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rubric,
          selectedArticles: references,
          studentDirection,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Failed to generate outline'));
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
      const res = await aiFetch('/api/strategy/draft-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          existingDocumentText: content,
          rubric,
          selectedArticles: references,
          studentDirection,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Failed to draft section'));
      const data: DraftSectionResponse = await res.json();
      if (data.draftContent) {
        const nextOutline = outline.map((s) => (s.id === section.id ? { ...s, draftContent: data.draftContent } : s));
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
      return `${prev}${divider}## ${section.heading}\n\n${draftWithoutRepeatedHeading(section.draftContent, section.heading)}`;
    });
  };


  // 7. Contextual Editor Assistant Actions
  const handleEditorAssist = async (action: string, selectedText: string): Promise<string> => {
    try {
      setIsAssisting(true);
      const res = await aiFetch('/api/editor/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          fullDocument: content,
          selectedText,
          rubric,
          references,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Assist action failed'));
      const data: EditorAssistResponse = await res.json();
      return data.result || '';
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
      const res = await aiFetch('/api/proofread/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: content,
          rubric,
          selectedArticles: references,
          citationStyle,
        }),
      });

      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Proofread failed'));
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
  const handleImportDocument = async (importedText: string, suppliedTitle?: string) => {
    if (isImporting || !auth.currentUser) return;
    setIsImporting(true);
    const title = suppliedTitle?.trim() || importedText.split('\n')[0].replace(/^#+\s*/, '').slice(0, 100).trim() || 'Imported Research Paper';
    const importedPaper = createDefaultBlankPaper(auth.currentUser.uid, title, rubric?.courseName || '', citationStyle);
    importedPaper.content = importedText;
    importedPaper.wordCount = importedText.trim().split(/\s+/).length;
    importedPaper.rubric = rubric ? { ...rubric, title } : null;
    importedPaper.titlePageConfig = { ...emptyTitlePage, paperTitle: title, courseName: rubric?.courseName || '' };
    try {
      cacheProject(importedPaper);
    } catch (error) {
      setIsImporting(false);
      alert(error instanceof Error ? error.message : 'Could not save the imported document.');
      return;
    }
    try {
      const res = await aiFetch('/api/document/analyze-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: importedText, rubric, studentDirection }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Document analysis failed.');
      if (!data.analysis) throw new Error('The analysis response was empty.');
      const analysis: ImportAnalysisResult = data.analysis;
      const meta = analysis.titlePageMetadata || {};
      importedPaper.title = suppliedTitle?.trim() || meta.paperTitle?.trim() || analysis.extractedTitle?.trim() || title;
      importedPaper.titlePageConfig = { ...importedPaper.titlePageConfig, ...meta, paperTitle: importedPaper.title };
      if (importedPaper.rubric) importedPaper.rubric = { ...importedPaper.rubric, title: importedPaper.title };
      importedPaper.references = data.extractedPapers || [];
      importedPaper.progressionSteps.push({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), stage: 'AI Import Analysis', summary: 'Analyzed imported document', details: 'Identified ' + importedPaper.references.length + ' references. Check publication details before citing.' });
      setImportAnalysisResult(analysis);
      setExtractedImportPapers(importedPaper.references);
      setIsAnalysisOpen(true);
    } catch (error) {
      alert('Your document was imported and saved on this device, but AI analysis failed: ' + (error instanceof Error ? error.message : 'Please try again.'));
    } finally {
      loadPaperIntoWorkspace(importedPaper);
      setPendingImportText(importedText);
      setIsImporting(false);
    }
  };

  // 10. Sample Scenario Switcher
  const handleSelectSample = (id: string) => {
    const scenario = SAMPLE_ASSIGNMENTS.find((s) => s.id === id);
    if (!scenario) return;

    setCurrentPaperId(crypto.randomUUID());
    setTitlePageConfig({ ...emptyTitlePage, paperTitle: scenario.rubric.title, courseName: scenario.rubric.courseName || '' });
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
        paperTitle={titlePageConfig.paperTitle}
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
        saveMessage={saveMessage}
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
          saveMessage={saveMessage}
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
        isAnalyzing={isImporting}
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
        userId={auth.currentUser?.uid}
        onChangeContent={setContent}
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
