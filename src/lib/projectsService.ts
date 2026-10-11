import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SavedPaper, CitationStyle } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const PAPERS_COLLECTION = 'papers';
const LOCAL_STORAGE_KEY = 'scholardesk_saved_papers';

export function getLocalProjects(userId?: string): SavedPaper[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(p => !userId || p.userId === userId) : [];
  } catch {
    return [];
  }
}

export function setLocalProjects(papers: SavedPaper[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(papers));
  } catch (err) {
    throw new Error('Could not save this draft on this device. Export a copy before closing the page.');
  }
}

export async function fetchUserProjects(userId?: string): Promise<SavedPaper[]> {
  const localPapers = getLocalProjects(userId);
  if (!userId) return localPapers;

  const path = PAPERS_COLLECTION;
  try {
    const q = query(
      collection(db, PAPERS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const cloudPapers: SavedPaper[] = [];
    snapshot.forEach((d) => {
      cloudPapers.push({ id: d.id, ...d.data() } as SavedPaper);
    });

    // Re-read the cache after the request: edits may have happened while offline or loading.
    const allLocal = getLocalProjects();
    const byId = new Map(cloudPapers.map(p => [p.id, p]));
    for (const paper of allLocal.filter(p => p.userId === userId)) {
      const cloud = byId.get(paper.id);
      if (!cloud || Date.parse(paper.updatedAt) >= Date.parse(cloud.updatedAt)) byId.set(paper.id, paper);
    }
    const merged = [...byId.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    setLocalProjects([...allLocal.filter(p => p.userId !== userId), ...merged]);
    return merged;
  } catch (error) {
    console.warn('Firestore listing fallback to local cache:', error);
    return getLocalProjects(userId);
  }
}

export function cacheProject(paper: SavedPaper): void {
  const local = getLocalProjects();
  setLocalProjects([paper, ...local.filter(p => p.id !== paper.id)]);
}

export async function saveProject(paper: SavedPaper): Promise<void> {
  if (!paper.id) {
    throw new Error('Paper ID is required to save.');
  }

  cacheProject(paper);

  if (!paper.userId || paper.userId === 'guest-user' || paper.userId === 'local-user') {
    return;
  }

  const path = `${PAPERS_COLLECTION}/${paper.id}`;
  try {
    await setDoc(doc(db, PAPERS_COLLECTION, paper.id), {
      ...JSON.parse(JSON.stringify(paper)),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProject(paperId: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (userId && userId !== 'local-user' && userId !== 'guest-user') {
    const path = PAPERS_COLLECTION + '/' + paperId;
    try {
      await deleteDoc(doc(db, PAPERS_COLLECTION, paperId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
  setLocalProjects(getLocalProjects().filter(p => p.id !== paperId));
}

export function createDefaultBlankPaper(
  userId: string,
  title: string = 'Untitled Research Paper',
  courseName: string = '',
  citationStyle: CitationStyle = 'APA7',
  targetWords: number = 2000
): SavedPaper {
  const now = new Date().toISOString();
  return {
    id: `paper-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title,
    courseName,
    content: '',
    citationStyle,
    studentDirection: '',
    wordCount: 0,
    rubric: {
      title,
      courseName,
      assignmentType: 'Research Essay',
      requiredWordCount: { min: Math.round(targetWords * 0.75), max: Math.round(targetWords * 1.25), target: targetWords },
      requiredCitationStyle: citationStyle,
      requiredSourceCount: 4,
      topicConstraints: [],
      keyQuestionsToAnswer: [],
      formattingRules: ['1-inch margins', 'Standard font (12pt)', 'In-text citations and reference list'],
      criteria: [
        {
          id: 'crit-1',
          category: 'Thesis & Argumentation',
          description: 'Clear, defensible, and academically rigorous central thesis argument.',
          weight: 30,
          status: 'unmet',
          guidelines: ['State a clear problem statement', 'Develop logical progression of sub-arguments'],
        },
        {
          id: 'crit-2',
          category: 'Scholarly Evidence & Citations',
          description: 'Incorporates high-quality peer-reviewed literature with accurate formatting.',
          weight: 35,
          status: 'unmet',
          guidelines: ['Cite minimum required scholarly sources', `Adhere strictly to ${citationStyle} formatting`],
        },
        {
          id: 'crit-3',
          category: 'Critical Synthesis & Nuance',
          description: 'Addresses counter-arguments, methodological limitations, and synthesis.',
          weight: 20,
          status: 'unmet',
          guidelines: ['Contrast differing scholarly viewpoints', 'Acknowledge empirical limitations'],
        },
        {
          id: 'crit-4',
          category: 'Structure & Academic Style',
          description: 'Logical organization, formal prose, clear transitions, and mechanics.',
          weight: 15,
          status: 'unmet',
          guidelines: ['Maintain formal third-person objective tone', 'Cohesive paragraph structure'],
        },
      ],
    },
    references: [],
    outline: [],
    progressionSteps: [
      {
        id: `step-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stage: 'Rubric Ingestion',
        summary: `Created new project workspace: "${title}"`,
        details: `Configured workspace for ${courseName || 'general academic research'} with ${citationStyle} style target.`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export async function createNewProject(
  userId: string,
  params: {
    title: string;
    courseName?: string;
    citationStyle: CitationStyle;
    targetWordCount: number;
    initialThesis?: string;
  }
): Promise<SavedPaper> {
  const paper = createDefaultBlankPaper(
    userId,
    params.title,
    params.courseName || '',
    params.citationStyle,
    params.targetWordCount
  );
  if (params.initialThesis) {
    paper.studentDirection = params.initialThesis;
  }
  cacheProject(paper);
  return paper;
}

