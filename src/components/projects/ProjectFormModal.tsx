import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Upload, 
  Calendar, 
  Building2, 
  User, 
  IndianRupee, 
  HardDrive, 
  Sparkles, 
  AlertCircle, 
  Flame, 
  Film,
  Tag as TagIcon,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { Project, Studio, Editor, ProjectStatus, ProjectPriority, UserRole } from '../../types';
import { PREDEFINED_PROJECT_TAGS } from '../../projectTags';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingProject: Project | null;
  studios: Studio[];
  editors: Editor[];
  userRole: UserRole;
  currentStudioId?: string;
}

const DEFAULT_COVERS = [
  { name: 'Sunset Romance', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600' },
  { name: 'Golden Hour', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600' },
  { name: 'Palace Celebration', url: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Classic Portrait', url: 'https://images.unsplash.com/photo-1507504038482-7621c330dfcf?auto=format&fit=crop&q=80&w=600' }
];

const STANDARD_DELIVERABLES = [
  'Cinematic Teaser (1-3 min)',
  'Wedding Highlights (4-7 min)',
  'Full Traditional Film (45-90 min)',
  'Instagram Vertical Reels (9:16)',
  'Pre-Wedding Concept Film',
  'Sangeet / Reception Special Cut',
  'Raw 4K Footage Backup'
];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProject,
  studios,
  editors,
  userRole,
  currentStudioId
}) => {
  const [projectName, setProjectName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [couplePhoto, setCouplePhoto] = useState('');
  const [eventType, setEventType] = useState('Wedding Film');
  const [studioId, setStudioId] = useState('');
  const [assignedEditorId, setAssignedEditorId] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('data_received');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [projectAmount, setProjectAmount] = useState<number | ''>('');
  const [advancePayment, setAdvancePayment] = useState<number | ''>('');
  const [editorPayment, setEditorPayment] = useState<number | ''>('');
  const [hardDriveNumber, setHardDriveNumber] = useState('');
  const [backupDriveNumber, setBackupDriveNumber] = useState('');
  const [cloudDriveLink, setCloudDriveLink] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([STANDARD_DELIVERABLES[0], STANDARD_DELIVERABLES[1]]);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split project states
  const [isSplitProject, setIsSplitProject] = useState(false);
  const [secondEditorId, setSecondEditorId] = useState('');
  const [firstEditorShare, setFirstEditorShare] = useState<number | ''>('');
  const [secondEditorShare, setSecondEditorShare] = useState<number | ''>('');

  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.projectName || '');
      const parts = (editingProject.coupleName || '').split('&').map(s => s.trim());
      setGroomName(parts[0] || '');
      setBrideName(parts[1] || '');
      setCouplePhoto(editingProject.couplePhoto || '');
      setEventType(editingProject.eventType || 'Wedding Film');
      setStudioId(editingProject.studioId || '');
      setAssignedEditorId(editingProject.assignedEditorId || '');
      setShootDate(editingProject.shootDate || '');
      setDeliveryDate(editingProject.deliveryDate || '');
      setStatus(editingProject.status || 'data_received');
      setPriority(editingProject.priority || 'medium');
      setProjectAmount(editingProject.projectAmount ?? '');
      setAdvancePayment(editingProject.advancePayment ?? '');
      setEditorPayment(editingProject.editorPayment ?? '');
      setHardDriveNumber(editingProject.hardDriveNumber || '');
      setBackupDriveNumber(editingProject.backupDriveNumber || '');
      setCloudDriveLink(editingProject.cloudDriveLink || '');
      setNotes(editingProject.notes || '');
      setSelectedTags(editingProject.tags || []);
      setSelectedDeliverables(editingProject.selectedFunctions || [STANDARD_DELIVERABLES[0], STANDARD_DELIVERABLES[1]]);
      setIsSplitProject(!!editingProject.isSplitProject);
      setSecondEditorId(editingProject.secondEditorId || '');
      setFirstEditorShare(editingProject.firstEditorShare ?? '');
      setSecondEditorShare(editingProject.secondEditorShare ?? '');
    } else {
      setProjectName('');
      setGroomName('');
      setBrideName('');
      setCouplePhoto(DEFAULT_COVERS[0].url);
      setEventType('Wedding Film');
      setStudioId(currentStudioId || (studios[0]?.id || ''));
      setAssignedEditorId(editors[0]?.id || '');
      const todayStr = new Date().toISOString().split('T')[0];
      setShootDate(todayStr);
      const deliveryDefault = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
      setDeliveryDate(deliveryDefault);
      setStatus('data_received');
      setPriority('medium');
      setProjectAmount(45000);
      setAdvancePayment(15000);
      setEditorPayment(12000);
      setHardDriveNumber('HDD-01');
      setBackupDriveNumber('BACKUP-01');
      setCloudDriveLink('');
      setNotes('');
      setSelectedTags(['teaser', '4k_master']);
      setSelectedDeliverables([STANDARD_DELIVERABLES[0], STANDARD_DELIVERABLES[1]]);
      setIsSplitProject(false);
      setSecondEditorId('');
      setFirstEditorShare('');
      setSecondEditorShare('');
    }
    setValidationError('');
  }, [editingProject, isOpen, studios, editors, currentStudioId]);

  if (!isOpen) return null;

  const handlePresetDeadline = (days: number) => {
    const base = shootDate ? new Date(shootDate) : new Date();
    const target = new Date(base.getTime() + days * 24 * 3600 * 1000);
    setDeliveryDate(target.toISOString().split('T')[0]);
  };

  const handleToggleDeliverable = (item: string) => {
    if (selectedDeliverables.includes(item)) {
      setSelectedDeliverables(selectedDeliverables.filter(d => d !== item));
    } else {
      setSelectedDeliverables([...selectedDeliverables, item]);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setValidationError('Please specify a Project Name.');
      return;
    }
    if (!groomName.trim() && !brideName.trim()) {
      setValidationError('Please specify at least Groom or Bride name.');
      return;
    }
    if (!studioId) {
      setValidationError('Please select a Studio Partner.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedStudio = studios.find(s => s.id === studioId);
      const selectedLeadEditor = editors.find(e => e.id === assignedEditorId);
      const selectedSecondEditor = editors.find(e => e.id === secondEditorId);
      const coupleFormatted = `${groomName.trim() || 'Groom'} & ${brideName.trim() || 'Bride'}`;

      const amountNum = Number(projectAmount) || 0;
      const advanceNum = Number(advancePayment) || 0;
      const editorPayNum = Number(editorPayment) || 0;

      const dataToSave: Omit<Project, 'createdAt' | 'updatedAt'> = {
        id: editingProject ? editingProject.id : `PRJ-${Date.now().toString().slice(-4)}`,
        projectName: projectName.trim(),
        coupleName: coupleFormatted,
        groomName: groomName.trim(),
        brideName: brideName.trim(),
        couplePhoto: couplePhoto || DEFAULT_COVERS[0].url,
        eventType,
        studioId,
        studioName: selectedStudio?.name || 'Partner Studio',
        assignedEditorId,
        assignedEditorName: selectedLeadEditor?.name || 'Unassigned',
        shootDate,
        deliveryDate,
        status,
        priority,
        projectAmount: amountNum,
        advancePayment: advanceNum,
        editorPayment: editorPayNum,
        otherExpenses: editingProject?.otherExpenses || 0,
        remainingBalance: Math.max(0, amountNum - advanceNum),
        hardDriveNumber,
        backupDriveNumber,
        cloudDriveLink,
        notes,
        tags: selectedTags,
        selectedFunctions: selectedDeliverables,
        isSplitProject,
        secondEditorId: isSplitProject ? secondEditorId : undefined,
        secondEditorName: isSplitProject ? selectedSecondEditor?.name : undefined,
        firstEditorShare: isSplitProject ? Number(firstEditorShare) || 0 : undefined,
        secondEditorShare: isSplitProject ? Number(secondEditorShare) || 0 : undefined,
      };

      await onSave(dataToSave);
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      setValidationError('Failed to save project. Please check fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block w-full max-w-6xl overflow-hidden rounded-3xl bg-charcoal-950 border border-gold-500/30 shadow-2xl relative z-10 flex flex-col lg:flex-row h-auto max-h-[92vh]"
        >
          {/* LEFT PANE: LIVE CINE-CARD PREVIEW */}
          <div className="w-full lg:w-2/5 bg-gradient-to-b from-charcoal-900 to-charcoal-950 border-r border-luxury-green-800/20 p-6 flex flex-col justify-between select-none relative overflow-hidden">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full uppercase border border-gold-500/20">
                Live Spec Preview
              </span>
              <h3 className="text-xs text-gray-400 font-mono mt-3 uppercase tracking-wider">
                How this film appears in the directory:
              </h3>
            </div>

            {/* Live Card Mockup */}
            <div className="my-6 p-1 bg-charcoal-950 rounded-3xl border border-gold-500/30 shadow-2xl max-w-xs mx-auto w-full">
              <div className="h-44 rounded-2xl overflow-hidden relative">
                <img
                  src={couplePhoto || DEFAULT_COVERS[0].url}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent" />
                
                <div className="absolute top-3 left-3 flex gap-1">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-charcoal-950/90 text-gold-400 rounded-md border border-gold-500/30">
                    {editingProject ? editingProject.id : 'PRJ-AUTO'}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-charcoal-950/90 text-amber-300 rounded-md uppercase">
                    {priority}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-500/90 text-charcoal-950 rounded uppercase">
                    {status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-white truncate font-display">
                    {projectName || 'Wedding Film Title'}
                  </h4>
                  <p className="text-[10px] text-gold-400 font-mono">
                    {groomName || brideName ? `${groomName || 'Groom'} & ${brideName || 'Bride'}` : 'Groom & Bride'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono">
                  <div>
                    <span className="text-gray-500 block">Studio</span>
                    <span className="text-gray-200 font-bold truncate block">
                      {studios.find(s => s.id === studioId)?.name || 'Direct Client'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Editor</span>
                    <span className="text-gray-200 font-bold truncate block">
                      {editors.find(e => e.id === assignedEditorId)?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-2 flex justify-between text-[10px] font-mono text-gray-400">
                  <span>Due: {deliveryDate || 'N/A'}</span>
                  <span>{selectedDeliverables.length} Items</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-charcoal-900/60 border border-white/5 text-[11px] text-gray-400 font-mono flex items-start gap-2">
              <Info className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <span>Choose royal photo presets or upload customer portrait images directly.</span>
            </div>
          </div>

          {/* RIGHT PANE: FORM SECTIONS */}
          <div className="w-full lg:w-3/5 p-6 flex flex-col justify-between bg-charcoal-900">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold font-display text-white">
                    {editingProject ? 'Edit Cinematic Project Specs' : 'New Wedding Registry Project'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Configure creative deliverables, team assignments, & financials.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-charcoal-950 text-gray-400 hover:text-white border border-white/5 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Scrollable Form Body */}
              <form onSubmit={handleSubmit} className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                
                {/* 1. Project Name & Couple Names */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-3">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    1. Project Name & Couple Names <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rohan & Riya Royal Destination Wedding"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Groom Name (e.g. Rohan)"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
                    />
                    <input
                      type="text"
                      placeholder="Bride Name (e.g. Riya)"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
                    />
                  </div>
                </div>

                {/* 2. Cover Photo Preset Selection */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-2">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    2. Cover Photo Presets & URL
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DEFAULT_COVERS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setCouplePhoto(preset.url)}
                        className={`h-12 rounded-xl overflow-hidden relative cursor-pointer transition-all ${
                          couplePhoto === preset.url ? 'ring-2 ring-gold-400' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] text-white font-bold">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste direct image URL..."
                    value={couplePhoto}
                    onChange={(e) => setCouplePhoto(e.target.value)}
                    className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
                  />
                </div>

                {/* 3. Studio Partner & Lead Editor Assignment */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-3">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    3. Studio Partner & Editor Team <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Studio Partner</span>
                      <select
                        value={studioId}
                        onChange={(e) => setStudioId(e.target.value)}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/40 cursor-pointer"
                      >
                        {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Lead Editor</span>
                      <select
                        value={assignedEditorId}
                        onChange={(e) => setAssignedEditorId(e.target.value)}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/40 cursor-pointer"
                      >
                        {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name} ({ed.role})</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Split Project Toggle */}
                  <div className="pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-gray-300">
                      <input
                        type="checkbox"
                        checked={isSplitProject}
                        onChange={(e) => setIsSplitProject(e.target.checked)}
                        className="rounded border-white/20 bg-charcoal-900 text-gold-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Enable Split Project (2 Editors Sharing)</span>
                    </label>

                    {isSplitProject && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
                        <select
                          value={secondEditorId}
                          onChange={(e) => setSecondEditorId(e.target.value)}
                          className="bg-charcoal-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="">Select 2nd Editor</option>
                          {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Lead Share ₹"
                          value={firstEditorShare}
                          onChange={(e) => setFirstEditorShare(Number(e.target.value))}
                          className="bg-charcoal-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="2nd Share ₹"
                          value={secondEditorShare}
                          onChange={(e) => setSecondEditorShare(Number(e.target.value))}
                          className="bg-charcoal-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Dates, Status & Priority */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-3">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    4. Dates, Workflow Stage & Priority
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Shoot Date</span>
                      <input
                        type="date"
                        value={shootDate}
                        onChange={(e) => setShootDate(e.target.value)}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Deadline</span>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Stage</span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="data_received">Data Received</option>
                        <option value="assigned">Assigned</option>
                        <option value="editing">Editing</option>
                        <option value="review">Review</option>
                        <option value="revision">Revision</option>
                        <option value="rendering">Rendering</option>
                        <option value="delivered">Delivered</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Priority</span>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="low">🌱 Low</option>
                        <option value="medium">⚡ Medium</option>
                        <option value="high">🔥 High</option>
                        <option value="urgent">🚨 Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Deadline Quick Presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-mono text-gray-500">Preset Deadline:</span>
                    {[7, 15, 30, 45].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handlePresetDeadline(days)}
                        className="px-2 py-0.5 rounded bg-charcoal-900 hover:bg-gold-500/20 text-gold-400 border border-white/10 text-[10px] font-mono transition-colors cursor-pointer"
                      >
                        +{days}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Deliverables Checklist */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-2">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    5. Deliverables Checklist
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STANDARD_DELIVERABLES.map((item) => (
                      <label key={item} className="flex items-center gap-2 text-xs font-mono text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDeliverables.includes(item)}
                          onChange={() => handleToggleDeliverable(item)}
                          className="rounded border-white/20 bg-charcoal-900 text-gold-500 focus:ring-0 cursor-pointer"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 6. Financials */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-3">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    6. Financial Contract & Compensation (₹)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Contract Amount</span>
                      <input
                        type="number"
                        placeholder="₹ 50,000"
                        value={projectAmount}
                        onChange={(e) => setProjectAmount(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Advance Received</span>
                      <input
                        type="number"
                        placeholder="₹ 15,000"
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-emerald-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Editor Fee</span>
                      <input
                        type="number"
                        placeholder="₹ 12,000"
                        value={editorPayment}
                        onChange={(e) => setEditorPayment(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gold-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Storage Drives */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-3">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    7. Storage Hard Drives & Cloud Links
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Primary Hard Drive (e.g. HDD-04)"
                      value={hardDriveNumber}
                      onChange={(e) => setHardDriveNumber(e.target.value)}
                      className="bg-charcoal-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Backup Hard Drive (e.g. BACKUP-02)"
                      value={backupDriveNumber}
                      onChange={(e) => setBackupDriveNumber(e.target.value)}
                      className="bg-charcoal-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Cloud Drive URL (Google Drive / Dropbox / Frame.io)..."
                    value={cloudDriveLink}
                    onChange={(e) => setCloudDriveLink(e.target.value)}
                    className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                {/* 8. Production Notes */}
                <div className="p-4 bg-charcoal-950/60 rounded-2xl border border-white/5 space-y-2">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    8. Creative Instructions & Client Log
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter editing notes, songs preferences, or client requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-charcoal-900 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>

              </form>
            </div>

            {/* Footer Form Controls */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-charcoal-950 text-gray-400 hover:text-white text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-charcoal-950 text-xs font-bold font-display tracking-wider flex items-center gap-1.5 shadow-lg shadow-gold-500/20 transition-all cursor-pointer disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : editingProject ? 'Save Project Specs' : 'Create Wedding Registry'}</span>
              </button>
            </div>

          </div>

        </motion.div>
      </div>
    </div>
  );
};
