import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  Layers, 
  Plus, 
  Trash2, 
  Clock, 
  IndianRupee, 
  User, 
  Film, 
  CheckCircle2, 
  Sliders, 
  Sparkles, 
  AlertCircle,
  Tag,
  Check,
  Split,
  ChevronDown
} from 'lucide-react';
import { ProjectTemplate, ProjectTemplateTask, ProjectPriority, Editor } from '../types';

interface TemplateBuilderModalProps {
  initialTemplate?: ProjectTemplate | null;
  editors: Editor[];
  onSave: (template: ProjectTemplate) => Promise<void> | void;
  onClose: () => void;
}

const EVENT_TYPES = [
  'Wedding Film',
  'Pre-Wedding Film',
  'Cinematic Highlight',
  'Engagement Teaser',
  'Sangeet Cut',
  'Traditional Wedding',
  'Luxury Wedding (Split)',
  'Commercial Event',
  'Anniversary Special'
];

const PRIORITIES: { id: ProjectPriority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' }
];

const DEFAULT_DELIVERABLE_SUGGESTIONS = [
  'Full Wedding Film',
  'Cinematic Teaser (1 min)',
  'Highlight Montage (5-7 min)',
  '3x Instagram Reels (9:16)',
  '5x Instagram Reels (9:16)',
  'Sangeet Night Extended Cut',
  'Haldi & Mehendi Highlights',
  'Pre-Wedding Story Film',
  'Full Rituals Extended Cut',
  'Family Blessing Interviews',
  'Master Raw Footage Hard Disk'
];

const DEFAULT_MILESTONE_SUGGESTIONS = [
  'Footage Ingest, Proxy & Multi-cam Setup',
  'Song Selection & Audio Sync',
  'Audio Speech Enhancement & Noise Removal',
  'Sangeet & Haldi Ceremony Assembly',
  'Rough Cut / First Assembly Review',
  'Teaser & 60-Sec Highlight Trailer',
  'Main Feature Film Editing Pass',
  'Cinematic Color Grading & 4K Master Export',
  'Sound Design & Foley Balancing',
  'Final Quality Control & Cloud Link Delivery'
];

export default function TemplateBuilderModal({
  initialTemplate,
  editors,
  onSave,
  onClose
}: TemplateBuilderModalProps) {
  const isEditing = !!initialTemplate?.id;

  // Basic Details
  const [name, setName] = useState(initialTemplate?.name || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [eventType, setEventType] = useState(initialTemplate?.eventType || 'Wedding Film');
  const [priority, setPriority] = useState<ProjectPriority>(initialTemplate?.priority || 'medium');
  const [turnaroundDays, setTurnaroundDays] = useState<number>(initialTemplate?.defaultTurnaroundDays || 30);
  const [estimatedDataSize, setEstimatedDataSize] = useState(initialTemplate?.estimatedDataSize || '1.5 TB');
  const [notes, setNotes] = useState(initialTemplate?.notes || '');
  const [isDefault, setIsDefault] = useState(!!initialTemplate?.isDefault);

  // Financials
  const [projectAmount, setProjectAmount] = useState<number>(initialTemplate?.defaultProjectAmount || 100000);
  const [editorPayment, setEditorPayment] = useState<number>(initialTemplate?.defaultEditorPayment || 25000);
  const [otherExpenses, setOtherExpenses] = useState<number>(initialTemplate?.defaultOtherExpenses || 3000);
  const [advancePercentage, setAdvancePercentage] = useState<number>(initialTemplate?.defaultAdvancePercentage || 40);

  // Split Editors
  const [isSplitProject, setIsSplitProject] = useState<boolean>(!!initialTemplate?.isSplitProject);
  const [splitRatio, setSplitRatio] = useState<'50-50' | '60-40' | '70-30' | 'custom'>('60-40');
  const [firstEditorShare, setFirstEditorShare] = useState<number>(
    initialTemplate?.defaultFirstEditorShare || Math.round((initialTemplate?.defaultEditorPayment || 25000) * 0.6)
  );
  const [secondEditorShare, setSecondEditorShare] = useState<number>(
    initialTemplate?.defaultSecondEditorShare || Math.round((initialTemplate?.defaultEditorPayment || 25000) * 0.4)
  );
  const [primaryEditorId, setPrimaryEditorId] = useState(initialTemplate?.defaultPrimaryEditorId || '');
  const [secondEditorId, setSecondEditorId] = useState(initialTemplate?.defaultSecondEditorId || '');

  // Deliverables
  const [deliverables, setDeliverables] = useState<string[]>(
    initialTemplate?.deliverables && initialTemplate.deliverables.length > 0
      ? initialTemplate.deliverables
      : ['Full Wedding Film', 'Cinematic Teaser (1 min)', '3x Instagram Reels (9:16)']
  );
  const [customDeliverable, setCustomDeliverable] = useState('');

  // Milestones
  const [milestones, setMilestones] = useState<string[]>(
    initialTemplate?.milestones && initialTemplate.milestones.length > 0
      ? initialTemplate.milestones
      : [
          'Footage Ingest, Proxy & Multi-cam Setup',
          'Rough Cut / First Assembly Review',
          'Teaser & 60-Sec Highlight Trailer',
          'Cinematic Color Grading & 4K Master Export',
          'Final Quality Control & Cloud Link Delivery'
        ]
  );
  const [customMilestone, setCustomMilestone] = useState('');

  // Standard Tasks
  const [tasks, setTasks] = useState<ProjectTemplateTask[]>(
    initialTemplate?.tasks && initialTemplate.tasks.length > 0
      ? initialTemplate.tasks
      : [
          {
            id: `task-1-${Date.now()}`,
            title: 'Footage Ingestion & Multi-Cam Sync',
            description: 'Import cards, build proxies, and sync ceremonial audio.',
            daysFromShoot: 2,
            assignedRole: 'primary_editor'
          },
          {
            id: `task-2-${Date.now()}`,
            title: 'Rough Cut Assembly & Storyline Review',
            description: 'Assemble first full sequence and check narrative flow.',
            daysFromShoot: 10,
            assignedRole: 'primary_editor'
          },
          {
            id: `task-3-${Date.now()}`,
            title: 'Cinematic Color Grading & Film LUT Pass',
            description: 'Apply signature wedding LUT and balance skin tones.',
            daysFromShoot: 20,
            assignedRole: 'primary_editor'
          },
          {
            id: `task-4-${Date.now()}`,
            title: 'Master 4K Export & Cloud Upload',
            description: 'Render final master files and upload to Google Drive folder.',
            daysFromShoot: 30,
            assignedRole: 'primary_editor'
          }
        ]
  );

  // New Task Input Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDays, setNewTaskDays] = useState<number>(5);
  const [newTaskRole, setNewTaskRole] = useState<'primary_editor' | 'second_editor' | 'lead' | 'unassigned'>('primary_editor');

  const [activeTab, setActiveTab] = useState<'basics' | 'tasks' | 'financials' | 'deliverables'>('basics');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize split calculations
  const handleSplitRatioChange = (ratio: '50-50' | '60-40' | '70-30' | 'custom') => {
    setSplitRatio(ratio);
    if (ratio === '50-50') {
      const p1 = Math.round(editorPayment * 0.5);
      setFirstEditorShare(p1);
      setSecondEditorShare(editorPayment - p1);
    } else if (ratio === '60-40') {
      const p1 = Math.round(editorPayment * 0.6);
      setFirstEditorShare(p1);
      setSecondEditorShare(editorPayment - p1);
    } else if (ratio === '70-30') {
      const p1 = Math.round(editorPayment * 0.7);
      setFirstEditorShare(p1);
      setSecondEditorShare(editorPayment - p1);
    }
  };

  // Deliverables helpers
  const handleAddDeliverable = (item: string) => {
    if (item.trim() && !deliverables.includes(item.trim())) {
      setDeliverables([...deliverables, item.trim()]);
    }
    setCustomDeliverable('');
  };

  const handleRemoveDeliverable = (item: string) => {
    setDeliverables(deliverables.filter(d => d !== item));
  };

  // Milestones helpers
  const handleAddMilestone = (item: string) => {
    if (item.trim() && !milestones.includes(item.trim())) {
      setMilestones([...milestones, item.trim()]);
    }
    setCustomMilestone('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, idx) => idx !== index));
  };

  // Task helpers
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: ProjectTemplateTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      daysFromShoot: Number(newTaskDays) || 5,
      assignedRole: newTaskRole
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDays(Math.min(turnaroundDays, (Number(newTaskDays) || 5) + 5));
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Profit Margin Calculations
  const calculatedAdvanceAmt = Math.round((projectAmount * advancePercentage) / 100);
  const calculatedEstimatedProfit = projectAmount - editorPayment - otherExpenses;
  const calculatedProfitMarginPercent = projectAmount > 0 ? Math.round((calculatedEstimatedProfit / projectAmount) * 100) : 0;

  // Submit Blueprint Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Blueprint Template Name is required.');
      setActiveTab('basics');
      return;
    }

    try {
      setIsSaving(true);
      const selectedPrimaryEditor = editors.find(ed => ed.id === primaryEditorId);
      const selectedSecondEditor = editors.find(ed => ed.id === secondEditorId);

      const templateToSave: ProjectTemplate = {
        id: initialTemplate?.id || `tpl-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        eventType,
        priority,
        defaultTurnaroundDays: Number(turnaroundDays) || 30,
        estimatedDataSize: estimatedDataSize.trim() || '1.5 TB',
        deliverables,
        milestones,
        tasks,
        defaultProjectAmount: Number(projectAmount) || 0,
        defaultEditorPayment: Number(editorPayment) || 0,
        defaultOtherExpenses: Number(otherExpenses) || 0,
        defaultAdvancePercentage: Number(advancePercentage) || 40,
        isSplitProject,
        defaultFirstEditorShare: isSplitProject ? Number(firstEditorShare) : undefined,
        defaultSecondEditorShare: isSplitProject ? Number(secondEditorShare) : undefined,
        defaultPrimaryEditorId: primaryEditorId || undefined,
        defaultPrimaryEditorName: selectedPrimaryEditor ? selectedPrimaryEditor.name : undefined,
        defaultSecondEditorId: isSplitProject && secondEditorId ? secondEditorId : undefined,
        defaultSecondEditorName: isSplitProject && selectedSecondEditor ? selectedSecondEditor.name : undefined,
        notes: notes.trim() || undefined,
        isDefault,
        createdAt: initialTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(templateToSave);
      onClose();
    } catch (err: any) {
      console.error("Failed to save template:", err);
      setError(err.message || 'Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-charcoal-900 border border-gold-500/30 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:px-8 border-b border-white/10 shrink-0 bg-charcoal-950/60">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-600/20 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold gold-glow">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-400">
                  {isEditing ? 'Edit Blueprint Structure' : 'Create Project Blueprint'}
                </span>
                {isDefault && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 font-bold">
                    Default Blueprint
                  </span>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white font-display mt-0.5">
                {name || (isEditing ? 'Edit Template' : 'New Wedding Project Blueprint')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-charcoal-950/40 px-6 shrink-0 overflow-x-auto gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'basics'
                ? 'bg-gold-500 text-charcoal-950 gold-glow shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>1. General Specs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-gold-500 text-charcoal-950 gold-glow shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>2. Standard Tasks ({tasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-gold-500 text-charcoal-950 gold-glow shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>3. Budget & Editor Split</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliverables')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'deliverables'
                ? 'bg-gold-500 text-charcoal-950 gold-glow shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>4. Deliverables & Milestones</span>
          </button>
        </div>

        {/* Form Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono flex items-center space-x-3 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* TAB 1: GENERAL SPECS */}
          {activeTab === 'basics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Blueprint Name <span className="text-gold-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Royal 3-Day Wedding Suite"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-charcoal-800 border border-white/10 hover:border-gold-500/30 focus:border-gold-500 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Event Category Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-charcoal-800 border border-white/10 hover:border-gold-500/30 focus:border-gold-500 rounded-xl px-4 py-3 text-sm text-gray-200 font-mono focus:outline-none cursor-pointer"
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type} className="bg-charcoal-950">{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                  Blueprint Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the workflow purpose, client expectation, and scope of this template..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 hover:border-gold-500/30 focus:border-gold-500 rounded-xl p-4 text-xs text-white font-mono placeholder-gray-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Default Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 font-mono focus:outline-none"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id} className="bg-charcoal-950">{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Turnaround Duration (Days)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={turnaroundDays}
                      onChange={(e) => setTurnaroundDays(Number(e.target.value))}
                      className="w-full bg-charcoal-800 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                    Auto-calculates Delivery Deadline from Shoot Date.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Est. Data Footprint
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2.5 TB"
                    value={estimatedDataSize}
                    onChange={(e) => setEstimatedDataSize(e.target.value)}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Editor Assignment Presets */}
              <div className="p-5 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gold-400" />
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Default Assigned Editor(s)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    Optional: can be selected per project
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 font-mono uppercase mb-1.5">
                      Lead / Primary Editor
                    </label>
                    <select
                      value={primaryEditorId}
                      onChange={(e) => setPrimaryEditorId(e.target.value)}
                      className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                    >
                      <option value="" className="bg-charcoal-950">Assign dynamically per project</option>
                      {editors.map(ed => (
                        <option key={ed.id} value={ed.id} className="bg-charcoal-950">{ed.name}</option>
                      ))}
                    </select>
                  </div>

                  {isSplitProject && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 font-mono uppercase mb-1.5">
                        Secondary Editor (Split Project)
                      </label>
                      <select
                        value={secondEditorId}
                        onChange={(e) => setSecondEditorId(e.target.value)}
                        className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                      >
                        <option value="" className="bg-charcoal-950">Assign dynamically per project</option>
                        {editors.map(ed => (
                          <option key={ed.id} value={ed.id} className="bg-charcoal-950">{ed.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                  Special Workflow Guidelines / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Luxury 4K Master Delivery. Requires separate hard drive backup and multi-cam audio mastering."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 rounded-xl p-3.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none"
                />
              </div>

              {/* Set as Default Toggle */}
              <div className="flex items-center space-x-3 p-4 bg-charcoal-950/80 rounded-2xl border border-white/5">
                <input
                  type="checkbox"
                  id="tpl-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500 bg-charcoal-800 border-white/20 cursor-pointer"
                />
                <label htmlFor="tpl-default" className="text-xs font-mono text-gray-300 cursor-pointer">
                  Pin this blueprint as standard studio template
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: STANDARD TASKS WORKFLOW */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-charcoal-950/80 rounded-2xl border border-gold-500/20">
                <div>
                  <h4 className="text-xs font-bold text-gold-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gold-400" />
                    <span>Standard Workflow Task Sequence ({tasks.length})</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    When you instantiate a project from this blueprint, these tasks are automatically created in Firestore with due dates calculated from the Shoot Date!
                  </p>
                </div>
              </div>

              {/* Task Creation Form */}
              <div className="p-5 bg-charcoal-950/90 rounded-2xl border border-white/10 space-y-4">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider block">
                  + Add Standard Milestone Task
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Task Title (e.g. Ingestion, Audio Cleaning, Teaser Cut)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={180}
                        placeholder="+ Days"
                        value={newTaskDays}
                        onChange={(e) => setNewTaskDays(Number(e.target.value))}
                        className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-gray-500 font-mono">
                        days after shoot
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={newTaskRole}
                      onChange={(e) => setNewTaskRole(e.target.value as any)}
                      className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                    >
                      <option value="primary_editor" className="bg-charcoal-950">Primary Editor</option>
                      <option value="second_editor" className="bg-charcoal-950">Second Editor</option>
                      <option value="lead" className="bg-charcoal-950">Lead Colorist / Supervisor</option>
                      <option value="unassigned" className="bg-charcoal-950">Unassigned</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Task details or specific guidelines (optional)..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="flex-1 bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold rounded-xl text-xs font-mono shadow-md gold-glow cursor-pointer flex items-center space-x-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-2.5">
                {tasks.length === 0 ? (
                  <div className="p-8 text-center bg-charcoal-950/40 rounded-2xl border border-dashed border-white/10">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-mono">No standard tasks defined for this blueprint yet.</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-1">Add tasks above to automate workflow task creation on project onboarding.</p>
                  </div>
                ) : (
                  tasks.map((task, idx) => (
                    <div
                      key={task.id || idx}
                      className="p-4 bg-charcoal-950/80 rounded-2xl border border-white/10 hover:border-gold-500/30 flex items-start justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-gold-500/15 border border-gold-500/30 text-gold-300 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-xs font-bold text-white font-mono truncate">{task.title}</h5>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                              +{task.daysFromShoot ?? 5}d from shoot
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-charcoal-800 text-gray-300 border border-white/10">
                              {task.assignedRole === 'primary_editor' ? 'Primary Editor' : task.assignedRole === 'second_editor' ? 'Second Editor' : 'Lead'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        className="p-2 rounded-xl bg-charcoal-900 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BUDGET & FINANCIAL SPLIT */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="p-4 bg-charcoal-950/80 rounded-2xl border border-gold-500/20">
                <h4 className="text-xs font-bold text-gold-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-gold-400" />
                  <span>Default Project Revenue & Editor Compensation Split</span>
                </h4>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Set the standard pricing tier for this wedding package. When applied in RegistryView, amounts and editor wage shares auto-populate.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Default Client Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={projectAmount}
                    onChange={(e) => setProjectAmount(Number(e.target.value))}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Editor Wage Pool (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={editorPayment}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditorPayment(val);
                      if (isSplitProject) {
                        const p1 = Math.round(val * 0.6);
                        setFirstEditorShare(p1);
                        setSecondEditorShare(val - p1);
                      }
                    }}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/50 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider mb-2">
                    Other Expenses (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={otherExpenses}
                    onChange={(e) => setOtherExpenses(Number(e.target.value))}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Advance & Profit Margin Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-bold">
                    Advance Payment Ratio
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={advancePercentage}
                      onChange={(e) => setAdvancePercentage(Number(e.target.value))}
                      className="w-16 bg-charcoal-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-gold-300 font-mono text-center font-bold"
                    />
                    <span className="text-xs text-gray-400 font-mono">% (₹{calculatedAdvanceAmt.toLocaleString('en-IN')})</span>
                  </div>
                </div>

                <div className="p-4 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-bold">
                    Est. Studio Net Profit
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-400 block">
                    ₹{calculatedEstimatedProfit.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-4 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-bold">
                    Profit Margin %
                  </span>
                  <span className="text-base font-bold font-mono text-gold-300 block">
                    {calculatedProfitMarginPercent}%
                  </span>
                </div>
              </div>

              {/* Split Project Option */}
              <div className="p-5 bg-charcoal-950/80 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="split-toggle"
                      checked={isSplitProject}
                      onChange={(e) => setIsSplitProject(e.target.checked)}
                      className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500 bg-charcoal-800 border-white/20 cursor-pointer"
                    />
                    <label htmlFor="split-toggle" className="text-xs font-bold text-white font-mono uppercase tracking-wider cursor-pointer">
                      Split Project Blueprint (2 Collaborative Editors)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-gold-400 px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20">
                    Dual Editor Model
                  </span>
                </div>

                {isSplitProject && (
                  <div className="pt-3 border-t border-white/5 space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 font-mono">Split Ratio Preset:</span>
                      {(['50-50', '60-40', '70-30'] as const).map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSplitRatioChange(preset)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                            splitRatio === preset
                              ? 'bg-gold-500 text-charcoal-950'
                              : 'bg-charcoal-800 text-gray-300 hover:bg-charcoal-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 font-mono uppercase mb-1">
                          Lead Editor Share (₹)
                        </label>
                        <input
                          type="number"
                          value={firstEditorShare}
                          onChange={(e) => setFirstEditorShare(Number(e.target.value))}
                          className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 font-mono uppercase mb-1">
                          Second Editor Share (₹)
                        </label>
                        <input
                          type="number"
                          value={secondEditorShare}
                          onChange={(e) => setSecondEditorShare(Number(e.target.value))}
                          className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DELIVERABLES & MILESTONES */}
          {activeTab === 'deliverables' && (
            <div className="space-y-8">
              {/* Deliverables Package */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gold-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gold-400" />
                    <span>Included Deliverables ({deliverables.length})</span>
                  </h4>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom deliverable (e.g. 10x Reels, Haldi Highlight)..."
                    value={customDeliverable}
                    onChange={(e) => setCustomDeliverable(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDeliverable(customDeliverable);
                      }
                    }}
                    className="flex-1 bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDeliverable(customDeliverable)}
                    className="px-4 py-2.5 bg-charcoal-800 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 rounded-xl text-xs font-mono font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {/* Selected Deliverables */}
                <div className="flex flex-wrap gap-2 p-4 bg-charcoal-950/80 rounded-2xl border border-white/10 min-h-[60px]">
                  {deliverables.map((del, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-charcoal-900 border border-gold-500/25 rounded-xl text-xs font-mono text-gold-200 flex items-center space-x-2"
                    >
                      <Check className="w-3.5 h-3.5 text-gold-400" />
                      <span>{del}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(del)}
                        className="hover:text-red-400 cursor-pointer ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Suggestions Pills */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-gray-400">Quick Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_DELIVERABLE_SUGGESTIONS.map((sug, idx) => {
                      const isAdded = deliverables.includes(sug);
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddDeliverable(sug)}
                          className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-charcoal-900/40 text-gray-600 border-white/5 cursor-not-allowed'
                              : 'bg-charcoal-800/80 hover:bg-charcoal-700 text-gray-300 border-white/10 hover:text-white'
                          }`}
                        >
                          + {sug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-gold-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-gold-400" />
                  <span>Production Milestone Stages ({milestones.length})</span>
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add workflow milestone stage..."
                    value={customMilestone}
                    onChange={(e) => setCustomMilestone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMilestone(customMilestone);
                      }
                    }}
                    className="flex-1 bg-charcoal-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddMilestone(customMilestone)}
                    className="px-4 py-2.5 bg-charcoal-800 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 rounded-xl text-xs font-mono font-bold cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2 p-4 bg-charcoal-950/80 rounded-2xl border border-white/10">
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-charcoal-900 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs font-mono text-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded bg-charcoal-800 text-gold-400 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{m}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 md:px-8 border-t border-white/10 shrink-0 bg-charcoal-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold rounded-xl text-xs font-mono shadow-lg gold-glow cursor-pointer transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Blueprint...' : (isEditing ? 'Update Blueprint' : 'Save Blueprint Template')}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
