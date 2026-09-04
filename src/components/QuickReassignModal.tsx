import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  X, 
  User, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor, Project, Studio } from '../types';
import EditorLoadIndicator, { calculateEditorLoad } from './EditorLoadIndicator';

interface QuickReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceEditor: Editor;
  editors: Editor[];
  projects: Project[];
  studios?: Studio[];
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function QuickReassignModal({
  isOpen,
  onClose,
  sourceEditor,
  editors,
  projects,
  studios = [],
  onUpdateProject,
  onNotify
}: QuickReassignModalProps) {
  // Filter active & assigned projects for this editor
  const assignedProjects = useMemo(() => {
    return projects.filter(
      p => p.assignedEditorId === sourceEditor.id || (p.isSplitProject && p.secondEditorId === sourceEditor.id)
    );
  }, [projects, sourceEditor.id]);

  const activeAssignedProjects = useMemo(() => {
    return assignedProjects.filter(p => p.status !== 'delivered' && p.status !== 'closed');
  }, [assignedProjects]);

  const otherProjects = useMemo(() => {
    return assignedProjects.filter(p => p.status === 'delivered' || p.status === 'closed');
  }, [assignedProjects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return activeAssignedProjects[0]?.id || assignedProjects[0]?.id || '';
  });

  const [targetEditorId, setTargetEditorId] = useState<string>('');
  const [reassignRole, setReassignRole] = useState<'primary' | 'secondary' | 'auto'>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target editor candidates (all other editors)
  const availableTargetEditors = useMemo(() => {
    return editors.filter(e => e.id !== sourceEditor.id);
  }, [editors, sourceEditor.id]);

  // Selected project object
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Target editor object
  const targetEditor = useMemo(() => {
    return editors.find(e => e.id === targetEditorId);
  }, [editors, targetEditorId]);

  // Studio for current project
  const currentStudio = useMemo(() => {
    if (!currentProject) return null;
    return studios.find(s => s.id === currentProject.studioId);
  }, [studios, currentProject]);

  // Handle reassign execution
  const handleReassign = async () => {
    if (!currentProject) {
      onNotify?.('Please select a project to reassign.', 'error');
      return;
    }
    if (!targetEditorId) {
      onNotify?.('Please select a destination editor.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<Project> = {};
      const isPrimary = currentProject.assignedEditorId === sourceEditor.id;
      const isSecondary = currentProject.isSplitProject && currentProject.secondEditorId === sourceEditor.id;

      if (isPrimary && !isSecondary) {
        // Source is primary editor
        updates.assignedEditorId = targetEditorId;
        updates.assignedEditorName = targetEditor?.name || 'Assigned Editor';
      } else if (isSecondary && !isPrimary) {
        // Source is secondary split editor
        updates.secondEditorId = targetEditorId;
        updates.secondEditorName = targetEditor?.name || 'Secondary Editor';
      } else {
        // Source might be both or role forced
        if (reassignRole === 'secondary') {
          updates.secondEditorId = targetEditorId;
          updates.secondEditorName = targetEditor?.name || 'Secondary Editor';
        } else {
          updates.assignedEditorId = targetEditorId;
          updates.assignedEditorName = targetEditor?.name || 'Assigned Editor';
        }
      }

      await onUpdateProject(currentProject.id, updates);
      onNotify?.(
        `Successfully transferred "${currentProject.title}" from ${sourceEditor.name} to ${targetEditor?.name}!`,
        'success'
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to reassign project:', err);
      onNotify?.(`Failed to reassign project: ${err?.message || 'Error occurred'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-charcoal-900 border border-luxury-green-800/30 rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-luxury-green-800/20 bg-gradient-to-r from-luxury-green-950/70 via-charcoal-900 to-charcoal-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-gold-500/20 to-luxury-green-800/40 border border-gold-500/30 text-gold-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-serif">Quick Project Reassignment</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Transfer active cuts from <span className="text-gold-300 font-semibold">{sourceEditor.name}</span> to optimize workload distribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-charcoal-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Source & Target Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Editor Summary */}
            <div className="p-4 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Transfer From (Source)</span>
                <span className="text-[10px] text-rose-400 font-semibold">Active Load</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {sourceEditor.photo ? (
                    <img src={sourceEditor.photo} alt={sourceEditor.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{sourceEditor.name}</h4>
                  <p className="text-[11px] text-gray-400 truncate">{sourceEditor.specialties?.[0] || 'Cinematic Editor'}</p>
                </div>
              </div>
              <EditorLoadIndicator
                editor={sourceEditor}
                projects={projects}
                variant="compact"
                showBar={true}
              />
            </div>

            {/* Target Editor Summary */}
            <div className="p-4 rounded-2xl bg-charcoal-950/80 border border-gold-500/20 space-y-3 font-mono relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gold-400 uppercase tracking-wider font-bold">Transfer To (Destination)</span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {targetEditor ? 'Selected Editor' : 'Choose Below'}
                </span>
              </div>
              {targetEditor ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-gold-500/30 overflow-hidden flex items-center justify-center shrink-0">
                      {targetEditor.photo ? (
                        <img src={targetEditor.photo} alt={targetEditor.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-gold-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-gold-300 truncate">{targetEditor.name}</h4>
                      <p className="text-[11px] text-gray-400 truncate">{targetEditor.specialties?.[0] || 'Cinematic Editor'}</p>
                    </div>
                  </div>
                  <EditorLoadIndicator
                    editor={targetEditor}
                    projects={projects}
                    variant="compact"
                    showBar={true}
                  />
                </>
              ) : (
                <div className="h-24 flex flex-col items-center justify-center text-center p-2 rounded-xl bg-charcoal-900/40 border border-dashed border-white/10">
                  <ArrowRight className="w-4 h-4 text-gold-400/60 mb-1 animate-pulse" />
                  <p className="text-xs text-gray-400">Select a recipient editor from the dropdown below</p>
                </div>
              )}
            </div>
          </div>

          {/* 1. Step: Select Project to Transfer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-gold-400" />
                <span>1. Select Project to Reassign</span>
              </label>
              <span className="text-[11px] text-gray-500 font-mono">
                {activeAssignedProjects.length} Active ({assignedProjects.length} Total)
              </span>
            </div>

            {assignedProjects.length === 0 ? (
              <div className="p-4 rounded-xl bg-charcoal-950/60 border border-white/5 text-center text-gray-400 text-xs font-mono">
                No projects are currently assigned to {sourceEditor.name}.
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-charcoal-950 border border-white/10 hover:border-gold-500/40 focus:border-gold-500 rounded-xl px-4 py-3 text-sm text-gray-100 font-mono focus:outline-none transition-colors cursor-pointer"
                >
                  {activeAssignedProjects.length > 0 && (
                    <optgroup label="--- Active Projects (In Progress) ---">
                      {activeAssignedProjects.map(proj => (
                        <option key={proj.id} value={proj.id} className="bg-charcoal-950 text-white">
                          🎬 {proj.title} • {proj.status.toUpperCase()} {proj.deliveryDate ? `(Due: ${proj.deliveryDate})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherProjects.length > 0 && (
                    <optgroup label="--- Completed / Delivered Projects ---">
                      {otherProjects.map(proj => (
                        <option key={proj.id} value={proj.id} className="bg-charcoal-950 text-gray-400">
                          ✓ {proj.title} • {proj.status.toUpperCase()}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Selected Project Card Preview */}
                {currentProject && (
                  <div className="p-3.5 rounded-xl bg-charcoal-950/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white truncate">{currentProject.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-luxury-green-900/60 text-luxury-green-300 border border-luxury-green-700/40">
                          {currentProject.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                        {currentStudio && <span>🏢 {currentStudio.name}</span>}
                        {currentProject.shootDate && <span>📅 Shoot: {currentProject.shootDate}</span>}
                        {currentProject.deliveryDate && <span className="text-amber-400">⚡ Due: {currentProject.deliveryDate}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-gray-500 block">Editor Compensation</span>
                      <span className="font-bold text-yellow-400">
                        ₹{Number(currentProject.editorPayment || currentProject.firstEditorShare || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Step: Select Destination Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-gold-400" />
                <span>2. Select Destination Editor</span>
              </label>
              <span className="text-[11px] text-gray-500 font-mono">
                {availableTargetEditors.length} Available Editors
              </span>
            </div>

            <select
              value={targetEditorId}
              onChange={(e) => setTargetEditorId(e.target.value)}
              className="w-full bg-charcoal-950 border border-white/10 hover:border-gold-500/40 focus:border-gold-500 rounded-xl px-4 py-3 text-sm text-gray-100 font-mono focus:outline-none transition-colors cursor-pointer"
            >
              <option value="" className="bg-charcoal-950 text-gray-500">
                -- Choose Destination Editor --
              </option>
              {availableTargetEditors.map(ed => {
                const metrics = calculateEditorLoad(ed, projects);
                const loadLabel = 
                  metrics.activeCount === 0 
                    ? '🟢 0 Active (Available)' 
                    : metrics.activeCount <= 2 
                    ? `🔵 ${metrics.activeCount} Active (Optimal)` 
                    : metrics.activeCount <= 4 
                    ? `🟡 ${metrics.activeCount} Active (Heavy)` 
                    : `🔴 ${metrics.activeCount} Active (At Capacity)`;
                
                return (
                  <option key={ed.id} value={ed.id} className="bg-charcoal-950">
                    👤 {ed.name} — {loadLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-luxury-green-800/20 bg-charcoal-950 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/10 hover:bg-charcoal-800 text-gray-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleReassign}
            disabled={!currentProject || !targetEditorId || isSubmitting}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
              !currentProject || !targetEditorId || isSubmitting
                ? 'bg-charcoal-800 text-gray-500 border border-white/5 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-charcoal-950 shadow-gold-500/20 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                <span>Reassigning...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                <span>Confirm & Transfer Project</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
