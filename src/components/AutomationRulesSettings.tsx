import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Check, 
  RotateCcw, 
  FolderOpen, 
  ArrowRight, 
  Bell, 
  Sliders, 
  Play, 
  AlertCircle,
  HelpCircle,
  FileText,
  Clock,
  Cloud,
  Loader2,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project, ProjectStatus, CustomAutomationRule } from '../types';
import { 
  getAutomationSettings, 
  saveAutomationSettings, 
  DEFAULT_CUSTOM_STATUS_RULES, 
  runStudioAutomationSuite 
} from '../services/automationEngine';

interface AutomationRulesSettingsProps {
  projects: Project[];
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
}

export const WORKFLOW_STATUS_OPTIONS: { id: ProjectStatus; label: string; color: string; bg: string }[] = [
  { id: 'data_received', label: 'Data Received', color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-400/30' },
  { id: 'assigned', label: 'Assigned', color: 'text-indigo-300', bg: 'bg-indigo-500/20 border-indigo-400/30' },
  { id: 'editing', label: 'Editing', color: 'text-amber-300', bg: 'bg-amber-500/25 border-amber-400/40' },
  { id: 'review', label: 'Review (Ready for Review)', color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-400/30' },
  { id: 'revision', label: 'Revision', color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-400/40' },
  { id: 'rendering', label: 'Rendering', color: 'text-teal-300', bg: 'bg-teal-500/20 border-teal-400/30' },
  { id: 'delivered', label: 'Delivered', color: 'text-emerald-300', bg: 'bg-emerald-500/25 border-emerald-400/40' },
  { id: 'closed', label: 'Closed', color: 'text-slate-300', bg: 'bg-slate-800/80 border-slate-700' }
];

export const FOLDER_FIELD_OPTIONS = [
  { id: 'any_delivery_path', label: 'Any File Folder / Cloud Path (Delivery Folder, Final Export, Drive Link)' },
  { id: 'finalExportFolder', label: 'finalExportFolder (Final Render Export Path)' },
  { id: 'deliveryFolder', label: 'deliveryFolder (Deliverables Directory)' },
  { id: 'rawDataFolder', label: 'rawDataFolder (Raw Footage Ingest Directory)' },
  { id: 'googleDriveLink', label: 'googleDriveLink (Google Drive / Cloud Share URL)' },
  { id: 'cloudDriveLink', label: 'cloudDriveLink (OneDrive / Dropbox / Cloud Storage)' }
];

export default function AutomationRulesSettings({ projects, onUpdateProject }: AutomationRulesSettingsProps) {
  const [rules, setRules] = useState<CustomAutomationRule[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);

  // Modal State for Rule Creation & Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form Fields - Specifically featuring "If file path contains [TEXT], set status to [STATUS]"
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleFolderField, setRuleFolderField] = useState<CustomAutomationRule['folderField']>('any_delivery_path');
  const [ruleKeywordTrigger, setRuleKeywordTrigger] = useState('');
  const [ruleTargetStatus, setRuleTargetStatus] = useState<ProjectStatus>('review');
  const [ruleAutoNotify, setRuleAutoNotify] = useState(true);
  const [isSavingRule, setIsSavingRule] = useState(false);

  // Execution & Action Feedback
  const [isRunningEvaluation, setIsRunningEvaluation] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Subscribe to 'automation_rules' collection in Firestore
  useEffect(() => {
    const rulesCollectionRef = collection(db, 'automation_rules');

    const unsubscribe = onSnapshot(rulesCollectionRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreRules: CustomAutomationRule[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreRules.push({
            id: docSnap.id,
            name: data.name || 'Status Rule',
            description: data.description || '',
            triggerEvent: data.triggerEvent || 'folder_path_added',
            folderField: data.folderField || 'any_delivery_path',
            keywordTrigger: data.keywordTrigger || data.pathMatchPattern || '',
            pathMatchPattern: data.keywordTrigger || data.pathMatchPattern || '',
            targetStatus: (data.targetStatus as ProjectStatus) || 'review',
            enabled: data.enabled !== false,
            autoNotify: data.autoNotify !== false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });

        setRules(firestoreRules);
        setIsLoadingFirestore(false);

        // Sync to local settings cache for offline execution
        const curSettings = getAutomationSettings();
        saveAutomationSettings({
          ...curSettings,
          customStatusRules: firestoreRules
        });
      } else {
        // If collection is empty, seed with initial defaults to Firestore
        seedDefaultRulesToFirestore();
      }
    }, (err) => {
      console.warn("Could not read 'automation_rules' from Firestore, falling back to local storage:", err);
      const fallback = getAutomationSettings().customStatusRules || DEFAULT_CUSTOM_STATUS_RULES;
      setRules(fallback);
      setIsLoadingFirestore(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to seed initial default rules into Firestore 'automation_rules' collection
  const seedDefaultRulesToFirestore = async () => {
    try {
      const defaultPresets: CustomAutomationRule[] = [
        {
          id: 'rule-export-ready-review',
          name: 'Move to Ready for Review when Export Path contains "Review" or "Export"',
          description: 'Automatically shifts project to "Review" when an editor or studio provides a path containing "Review", "Export", or any final render path.',
          triggerEvent: 'folder_path_added',
          folderField: 'any_delivery_path',
          keywordTrigger: 'Review',
          pathMatchPattern: 'Review',
          targetStatus: 'review',
          enabled: true,
          autoNotify: true
        },
        {
          id: 'rule-deliverables-delivered',
          name: 'Move to Delivered when File Path contains "Delivered" or "Final"',
          description: 'Automatically advances project to "Delivered" when a delivery folder with "Delivered" or "Final" is designated.',
          triggerEvent: 'folder_path_added',
          folderField: 'deliveryFolder',
          keywordTrigger: 'Final',
          pathMatchPattern: 'Final',
          targetStatus: 'delivered',
          enabled: true,
          autoNotify: true
        },
        {
          id: 'rule-raw-data-received',
          name: 'Move to Data Received when Raw Footage Path is Added',
          description: 'Automatically marks status as "Data Received" as soon as raw footage ingest directory is specified.',
          triggerEvent: 'folder_path_added',
          folderField: 'rawDataFolder',
          keywordTrigger: '',
          pathMatchPattern: '',
          targetStatus: 'data_received',
          enabled: true,
          autoNotify: false
        }
      ];

      for (const rule of defaultPresets) {
        await setDoc(doc(db, 'automation_rules', rule.id), {
          ...rule,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      setRules(defaultPresets);
      setIsLoadingFirestore(false);
    } catch (err) {
      console.warn("Seeding default rules to Firestore failed:", err);
      setRules(DEFAULT_CUSTOM_STATUS_RULES);
      setIsLoadingFirestore(false);
    }
  };

  // Toggle rule enabled/disabled directly in Firestore
  const handleToggleRule = async (rule: CustomAutomationRule) => {
    try {
      const ruleRef = doc(db, 'automation_rules', rule.id);
      await setDoc(ruleRef, {
        enabled: !rule.enabled,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Local update
      const updated = rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r);
      setRules(updated);
      const curSettings = getAutomationSettings();
      saveAutomationSettings({ ...curSettings, customStatusRules: updated });

      setActionNotice({ 
        message: `Rule "${rule.name}" is now ${!rule.enabled ? 'Enabled' : 'Disabled'}.`, 
        type: 'info' 
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice({ message: `Failed to update rule status: ${err.message}`, type: 'error' });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Delete a rule from Firestore
  const handleDeleteRule = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'automation_rules', id));
      const updated = rules.filter(r => r.id !== id);
      setRules(updated);
      const curSettings = getAutomationSettings();
      saveAutomationSettings({ ...curSettings, customStatusRules: updated });

      setActionNotice({ message: `Rule "${name}" deleted from Firestore.`, type: 'info' });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice({ message: `Failed to delete rule: ${err.message}`, type: 'error' });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingRuleId(null);
    setRuleName('Move to Ready for Review when file path contains "Review"');
    setRuleDescription('If file folder path contains "Review", advance project status to Ready for Review');
    setRuleFolderField('any_delivery_path');
    setRuleKeywordTrigger('Review');
    setRuleTargetStatus('review');
    setRuleAutoNotify(true);
    setIsModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (rule: CustomAutomationRule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleDescription(rule.description || '');
    setRuleFolderField(rule.folderField || 'any_delivery_path');
    setRuleKeywordTrigger(rule.keywordTrigger || rule.pathMatchPattern || '');
    setRuleTargetStatus(rule.targetStatus);
    setRuleAutoNotify(rule.autoNotify);
    setIsModalOpen(true);
  };

  // Submit Rule to Firestore 'automation_rules' collection
  const handleSaveRuleToFirestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    setIsSavingRule(true);
    try {
      const ruleId = editingRuleId || `rule-${Date.now()}`;
      const docRef = doc(db, 'automation_rules', ruleId);

      const ruleData: CustomAutomationRule = {
        id: ruleId,
        name: ruleName.trim(),
        description: ruleDescription.trim() || `If file path contains "${ruleKeywordTrigger}", set status to "${ruleTargetStatus}"`,
        triggerEvent: 'folder_path_added',
        folderField: ruleFolderField,
        keywordTrigger: ruleKeywordTrigger.trim(),
        pathMatchPattern: ruleKeywordTrigger.trim(),
        targetStatus: ruleTargetStatus,
        enabled: true,
        autoNotify: ruleAutoNotify
      };

      await setDoc(docRef, {
        ...ruleData,
        updatedAt: serverTimestamp(),
        createdAt: editingRuleId ? undefined : serverTimestamp()
      }, { merge: true });

      // Local state update
      const existingIdx = rules.findIndex(r => r.id === ruleId);
      let nextRules: CustomAutomationRule[];
      if (existingIdx >= 0) {
        nextRules = rules.map(r => r.id === ruleId ? ruleData : r);
      } else {
        nextRules = [...rules, ruleData];
      }
      setRules(nextRules);
      const curSettings = getAutomationSettings();
      saveAutomationSettings({ ...curSettings, customStatusRules: nextRules });

      setActionNotice({ 
        message: `Automation rule saved to Firestore collection 'automation_rules'!`, 
        type: 'success' 
      });
      setTimeout(() => setActionNotice(null), 4000);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error saving rule to Firestore:", err);
      setActionNotice({ message: `Error saving rule: ${err.message}`, type: 'error' });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setIsSavingRule(false);
    }
  };

  // Run Rules Now across all projects
  const handleRunRulesNow = async () => {
    setIsRunningEvaluation(true);
    setActionNotice({ message: 'Evaluating active keyword and folder rules against all projects...', type: 'info' });
    try {
      const report = await runStudioAutomationSuite([], []);
      const advanced = report.details.filter(d => d.includes('Auto-advanced')).length;
      setActionNotice({
        message: advanced > 0 
          ? `Evaluation complete! Advanced ${advanced} project(s) based on matching file path keywords.`
          : 'Evaluation complete. All project statuses currently align with rules.',
        type: 'success'
      });
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err: any) {
      setActionNotice({ message: `Execution failed: ${err.message}`, type: 'error' });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setIsRunningEvaluation(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-charcoal-900 border border-amber-500/30 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background visual atmosphere */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-bold font-display text-white tracking-tight">
                Automation Rules & Keyword Triggers
              </h3>
              <span className="px-2.5 py-0.5 text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1">
                <Cloud className="w-2.5 h-2.5" />
                <span>Firestore: automation_rules</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Define keyword triggers to automatically advance project lifecycle statuses—for example: <span className="text-amber-300 font-mono">If file path contains [TEXT], set status to [STATUS]</span> (such as advancing to <span className="text-purple-300 font-mono">ready_for_review</span> when folder contains <span className="text-gold-400 font-mono">"Review"</span>).
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleRunRulesNow}
            disabled={isRunningEvaluation}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningEvaluation ? 'animate-spin' : ''}`} />
            <span>{isRunningEvaluation ? 'Evaluating...' : 'Run Rules Now'}</span>
          </button>

          <button
            type="button"
            onClick={seedDefaultRulesToFirestore}
            className="px-3.5 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Reset to factory preset rules in Firestore"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Presets</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Keyword Rule</span>
          </button>
        </div>
      </div>

      {/* Interactive Keyword Trigger Quick Configurator Card */}
      <div className="p-4.5 rounded-2xl bg-gradient-to-r from-charcoal-950 via-charcoal-950 to-luxury-green-950/30 border border-amber-500/20 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
          <Tag className="w-3.5 h-3.5" />
          <span>Quick Rule Formula: If file path contains [TEXT] ➔ set status to [STATUS]</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-charcoal-900/80 border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-mono block">Condition Trigger</span>
            <span className="text-white font-mono text-xs font-bold mt-1 block">
              File / Cloud Folder Path Added
            </span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Monitors deliveryFolder, finalExportFolder, etc.</span>
          </div>

          <div className="p-3 rounded-xl bg-charcoal-900/80 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 uppercase font-mono block">Keyword Match [TEXT]</span>
            <span className="text-amber-200 font-mono text-xs font-bold mt-1 block">
              Contains substring or blank (any path)
            </span>
            <span className="text-[10px] text-gray-500 block mt-0.5">e.g., "Review", "Final", "Export", "Drive"</span>
          </div>

          <div className="p-3 rounded-xl bg-charcoal-900/80 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 uppercase font-mono block">Action Result [STATUS]</span>
            <span className="text-purple-200 font-mono text-xs font-bold mt-1 block">
              Advance Lifecycle Status
            </span>
            <span className="text-[10px] text-gray-500 block mt-0.5">review, editing, delivered, data_received</span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 border ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : actionNotice.type === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span className="font-mono">{actionNotice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
          <span className="flex items-center space-x-1.5">
            <span>SAVED FIRESTORE RULES ({rules.length})</span>
            {isLoadingFirestore && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
          </span>
          <span className="text-[11px] text-amber-400">
            {rules.filter(r => r.enabled).length} Active • Real-time database sync
          </span>
        </div>

        {rules.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-charcoal-950/60 border border-white/5 space-y-3">
            <Zap className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400">No automation rules configured in 'automation_rules' collection.</p>
            <button
              type="button"
              onClick={seedDefaultRulesToFirestore}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 cursor-pointer"
            >
              Seed Standard Workflow Presets to Firestore
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rules.map((rule) => {
              const targetOption = WORKFLOW_STATUS_OPTIONS.find(s => s.id === rule.targetStatus);
              const keyword = rule.keywordTrigger || rule.pathMatchPattern || '';

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    rule.enabled
                      ? 'bg-charcoal-950/70 border-amber-500/25 hover:border-amber-500/40 shadow-sm'
                      : 'bg-charcoal-950/30 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span className="text-xs font-bold text-white tracking-wide">
                          {rule.name}
                        </span>

                        {rule.enabled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                            Disabled
                          </span>
                        )}

                        {rule.autoNotify && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center space-x-1">
                            <Bell className="w-2.5 h-2.5" />
                            <span>Notify</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 leading-normal">
                        {rule.description}
                      </p>

                      {/* Visual Diagram: If file path contains [TEXT] -> set status to [STATUS] */}
                      <div className="flex items-center space-x-2 pt-1 font-mono text-[11px] text-gray-300 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 flex items-center space-x-1.5">
                          <FolderOpen className="w-3 h-3 text-amber-400" />
                          <span>If <strong>{rule.folderField || 'file path'}</strong> contains:</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            {keyword ? `"${keyword}"` : '[ANY PATH]'}
                          </span>
                        </span>

                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />

                        <span className={`px-2.5 py-0.5 rounded-md border font-semibold ${targetOption?.bg || 'bg-purple-500/20 border-purple-400/30'} ${targetOption?.color || 'text-purple-300'}`}>
                          Set Status to: <strong>{targetOption?.label || rule.targetStatus}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                          rule.enabled
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(rule)}
                        className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                        title="Edit Rule Configuration"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors cursor-pointer"
                        title="Delete Rule from Firestore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Helper Box */}
      <div className="p-4 rounded-2xl bg-charcoal-950/40 border border-luxury-green-800/20 flex items-start space-x-3 text-xs text-gray-400">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Real-time Execution & Persistence</span>
          <p className="leading-relaxed">
            All rule configuration objects are directly synchronized with the Firestore collection <code className="text-amber-300">automation_rules</code>. When any project is modified (e.g. folder paths entered or Google Drive links shared), active rules evaluate instantaneously to advance project workflows and log audit entries.
          </p>
        </div>
      </div>

      {/* Create / Edit Rule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSavingRule && setIsModalOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl p-6 overflow-hidden text-left bg-charcoal-900 border border-amber-500/30 rounded-3xl shadow-[0_20px_50px_rgba(251,191,36,0.2)] z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold font-display text-white">
                    {editingRuleId ? 'Edit Automation Rule' : 'Add Status Transition Rule (Firestore)'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSavingRule}
                  className="text-gray-400 hover:text-white p-1 cursor-pointer disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRuleToFirestore} className="space-y-4 text-xs font-mono">
                {/* Rule Name */}
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder='E.g. Move to Ready for Review when file path contains "Review"'
                    className="w-full px-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={ruleDescription}
                    onChange={(e) => setRuleDescription(e.target.value)}
                    placeholder="Short description of this trigger action"
                    className="w-full px-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Path Target Field Selection */}
                <div>
                  <label className="block text-[10px] text-amber-300 uppercase mb-1">Target File Folder / Cloud Path Field</label>
                  <select
                    value={ruleFolderField}
                    onChange={(e) => setRuleFolderField(e.target.value as any)}
                    className="w-full px-3 py-2 bg-charcoal-950 border border-amber-500/30 rounded-xl text-white focus:outline-none focus:border-amber-500 text-[11px]"
                  >
                    {FOLDER_FIELD_OPTIONS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Keyword Trigger: If file path contains [TEXT] */}
                <div className="p-3.5 rounded-xl bg-charcoal-950/70 border border-amber-500/30 space-y-1.5">
                  <label className="block text-[11px] text-gold-300 font-bold uppercase">
                    If File Path Contains [TEXT]:
                  </label>
                  <input
                    type="text"
                    value={ruleKeywordTrigger}
                    onChange={(e) => setRuleKeywordTrigger(e.target.value)}
                    placeholder='E.g. "Review", "Ready_For_Review", "Final", "Export", or leave blank for any path'
                    className="w-full px-3 py-2 bg-charcoal-900 border border-amber-500/40 rounded-xl text-amber-200 font-bold focus:outline-none focus:border-amber-400 placeholder:text-gray-600"
                  />
                  <p className="text-[10px] text-gray-400">
                    If specified, the rule only triggers when the file path text includes this keyword. If left blank, any non-empty path triggers the transition.
                  </p>
                </div>

                {/* Target Status: Set status to [STATUS] */}
                <div className="p-3.5 rounded-xl bg-charcoal-950/70 border border-purple-500/30 space-y-1.5">
                  <label className="block text-[11px] text-purple-300 font-bold uppercase">
                    Set Project Status to [STATUS]:
                  </label>
                  <select
                    value={ruleTargetStatus}
                    onChange={(e) => setRuleTargetStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-charcoal-900 border border-purple-500/40 rounded-xl text-purple-200 font-bold focus:outline-none focus:border-purple-400"
                  >
                    {WORKFLOW_STATUS_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} ({opt.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* In-app notification toggle */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="rule-modal-notify"
                    checked={ruleAutoNotify}
                    onChange={(e) => setRuleAutoNotify(e.target.checked)}
                    className="w-4 h-4 rounded bg-charcoal-950 border-gray-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="rule-modal-notify" className="text-xs text-gray-300 select-none cursor-pointer">
                    Dispatch in-app notification when this rule automatically triggers
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSavingRule}
                    className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRule}
                    className="px-5 py-2 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-charcoal-950 shadow-md transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSavingRule ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5" />
                        <span>{editingRuleId ? 'Update in Firestore' : 'Save Rule to Firestore'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
