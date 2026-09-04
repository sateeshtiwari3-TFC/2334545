import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Project, 
  Studio, 
  Editor, 
  Revision, 
  UserRole, 
  CalendarEvent, 
  PaymentHistory, 
  ProjectStatus, 
  ProjectPriority 
} from '../types';
import { ProjectsHeaderKpi } from './projects/ProjectsHeaderKpi';
import { ProjectsFilterBar } from './projects/ProjectsFilterBar';
import { ProjectCardGrid } from './projects/ProjectCardGrid';
import { ProjectListView } from './projects/ProjectListView';
import { ProjectKanbanBoard } from './projects/ProjectKanbanBoard';
import { ProjectDetailDrawer } from './projects/ProjectDetailDrawer';
import { ProjectFormModal } from './projects/ProjectFormModal';
import { ProjectQuickNoteModal } from './projects/ProjectQuickNoteModal';
import { WhatsAppShareModal } from './projects/WhatsAppShareModal';
import ProjectWorksheetModal from './ProjectWorksheetModal';
import QuickPrintInvoiceModal from './QuickPrintInvoiceModal';
import { ProjectPdfExportModal } from './ProjectPdfExportModal';

interface ProjectsViewProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  revisions: Revision[];
  payments?: PaymentHistory[];
  calendarEvents?: CalendarEvent[];
  userRole: UserRole;
  currentStudioId?: string;
  onAddProject: (project: Omit<Project, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddRevision: (revision: Omit<Revision, 'id' | 'createdAt'>) => Promise<void>;
  onResolveRevision: (revId: string) => Promise<void>;
  onDeleteRevision?: (revId: string) => Promise<void>;
  onRedirectToRegistry?: () => void;
  initialTriggerAction?: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  studios,
  editors,
  revisions,
  payments = [],
  calendarEvents = [],
  userRole,
  currentStudioId,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddRevision,
  onResolveRevision,
  onDeleteRevision,
  onRedirectToRegistry,
  initialTriggerAction
}) => {
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [studioFilter, setStudioFilter] = useState<string>(currentStudioId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('delivery_asc');

  // Modals and Drawer state
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [quickNoteProject, setQuickNoteProject] = useState<Project | null>(null);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);

  const [whatsAppProject, setWhatsAppProject] = useState<Project | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const [worksheetProject, setWorksheetProject] = useState<Project | null>(null);
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);

  const [invoiceProject, setInvoiceProject] = useState<Project | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);

  // Photo Hover Zoom Preview lightbox
  const [hoveredPhoto, setHoveredPhoto] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Keyboard shortcut listener for search '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('projects-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Initial Trigger Action from Navigation if present
  useEffect(() => {
    if (initialTriggerAction === 'new-project') {
      setEditingProject(null);
      setIsFormModalOpen(true);
    }
  }, [initialTriggerAction]);

  // Main Filtering and Sorting computation
  const filteredProjects = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      // Studio filter
      if (studioFilter !== 'all' && project.studioId !== studioFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && project.priority !== priorityFilter) {
        return false;
      }

      // Tag filter
      if (tagFilter !== 'all') {
        if (!project.tags || !project.tags.includes(tagFilter)) {
          return false;
        }
      }

      // Deadline filter
      if (deadlineFilter === 'due_7_days') {
        if (!project.deliveryDate) return false;
        const diffDays = Math.ceil((new Date(project.deliveryDate).getTime() - now) / (1000 * 3600 * 24));
        if (diffDays > 7 || ['delivered', 'closed'].includes(project.status)) {
          return false;
        }
      }

      // Search Query filter
      if (query) {
        const matchName = (project.projectName || '').toLowerCase().includes(query);
        const matchCouple = (project.coupleName || '').toLowerCase().includes(query);
        const matchId = (project.id || '').toLowerCase().includes(query);
        const matchStudio = (project.studioName || '').toLowerCase().includes(query);
        const matchEditor = (project.assignedEditorName || '').toLowerCase().includes(query);
        const matchNotes = (project.notes || '').toLowerCase().includes(query);
        if (!matchName && !matchCouple && !matchId && !matchStudio && !matchEditor && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'delivery_asc') {
        const da = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 9999999999999;
        const db = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 9999999999999;
        return da - db;
      }
      if (sortBy === 'delivery_desc') {
        const da = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        const db = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
        return db - da;
      }
      if (sortBy === 'shoot_desc') {
        const sa = a.shootDate ? new Date(a.shootDate).getTime() : 0;
        const sb = b.shootDate ? new Date(b.shootDate).getTime() : 0;
        return sb - sa;
      }
      if (sortBy === 'amount_desc') {
        return (Number(b.projectAmount) || 0) - (Number(a.projectAmount) || 0);
      }
      if (sortBy === 'balance_desc') {
        const balA = Math.max(0, (Number(a.projectAmount) || 0) - (Number(a.advancePayment) || 0));
        const balB = Math.max(0, (Number(b.projectAmount) || 0) - (Number(b.advancePayment) || 0));
        return balB - balA;
      }
      if (sortBy === 'name_asc') {
        return (a.projectName || a.coupleName || '').localeCompare(b.projectName || b.coupleName || '');
      }
      return 0;
    });
  }, [projects, searchQuery, studioFilter, statusFilter, priorityFilter, tagFilter, deadlineFilter, sortBy]);

  // Status Updater
  const handleUpdateStatus = async (projectId: string, status: ProjectStatus) => {
    try {
      await onUpdateProject(projectId, { status });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Tag Toggler
  const handleToggleTag = async (projectId: string, tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const current = proj.tags || [];
    const nextTags = current.includes(tagId) ? current.filter(t => t !== tagId) : [...current, tagId];
    await onUpdateProject(projectId, { tags: nextTags });
  };

  // Quick Note appender
  const handleSaveQuickNote = async (projectId: string, notes: string) => {
    await onUpdateProject(projectId, { notes });
  };

  // Open Specs Drawer
  const handleSelectProject = (proj: Project) => {
    setSelectedProjectForDetail(proj);
    setIsDetailDrawerOpen(true);
  };

  // Open Edit Modal
  const handleEditProject = (proj: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(proj);
    setIsFormModalOpen(true);
  };

  // Open Delete
  const handleDeleteProject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete / archive this project?')) {
      await onDeleteProject(id);
      if (selectedProjectForDetail?.id === id) {
        setIsDetailDrawerOpen(false);
      }
    }
  };

  // Open Quick Note
  const handleOpenQuickNote = (proj: Project) => {
    setQuickNoteProject(proj);
    setIsQuickNoteModalOpen(true);
  };

  // Open WhatsApp
  const handleOpenWhatsAppShare = (proj: Project) => {
    setWhatsAppProject(proj);
    setIsWhatsAppModalOpen(true);
  };

  // Open Worksheet
  const handleOpenWorksheet = (proj: Project) => {
    setWorksheetProject(proj);
    setIsWorksheetModalOpen(true);
  };

  // Open Quick Print Invoice
  const handleOpenQuickPrintInvoice = (proj: Project) => {
    setInvoiceProject(proj);
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* 1. Ultra-Premium Executive Production Header */}
      <ProjectsHeaderKpi
        projects={projects}
        filteredProjects={filteredProjects}
        studios={studios}
        editors={editors}
        onOpenWeekShoots={() => setDeadlineFilter('due_7_days')}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        deadlineFilter={deadlineFilter}
        setDeadlineFilter={setDeadlineFilter}
      />

      {/* 2. Unified Precision Toolbar */}
      <ProjectsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        studios={studios}
        studioFilter={studioFilter}
        setStudioFilter={setStudioFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        deadlineFilter={deadlineFilter}
        setDeadlineFilter={setDeadlineFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalProjectsCount={projects.length}
        filteredProjectsCount={filteredProjects.length}
        onOpenNewProjectModal={() => {
          setEditingProject(null);
          setIsFormModalOpen(true);
        }}
        onOpenPdfExportModal={() => setIsPdfExportModalOpen(true)}
        userRole={userRole}
      />

      {/* 3. Primary Content Views: Grid / Table / Kanban */}
      <div className="mt-4">
        {viewMode === 'grid' && (
          <ProjectCardGrid
            projects={filteredProjects}
            studios={studios}
            editors={editors}
            revisions={revisions}
            userRole={userRole}
            onSelectProject={handleSelectProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onOpenQuickNote={handleOpenQuickNote}
            onOpenWhatsAppShare={handleOpenWhatsAppShare}
            onOpenWorksheet={handleOpenWorksheet}
            onOpenQuickPrintInvoice={handleOpenQuickPrintInvoice}
            onToggleTag={handleToggleTag}
            onUpdateStatus={handleUpdateStatus}
            setHoveredPhoto={setHoveredPhoto}
          />
        )}

        {viewMode === 'list' && (
          <ProjectListView
            projects={filteredProjects}
            studios={studios}
            editors={editors}
            revisions={revisions}
            userRole={userRole}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            deadlineFilter={deadlineFilter}
            setDeadlineFilter={setDeadlineFilter}
            onSelectProject={handleSelectProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onOpenQuickNote={handleOpenQuickNote}
            onOpenWhatsAppShare={handleOpenWhatsAppShare}
            onOpenWorksheet={handleOpenWorksheet}
            onOpenQuickPrintInvoice={handleOpenQuickPrintInvoice}
            onToggleTag={handleToggleTag}
            onUpdateStatus={handleUpdateStatus}
            setHoveredPhoto={setHoveredPhoto}
          />
        )}

        {viewMode === 'kanban' && (
          <ProjectKanbanBoard
            projects={filteredProjects}
            studios={studios}
            editors={editors}
            revisions={revisions}
            userRole={userRole}
            onSelectProject={handleSelectProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onOpenQuickNote={handleOpenQuickNote}
            onOpenWhatsAppShare={handleOpenWhatsAppShare}
            onUpdateStatus={handleUpdateStatus}
            setHoveredPhoto={setHoveredPhoto}
          />
        )}
      </div>

      {/* 4. Full Specifications Slide-Over Drawer */}
      <ProjectDetailDrawer
        project={selectedProjectForDetail}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        studios={studios}
        editors={editors}
        revisions={revisions}
        calendarEvents={calendarEvents}
        userRole={userRole}
        onUpdateProject={onUpdateProject}
        onDeleteProject={handleDeleteProject}
        onAddRevision={onAddRevision}
        onResolveRevision={onResolveRevision}
        onEditSpecs={(p) => {
          setIsDetailDrawerOpen(false);
          handleEditProject(p);
        }}
        onOpenQuickPrintInvoice={(p) => {
          setIsDetailDrawerOpen(false);
          handleOpenQuickPrintInvoice(p);
        }}
        onOpenWorksheet={(p) => {
          setIsDetailDrawerOpen(false);
          handleOpenWorksheet(p);
        }}
        onOpenPdfExport={(p) => {
          setIsDetailDrawerOpen(false);
          setIsPdfExportModalOpen(true);
        }}
        onOpenWhatsAppShare={(p) => handleOpenWhatsAppShare(p)}
        onOpenQuickNote={(p) => handleOpenQuickNote(p)}
        onToggleTag={handleToggleTag}
      />

      {/* 5. New / Edit Wedding Registry Form Modal */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={async (data) => {
          if (editingProject) {
            await onUpdateProject(editingProject.id, data);
          } else {
            await onAddProject(data);
          }
        }}
        editingProject={editingProject}
        studios={studios}
        editors={editors}
        userRole={userRole}
        currentStudioId={currentStudioId}
      />

      {/* 6. Quick Note Logger Modal */}
      <ProjectQuickNoteModal
        project={quickNoteProject}
        isOpen={isQuickNoteModalOpen}
        onClose={() => setIsQuickNoteModalOpen(false)}
        onSaveNote={handleSaveQuickNote}
      />

      {/* 7. WhatsApp Dispatch Modal */}
      <WhatsAppShareModal
        project={whatsAppProject}
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        studios={studios}
      />

      {/* 8. Production Worksheet Modal */}
      {worksheetProject && (
        <ProjectWorksheetModal
          project={worksheetProject}
          studios={studios}
          editors={editors}
          revisions={revisions.filter(r => r.projectId === worksheetProject.id)}
          isOpen={isWorksheetModalOpen}
          onClose={() => setIsWorksheetModalOpen(false)}
        />
      )}

      {/* 9. Quick Print Invoice Modal */}
      {invoiceProject && (
        <QuickPrintInvoiceModal
          project={invoiceProject}
          studio={studios.find(s => s.id === invoiceProject.studioId || s.name === invoiceProject.studioName)}
          editor={editors.find(e => e.id === invoiceProject.assignedEditorId || e.name === invoiceProject.assignedEditorName)}
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}

      {/* 10. Multi-Project Styled PDF Export Modal */}
      <ProjectPdfExportModal
        isOpen={isPdfExportModalOpen}
        onClose={() => setIsPdfExportModalOpen(false)}
        projects={projects}
        filteredProjects={filteredProjects}
        studios={studios}
        editors={editors}
        revisions={revisions}
        userRole={userRole}
      />

      {/* 11. Floating Photo Lightbox Zoom Overlay on Hover */}
      <AnimatePresence>
        {hoveredPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-8 right-8 z-50 pointer-events-none hidden md:block"
          >
            <div className="p-2 rounded-3xl bg-charcoal-950/95 border-2 border-gold-500/60 shadow-2xl shadow-black/80 backdrop-blur-xl w-64 overflow-hidden">
              <img
                src={hoveredPhoto.url}
                alt={hoveredPhoto.title}
                className="w-full h-44 object-cover rounded-2xl"
              />
              <div className="p-2.5">
                <h4 className="text-xs font-bold text-white truncate font-display">{hoveredPhoto.title}</h4>
                <p className="text-[10px] text-gold-400 font-mono truncate">{hoveredPhoto.subtitle}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProjectsView;
