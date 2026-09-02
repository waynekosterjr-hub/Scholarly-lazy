import React, { useState } from 'react';
import {
  FolderKanban,
  X,
  Search,
  FileText,
  Trash2,
  ExternalLink,
  Clock,
  BookOpen,
  CheckCircle2,
  Plus,
  Loader2,
} from 'lucide-react';
import { SavedPaper } from '../types';

interface PastProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedPaper[];
  activeProjectId?: string;
  isLoading: boolean;
  onSelectProject: (project: SavedPaper) => void;
  onDeleteProject: (projectId: string) => void;
  onNewPaperClick: () => void;
}

export const PastProjectsModal: React.FC<PastProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  isLoading,
  onSelectProject,
  onDeleteProject,
  onNewPaperClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.courseName && p.courseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this paper and its associated references?')) {
      setDeletingId(projectId);
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-[#F8F9FA] dark:bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0078D4] flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Past Projects & Saved Papers</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Synced to your Google Account ({projects.length} paper{projects.length === 1 ? '' : 's'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewPaperClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Paper</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your saved papers or courses..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#0078D4]" />
              <p className="text-xs">Loading your saved papers from Google Cloud...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {searchTerm ? 'No matching papers found' : 'No saved papers yet'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {searchTerm
                    ? 'Try searching with a different keyword or create a new paper.'
                    : 'Start your first academic writing project or import an existing draft.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewPaperClick();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Paper</span>
              </button>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isActive = project.id === activeProjectId;
              return (
                <div
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project);
                    onClose();
                  }}
                  className={`group p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                    isActive
                      ? 'border-[#0078D4] bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-[#0078D4]'
                      : 'border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#0078D4] transition">
                        {project.title || 'Untitled Paper'}
                      </h4>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0078D4] text-white flex-shrink-0">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {project.courseName && (
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {project.courseName}
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                      <span>•</span>
                      <span>{project.wordCount || 0} words</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px]">
                        {project.citationStyle || 'APA7'}
                      </span>
                      <span>•</span>
                      <span>{(project.references || []).length} references</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, project.id)}
                      disabled={deletingId === project.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg bg-[#0078D4] text-white hover:bg-blue-600 transition shadow-sm"
                      title="Open Paper"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
