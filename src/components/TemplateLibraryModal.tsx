import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Layers, 
  Clock, 
  IndianRupee, 
  User, 
  Film, 
  Check, 
  Edit, 
  Trash2, 
  Copy, 
  Plus, 
  Search, 
  Tag, 
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ProjectTemplate, Editor } from '../types';

interface TemplateLibraryModalProps {
  templates: ProjectTemplate[];
  editors: Editor[];
  selectedTemplateId?: string;
  onApplyTemplate: (template: ProjectTemplate) => void;
  onEditTemplate: (template: ProjectTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onCreateNewTemplate: () => void;
  onClose: () => void;
}

export default function TemplateLibraryModal({
  templates,
  editors,
  selectedTemplateId,
  onApplyTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateNewTemplate,
  onClose
}: TemplateLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewingTemplate, setPreviewingTemplate] = useState<ProjectTemplate | null>(null);

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.eventType)))];

  const filteredTemplates = templates.filter(tpl => {
    const matchesSearch = 
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tpl.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = categoryFilter === 'all' || tpl.eventType === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-charcoal-900 border border-gold-500/30 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl relative my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 md:px-8 border-b border-white/10 shrink-0 bg-charcoal-950/60 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-600/20 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold gold-glow">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-400">
                  Studio Blueprint Repository
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 font-bold">
                  {templates.length} Blueprints
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white font-display mt-0.5">
                Wedding Project Blueprints & Templates
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCreateNewTemplate}
              className="px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold rounded-xl text-xs font-mono shadow-md gold-glow cursor-pointer flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Blueprint</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 md:px-8 border-b border-white/10 bg-charcoal-950/40 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search blueprints by name, category, deliverable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-charcoal-800/90 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono capitalize transition-all shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-gold-500 text-charcoal-950 font-bold'
                    : 'bg-charcoal-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Packages' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blueprint Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-charcoal-950/40 rounded-3xl border border-dashed border-white/10 space-y-3">
              <Layers className="w-10 h-10 text-gray-600 mx-auto" />
              <h4 className="text-sm font-bold text-gray-300 font-mono">No matching project blueprints found</h4>
              <p className="text-xs text-gray-500 font-mono max-w-sm mx-auto">
                Try a different search query or create a new blueprint structure for your studio.
              </p>
              <button
                type="button"
                onClick={onCreateNewTemplate}
                className="mt-2 px-4 py-2 bg-gold-500 text-charcoal-950 rounded-xl text-xs font-mono font-bold inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Blueprint</span>
              </button>
            </div>
          ) : (
            filteredTemplates.map(tpl => {
              const isSelected = selectedTemplateId === tpl.id;
              const tasksCount = tpl.tasks?.length || 0;
              const milestonesCount = tpl.milestones?.length || 0;
              const deliverablesCount = tpl.deliverables?.length || 0;

              return (
                <div
                  key={tpl.id}
                  className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 relative group ${
                    isSelected
                      ? 'bg-gradient-to-br from-charcoal-900 to-gold-950/30 border-gold-500/60 shadow-xl gold-glow'
                      : 'bg-charcoal-950/80 hover:bg-charcoal-900 border-white/10 hover:border-gold-500/30'
                  }`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/25">
                            {tpl.eventType}
                          </span>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                            tpl.priority === 'urgent'
                              ? 'bg-red-500/15 text-red-300 border-red-500/30'
                              : tpl.priority === 'high'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          }`}>
                            {tpl.priority} Priority
                          </span>
                          {tpl.isDefault && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-charcoal-800 text-gray-400 border border-white/5">
                              Standard Preset
                            </span>
                          )}
                        </div>
                        <h4 className="text-base md:text-lg font-bold text-white font-display mt-1">
                          {tpl.name}
                        </h4>
                      </div>

                      {/* Top Right Action Menu */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditTemplate(tpl)}
                          title="Edit Blueprint"
                          className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!tpl.isDefault && (
                          <button
                            type="button"
                            onClick={() => onDeleteTemplate(tpl.id)}
                            title="Delete Blueprint"
                            className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {tpl.description && (
                      <p className="text-xs text-gray-400 font-mono mt-2 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  {/* Financial & Specs Metrics */}
                  <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-charcoal-900/90 rounded-2xl border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Client Value</span>
                      <strong className="text-emerald-400 font-bold block truncate">
                        {tpl.defaultProjectAmount ? `₹${tpl.defaultProjectAmount.toLocaleString('en-IN')}` : 'Variable'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Editor Wage</span>
                      <strong className="text-gold-300 font-bold block truncate">
                        {tpl.defaultEditorPayment ? `₹${tpl.defaultEditorPayment.toLocaleString('en-IN')}` : 'Variable'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Turnaround</span>
                      <strong className="text-sky-300 font-bold block truncate">
                        {tpl.defaultTurnaroundDays || 30} Days
                      </strong>
                    </div>
                  </div>

                  {/* Workflow Badges */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-gray-300">
                      <span className="px-2 py-1 bg-charcoal-800/80 rounded-lg border border-white/5 flex items-center space-x-1.5">
                        <Clock className="w-3 h-3 text-gold-400" />
                        <span><strong>{tasksCount}</strong> Auto-Tasks</span>
                      </span>
                      <span className="px-2 py-1 bg-charcoal-800/80 rounded-lg border border-white/5 flex items-center space-x-1.5">
                        <Layers className="w-3 h-3 text-gold-400" />
                        <span><strong>{milestonesCount}</strong> Milestones</span>
                      </span>
                      <span className="px-2 py-1 bg-charcoal-800/80 rounded-lg border border-white/5 flex items-center space-x-1.5">
                        <Film className="w-3 h-3 text-gold-400" />
                        <span><strong>{deliverablesCount}</strong> Deliverables</span>
                      </span>
                    </div>

                    {/* Deliverable pills preview */}
                    {tpl.deliverables && tpl.deliverables.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tpl.deliverables.slice(0, 3).map((del, dIdx) => (
                          <span key={dIdx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-charcoal-800 text-gray-400 border border-white/5 truncate max-w-[150px]">
                            {del}
                          </span>
                        ))}
                        {tpl.deliverables.length > 3 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-gold-400/80 font-bold">
                            +{tpl.deliverables.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Apply CTA */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-gray-500">
                      {tpl.isSplitProject ? '👥 2-Editor Split Workflow' : '👤 Single Editor Workflow'}
                    </span>

                    <button
                      type="button"
                      onClick={() => onApplyTemplate(tpl)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-gold-500 text-charcoal-950 gold-glow shadow-md'
                          : 'bg-gold-500/15 hover:bg-gold-500 text-gold-300 hover:text-charcoal-950 border border-gold-500/30'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied to Form</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply & Instantiate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:px-8 border-t border-white/10 bg-charcoal-950/80 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400 font-mono">
            Selecting a blueprint automatically populates tasks, deliverables, budget splits & timelines.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
          >
            Close Repository
          </button>
        </div>
      </motion.div>
    </div>
  );
}
