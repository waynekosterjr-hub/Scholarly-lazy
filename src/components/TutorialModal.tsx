import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FileCheck,
  GraduationCap,
  Download,
  ChevronRight,
  ChevronLeft,
  X,
  Search,
  AtSign,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface Step {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  targetArea: 'center' | 'left' | 'right' | 'top';
  tips: string[];
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: Step[] = [
    {
      title: 'Welcome to ScholarDesk',
      subtitle: 'Your Academic Research & Writing Studio',
      description:
        'ScholarDesk is designed specifically for students, researchers, and academic writers. It unifies syllabus rubric extraction, Semantic Scholar peer-reviewed research, citation management, and strict professor grading in one workspace.',
      icon: GraduationCap,
      iconColor: 'text-[#0078D4] bg-blue-100 dark:bg-blue-900/40',
      targetArea: 'center',
      tips: [
        'No manual API configuration required for your testing session',
        'Automatic cloud save to your authenticated Google account',
        'Export directly to polished Word (.docx) with APA/MLA references',
      ],
    },
    {
      title: '1. Ingestion & Rubric Criteria',
      subtitle: 'Left Panel: Turn Syllabi into Checklists',
      description:
        'Upload your assignment PDF, screenshot, or syllabus guidelines. Gemini AI extracts all grading criteria, target word counts, and formatting constraints into an interactive checklist you can track while drafting.',
      icon: FileCheck,
      iconColor: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40',
      targetArea: 'left',
      tips: [
        'Click the arrow buttons on panel borders to collapse or maximize views',
        'Click checkboxes to mark criteria as fulfilled or in-progress',
        'View the Academic Integrity Log at the bottom of the panel',
      ],
    },
    {
      title: '2. Academic Editor & In-Text Citations',
      subtitle: 'Center Canvas: Focused Writing with "@" Triggers',
      description:
        'Write your paper on a clean, distraction-free academic canvas formatted according to university standards. Type "@" anywhere to instantly search and insert formatted in-text citations.',
      icon: AtSign,
      iconColor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40',
      targetArea: 'center',
      tips: [
        'Type "@" to trigger citation autocomplete from your reference pool',
        'Switch between parenthetical (Smith, 2024) and narrative Smith (2024) styles',
        'Use the AI Prose Tools ribbon to elevate academic tone and deepen arguments',
      ],
    },
    {
      title: '3. Peer-Reviewed Research & Outline Synthesis',
      subtitle: 'Right Panel: Semantic Scholar & AI Strategy',
      description:
        'Query the Semantic Scholar API to discover legitimate peer-reviewed journal articles. Save studies to your Reference Pool and synthesize a cross-referenced outline mapping your thesis to citations.',
      icon: Search,
      iconColor: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40',
      targetArea: 'right',
      tips: [
        'Add articles from Semantic Scholar with 1-click to your Reference Pool',
        'Generate structured outlines that cross-reference specific studies',
        'Draft individual sections with AI aligned to your thesis',
      ],
    },
    {
      title: '4. Professor Review & Document Import',
      subtitle: 'Header Actions: Verification & Integrity',
      description:
        'Run the strict "Professor Review" tool to grade your draft against your rubric. Import existing essays to automatically identify sources and receive comprehensive AI recommendations.',
      icon: ShieldCheck,
      iconColor: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40',
      targetArea: 'top',
      tips: [
        'Click "Import" to paste or upload an existing draft and identify sources',
        'Click "Past Projects" to switch between papers saved to your Google account',
        'Export to Word (.docx) with formatted Works Cited / Reference pages',
      ],
    },
  ];

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Visual Spotlight Highlight Box */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#161616]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/50 text-[#0078D4] border border-blue-200 dark:border-blue-800">
              Quick Tour • Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition"
            title="Skip Tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-[#0078D4] transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${step.iconColor}`}>
              <step.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{step.title}</h2>
              <p className="text-xs font-semibold text-[#0078D4] mt-0.5">{step.subtitle}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>

          {/* Key Tips */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Key Capabilities:
            </p>
            <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
              {step.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#161616]">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1 transition"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white shadow-sm transition"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
