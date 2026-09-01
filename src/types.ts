export type CitationStyle = 'APA7' | 'MLA9' | 'CHICAGO' | 'IEEE' | 'HARVARD';

export interface Author {
  name: string;
  authorId?: string;
}

export interface ScholarlyPaper {
  paperId: string;
  title: string;
  authors: Author[];
  year: number | null;
  abstract: string | null;
  url?: string;
  citationCount?: number;
  venue?: string;
  doi?: string;
  selected?: boolean;
}

export interface RubricCriterion {
  id: string;
  category: string;
  description: string;
  weight: number; // percentage e.g. 25
  status: 'unmet' | 'partially_met' | 'fulfilled';
  guidelines: string[];
}

export interface AssignmentRubric {
  title: string;
  courseName?: string;
  assignmentType: string;
  requiredWordCount: { min: number; max: number; target: number };
  requiredCitationStyle: CitationStyle;
  requiredSourceCount: number;
  deadline?: string;
  topicConstraints: string[];
  keyQuestionsToAnswer: string[];
  formattingRules: string[];
  criteria: RubricCriterion[];
  rawExtractedText?: string;
}

export interface OutlinePoint {
  id: string;
  title: string;
  description: string;
  citedPaperIds: string[];
  isCounterArgument?: boolean;
  estimatedWords?: number;
}

export interface OutlineSection {
  id: string;
  heading: string;
  description: string;
  targetWordCount: number;
  points: OutlinePoint[];
  status: 'planned' | 'drafting' | 'completed';
  draftContent?: string;
}

export interface ReviewFeedback {
  overallScore: number; // 0 - 100
  letterGrade: string;
  strengths: string[];
  weaknesses: string[];
  rubricAdherence: {
    criterionId: string;
    criterionTitle: string;
    scoreObtained: number;
    maxScore: number;
    feedback: string;
    status: 'fulfilled' | 'partially_met' | 'unmet';
  }[];
  citationChecks: {
    citationText: string;
    paperFound: boolean;
    paperTitle?: string;
    styleCompliant: boolean;
    notes: string;
  }[];
  actionableSuggestions: {
    section: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  wordCountAnalysis: {
    currentWords: number;
    targetWords: number;
    status: 'within_range' | 'too_short' | 'too_long';
    recommendation: string;
  };
}

export interface ProgressionStep {
  id: string;
  timestamp: string;
  stage: 'Rubric Ingestion' | 'Scholarly Research' | 'Outline Synthesis' | 'Drafting' | 'Academic Review';
  summary: string;
  details: string;
}
