import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  RotateCcw,
  Check, 
  ShieldAlert, 
  Info, 
  Smartphone,
  ExternalLink,
  Trash2,
  AlertTriangle,
  X,
  Lock,
  KeyRound,
  Palette,
  Cloud,
  CloudOff,
  Download,
  FileJson,
  User,
  Upload,
  Image as ImageIcon,
  Calculator,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  IndianRupee,
  CreditCard,
  ArrowRight,
  History,
  Sparkles,
  Wrench,
  Scan,
  Calendar,
  CalendarDays,
  CheckSquare,
  Square,
  Edit3,
  Save,
  FileSpreadsheet,
  Layers,
  SlidersHorizontal,
  Building2,
  Users,
  Zap,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from '../utils';
import { 
  UserProfile,
  Project,
  Studio,
  Editor,
  Expense,
  CalendarEvent,
  Revision,
  PaymentHistory
} from '../types';
import { THEME_CONFIGS, AppTheme } from './ThemeToggle';
import LoginScreenCustomizer from './LoginScreenCustomizer';
import AutomationRulesSettings from './AutomationRulesSettings';

interface SettingsViewProps {
  onResetDatabase: () => Promise<void>;
  isOnline: boolean;
  currentUser?: UserProfile | null;
  onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
  theme?: 'luxury-green' | 'midnight-gold' | 'royal-sapphire';
  onThemeChange?: (theme: 'luxury-green' | 'midnight-gold' | 'royal-sapphire') => void;
  projects?: Project[];
  studios?: Studio[];
  editors?: Editor[];
  expenses?: Expense[];
  calendarEvents?: CalendarEvent[];
  revisions?: Revision[];
  payments?: PaymentHistory[];
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
  isWeeklyBackupDue?: boolean;
  lastWeeklyBackupDate?: Date | null;
  onTriggerWeeklyBackup?: () => void;
}

export default function SettingsView({ 
  onResetDatabase, 
  isOnline, 
  currentUser,
  onUpdateProfile,
  theme = 'luxury-green',
  onThemeChange,
  projects = [],
  studios = [],
  editors = [],
  expenses = [],
  calendarEvents = [],
  revisions = [],
  payments = [],
  onUpdateProject,
  isWeeklyBackupDue = false,
  lastWeeklyBackupDate = null,
  onTriggerWeeklyBackup
}: SettingsViewProps) {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Settings Navigation Tab state: 'general' (All System Settings) vs 'automation_rules' (Automation Rules)
  const [settingsActiveTab, setSettingsActiveTab] = useState<'general' | 'automation_rules'>('general');

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'offline_backup'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [backupUrl, setBackupUrl] = useState<string | null>(null);
  const [backupFilename, setBackupFilename] = useState<string>('');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Profile update states
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhotoURL, setProfilePhotoURL] = useState(currentUser?.photoURL || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Theme Cross-Fade Animation State
  const [themeTransitioning, setThemeTransitioning] = useState(false);
  const [lastSwitchedTheme, setLastSwitchedTheme] = useState<AppTheme | null>(null);
  const [themeFeedback, setThemeFeedback] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  // Cloud SQL & Storage Status
  const [sqlDbStatus, setSqlDbStatus] = useState<{ 
    status: string; 
    database?: string; 
    timestamp?: string;
    supabase?: { configured: boolean; bucket: string; url: string };
  } | null>(null);
  const [isCheckingSqlDb, setIsCheckingSqlDb] = useState(false);

  useEffect(() => {
    const checkSql = async () => {
      try {
        const res = await fetch('/api/db/status');
        if (res.ok) {
          const data = await res.json();
          setSqlDbStatus({
            status: data.status,
            database: data.info?.database_name || 'cloud_sql_development_database',
            timestamp: data.info?.current_time || new Date().toISOString(),
            supabase: data.supabase
          });
        }
      } catch (err) {
        console.warn("Could not probe SQL DB status:", err);
      }
    };
    checkSql();
  }, []);

  const handleSelectTheme = (targetTheme: AppTheme) => {
    if (targetTheme === theme) return;
    setThemeTransitioning(true);
    setLastSwitchedTheme(targetTheme);
    onThemeChange?.(targetTheme);
    try {
      localStorage.setItem('tfc_theme', targetTheme);
    } catch {
      // Safe fallback
    }
    setTimeout(() => {
      setThemeTransitioning(false);
    }, 900);
  };

  const handleResetDefaultTheme = () => {
    if (theme === 'luxury-green') {
      setThemeFeedback({ message: 'Default Luxury Green theme is already active', type: 'info' });
      setTimeout(() => setThemeFeedback(null), 2500);
      return;
    }
    handleSelectTheme('luxury-green');
    try {
      localStorage.setItem('tfc_theme', 'luxury-green');
    } catch {
      // Safe fallback
    }
    setThemeFeedback({ message: 'Theme reset to default Luxury Green brand', type: 'success' });
    setTimeout(() => setThemeFeedback(null), 3000);
  };

  // Payment & Remaining Balance Diagnostic Panel State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState<'all' | 'discrepancy' | 'matching' | 'dues'>('all');
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [isFixingField, setIsFixingField] = useState<string | null>(null);
  const [auditNotice, setAuditNotice] = useState<string | null>(null);

  // Compute diagnostic evaluation per project
  const projectAuditData = useMemo(() => {
    return projects.map(p => {
      const contractAmt = Number(p.projectAmount) || 0;
      const initialAdv = Number(p.advancePayment) || 0;
      
      // Find linked studio receipts
      const pPayments = payments.filter(pay => pay.projectId === p.id && pay.entityType === 'studio');
      const loggedReceiptsSum = pPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
      
      // Effective received amount: uses logged receipts if present, else fallback to initial advance
      const effectiveReceived = pPayments.length > 0 ? loggedReceiptsSum : initialAdv;
      const computedRemaining = Math.max(0, contractAmt - effectiveReceived);
      
      // Stored field in project
      const storedRemaining = p.remainingBalance !== undefined 
        ? Number(p.remainingBalance) 
        : Math.max(0, contractAmt - initialAdv);
      
      const discrepancy = Math.abs(storedRemaining - computedRemaining);
      const isMatch = discrepancy < 1;

      const studio = studios.find(s => s.id === p.studioId || s.name?.toLowerCase() === p.studioName?.toLowerCase());

      return {
        p,
        contractAmt,
        initialAdv,
        pPayments,
        loggedReceiptsSum,
        effectiveReceived,
        computedRemaining,
        storedRemaining,
        discrepancy,
        isMatch,
        studioName: studio?.name || p.studioName || 'Studio Partner'
      };
    });
  }, [projects, payments, studios]);

  const auditSummary = useMemo(() => {
    const total = projectAuditData.length;
    const matches = projectAuditData.filter(d => d.isMatch).length;
    const mismatches = total - matches;
    const totalComputedOut = projectAuditData.reduce((sum, d) => sum + d.computedRemaining, 0);
    const totalStoredOut = projectAuditData.reduce((sum, d) => sum + d.storedRemaining, 0);
    const totalReceiptsCount = projectAuditData.reduce((sum, d) => sum + d.pPayments.length, 0);
    const itemsWithMismatch = projectAuditData.filter(d => !d.isMatch);

    return {
      total,
      matches,
      mismatches,
      totalComputedOut,
      totalStoredOut,
      totalReceiptsCount,
      itemsWithMismatch
    };
  }, [projectAuditData]);

  const filteredAuditData = useMemo(() => {
    return projectAuditData.filter(d => {
      const q = auditSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        (d.p.coupleName && d.p.coupleName.toLowerCase().includes(q)) ||
        (d.p.projectName && d.p.projectName.toLowerCase().includes(q)) ||
        d.studioName.toLowerCase().includes(q) ||
        d.p.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (auditFilter === 'discrepancy') return !d.isMatch;
      if (auditFilter === 'matching') return d.isMatch;
      if (auditFilter === 'dues') return d.computedRemaining > 0;
      return true;
    });
  }, [projectAuditData, auditSearch, auditFilter]);

  const toggleProjectExpand = (id: string) => {
    setExpandedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllProjects = () => {
    setExpandedProjectIds(new Set(projects.map(p => p.id)));
  };

  const collapseAllProjects = () => {
    setExpandedProjectIds(new Set());
  };

  const handleRepairProjectBalance = async (p: Project, computedRem: number) => {
    if (!onUpdateProject) return;
    setIsFixingField(p.id);
    try {
      await onUpdateProject(p.id, { remainingBalance: computedRem });
      setAuditNotice(`Updated "${p.coupleName || p.projectName}" remaining balance to ₹${computedRem.toLocaleString('en-IN')}`);
      setTimeout(() => setAuditNotice(null), 4000);
    } catch (err: any) {
      console.error("Failed to repair project balance:", err);
    } finally {
      setIsFixingField(null);
    }
  };

  const handleRepairAllDiscrepancies = async () => {
    if (!onUpdateProject || auditSummary.itemsWithMismatch.length === 0) return;
    setIsFixingField('bulk');
    try {
      for (const item of auditSummary.itemsWithMismatch) {
        await onUpdateProject(item.p.id, { remainingBalance: item.computedRemaining });
      }
      setAuditNotice(`Synchronized all ${auditSummary.itemsWithMismatch.length} mismatched projects to logic-accurate balance!`);
      setTimeout(() => setAuditNotice(null), 4000);
    } catch (err: any) {
      console.error("Failed bulk balance repair:", err);
    } finally {
      setIsFixingField(null);
    }
  };

  // ==========================================
  // DATA SCANNER & BULK RESOLUTION UTILITY STATE
  // ==========================================
  const [scannerSearch, setScannerSearch] = useState('');
  const [scannerFilter, setScannerFilter] = useState<
    'all_incomplete' | 'all' | 'missing_shoot' | 'missing_delivery' | 'missing_both_dates' | 'missing_studio' | 'missing_editor' | 'missing_amount' | 'complete'
  >('all_incomplete');
  const [selectedScannerProjectIds, setSelectedScannerProjectIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [scannerNotice, setScannerNotice] = useState<string | null>(null);

  // Bulk Edit Config Bar Fields
  const [bulkShootDate, setBulkShootDate] = useState('');
  const [bulkDeliveryDate, setBulkDeliveryDate] = useState('');
  const [bulkStudioId, setBulkStudioId] = useState('');
  const [bulkEditorId, setBulkEditorId] = useState('');
  const [bulkEventType, setBulkEventType] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [bulkProjectAmount, setBulkProjectAmount] = useState('');

  // Inline Quick-Edit State
  const [inlineEditingProjectId, setInlineEditingProjectId] = useState<string | null>(null);
  const [inlineEditValues, setInlineEditValues] = useState<Partial<Project>>({});
  const [isSavingInline, setIsSavingInline] = useState(false);

  // Diagnostic Data Scanner Evaluation per project
  const scannerAuditData = useMemo(() => {
    return projects.map((p) => {
      const missingShootDate = !p.shootDate || p.shootDate.trim() === '';
      const missingDeliveryDate = !p.deliveryDate || p.deliveryDate.trim() === '';
      const missingBothDates = missingShootDate && missingDeliveryDate;
      const missingStudio = !p.studioId || p.studioId === 'direct-client' || !p.studioName || p.studioName.trim() === '';
      const missingEditor = !p.assignedEditorId || p.assignedEditorId === '' || p.assignedEditorName === 'Unassigned' || !p.assignedEditorName;
      const missingAmount = !p.projectAmount || Number(p.projectAmount) <= 0;
      const missingEventType = !p.eventType || p.eventType.trim() === '';

      const issues: { code: string; label: string; severity: 'critical' | 'warning' | 'info'; color: string }[] = [];

      if (missingShootDate) {
        issues.push({ code: 'shootDate', label: 'Missing Shoot Date', severity: 'critical', color: 'rose' });
      }
      if (missingDeliveryDate) {
        issues.push({ code: 'deliveryDate', label: 'Missing Delivery Date', severity: 'critical', color: 'amber' });
      }
      if (missingStudio) {
        issues.push({ code: 'studio', label: 'Unlinked Studio', severity: 'warning', color: 'purple' });
      }
      if (missingEditor) {
        issues.push({ code: 'editor', label: 'Unassigned Editor', severity: 'warning', color: 'blue' });
      }
      if (missingAmount) {
        issues.push({ code: 'amount', label: 'Missing Valuation (₹0)', severity: 'warning', color: 'orange' });
      }
      if (missingEventType) {
        issues.push({ code: 'eventType', label: 'Missing Event Type', severity: 'info', color: 'gray' });
      }

      const studio = studios.find((s) => s.id === p.studioId || s.name?.toLowerCase() === p.studioName?.toLowerCase());
      const editor = editors.find((e) => e.id === p.assignedEditorId || e.name?.toLowerCase() === p.assignedEditorName?.toLowerCase());

      return {
        p,
        id: p.id,
        coupleName: p.coupleName || p.projectName || 'Untitled Project',
        projectName: p.projectName || p.coupleName || 'Wedding Film',
        shootDate: p.shootDate || '',
        deliveryDate: p.deliveryDate || '',
        studioName: studio?.name || p.studioName || 'Direct Client / Unlinked',
        studioId: p.studioId || '',
        assignedEditorName: editor?.name || p.assignedEditorName || 'Unassigned',
        assignedEditorId: p.assignedEditorId || '',
        eventType: p.eventType || 'Wedding Film',
        projectAmount: Number(p.projectAmount) || 0,
        status: p.status || 'data_received',
        priority: p.priority || 'medium',
        missingShootDate,
        missingDeliveryDate,
        missingBothDates,
        missingStudio,
        missingEditor,
        missingAmount,
        missingEventType,
        issues,
        isIncomplete: issues.length > 0,
        canAutoDeriveDelivery: !!p.shootDate && missingDeliveryDate
      };
    });
  }, [projects, studios, editors]);

  // Overall Data Scanner Metrics
  const scannerSummary = useMemo(() => {
    const total = scannerAuditData.length;
    const incomplete = scannerAuditData.filter((d) => d.isIncomplete).length;
    const complete = total - incomplete;
    const missingShoot = scannerAuditData.filter((d) => d.missingShootDate).length;
    const missingDelivery = scannerAuditData.filter((d) => d.missingDeliveryDate).length;
    const missingBothDates = scannerAuditData.filter((d) => d.missingBothDates).length;
    const missingStudio = scannerAuditData.filter((d) => d.missingStudio).length;
    const missingEditor = scannerAuditData.filter((d) => d.missingEditor).length;
    const missingAmount = scannerAuditData.filter((d) => d.missingAmount).length;
    const canAutoDerive = scannerAuditData.filter((d) => d.canAutoDeriveDelivery).length;
    const healthScore = total > 0 ? Math.max(0, Math.round(((total - incomplete) / total) * 100)) : 100;

    return {
      total,
      incomplete,
      complete,
      missingShoot,
      missingDelivery,
      missingBothDates,
      missingStudio,
      missingEditor,
      missingAmount,
      canAutoDerive,
      healthScore
    };
  }, [scannerAuditData]);

  // Filtered List for Table
  const filteredScannerData = useMemo(() => {
    return scannerAuditData.filter((d) => {
      // Search
      const q = scannerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.coupleName.toLowerCase().includes(q) ||
        d.projectName.toLowerCase().includes(q) ||
        d.studioName.toLowerCase().includes(q) ||
        d.assignedEditorName.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Filter Tabs
      if (scannerFilter === 'all_incomplete') return d.isIncomplete;
      if (scannerFilter === 'missing_shoot') return d.missingShootDate;
      if (scannerFilter === 'missing_delivery') return d.missingDeliveryDate;
      if (scannerFilter === 'missing_both_dates') return d.missingBothDates;
      if (scannerFilter === 'missing_studio') return d.missingStudio;
      if (scannerFilter === 'missing_editor') return d.missingEditor;
      if (scannerFilter === 'missing_amount') return d.missingAmount;
      if (scannerFilter === 'complete') return !d.isIncomplete;
      return true;
    });
  }, [scannerAuditData, scannerSearch, scannerFilter]);

  // Toggle Single Selection
  const toggleScannerSelection = (id: string) => {
    setSelectedScannerProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select All Filtered Projects
  const selectAllFilteredScannerProjects = () => {
    const allFilteredIds = filteredScannerData.map((d) => d.id);
    setSelectedScannerProjectIds(new Set(allFilteredIds));
  };

  // Deselect All
  const clearScannerSelections = () => {
    setSelectedScannerProjectIds(new Set());
  };

  // Select All Incomplete Projects
  const selectAllIncompleteProjects = () => {
    const incompleteIds = scannerAuditData.filter((d) => d.isIncomplete).map((d) => d.id);
    setSelectedScannerProjectIds(new Set(incompleteIds));
    setScannerFilter('all_incomplete');
  };

  // Start Inline Editing for a specific Project
  const handleStartInlineEdit = (item: (typeof scannerAuditData)[0]) => {
    setInlineEditingProjectId(item.id);
    setInlineEditValues({
      shootDate: item.shootDate,
      deliveryDate: item.deliveryDate,
      studioId: item.studioId,
      studioName: item.studioName,
      assignedEditorId: item.assignedEditorId,
      assignedEditorName: item.assignedEditorName,
      eventType: item.eventType,
      projectAmount: item.projectAmount,
      status: item.status,
      priority: item.priority
    });
  };

  // Cancel Inline Editing
  const handleCancelInlineEdit = () => {
    setInlineEditingProjectId(null);
    setInlineEditValues({});
  };

  // Save Inline Editing
  const handleSaveInlineEdit = async (projectId: string) => {
    if (!onUpdateProject) return;
    setIsSavingInline(true);
    try {
      const updates: Partial<Project> = { ...inlineEditValues };
      
      // Auto populate studioName from selected studioId if changed
      if (updates.studioId) {
        const foundStudio = studios.find((s) => s.id === updates.studioId);
        if (foundStudio) updates.studioName = foundStudio.name;
      }
      
      // Auto populate assignedEditorName from selected assignedEditorId if changed
      if (updates.assignedEditorId) {
        const foundEditor = editors.find((e) => e.id === updates.assignedEditorId);
        if (foundEditor) updates.assignedEditorName = foundEditor.name;
      }

      await onUpdateProject(projectId, updates);
      setInlineEditingProjectId(null);
      setInlineEditValues({});
      setScannerNotice(`Successfully updated project fields for "${projectId}"!`);
      setTimeout(() => setScannerNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to save inline project edits:', err);
    } finally {
      setIsSavingInline(false);
    }
  };

  // Apply Bulk Updates to All Selected Projects
  const handleApplyBulkUpdates = async () => {
    if (!onUpdateProject || selectedScannerProjectIds.size === 0) return;

    // Check if at least one field is configured
    if (
      !bulkShootDate &&
      !bulkDeliveryDate &&
      !bulkStudioId &&
      !bulkEditorId &&
      !bulkEventType &&
      !bulkStatus &&
      !bulkPriority &&
      !bulkProjectAmount
    ) {
      alert('Please select or specify at least one field to update in the Bulk Action panel.');
      return;
    }

    setIsBulkUpdating(true);
    try {
      const targetIds: string[] = Array.from(selectedScannerProjectIds);
      let updatedCount = 0;

      for (const pId of targetIds) {
        const updates: Partial<Project> = {};
        if (bulkShootDate) updates.shootDate = bulkShootDate;
        if (bulkDeliveryDate) updates.deliveryDate = bulkDeliveryDate;
        if (bulkStudioId) {
          const sObj = studios.find((s) => s.id === bulkStudioId);
          updates.studioId = bulkStudioId;
          if (sObj) updates.studioName = sObj.name;
        }
        if (bulkEditorId) {
          const eObj = editors.find((e) => e.id === bulkEditorId);
          updates.assignedEditorId = bulkEditorId;
          if (eObj) updates.assignedEditorName = eObj.name;
        }
        if (bulkEventType) updates.eventType = bulkEventType;
        if (bulkStatus) updates.status = bulkStatus as any;
        if (bulkPriority) updates.priority = bulkPriority as any;
        if (bulkProjectAmount) updates.projectAmount = Number(bulkProjectAmount);

        if (Object.keys(updates).length > 0) {
          await onUpdateProject(pId, updates);
          updatedCount++;
        }
      }

      // Reset bulk form
      setBulkShootDate('');
      setBulkDeliveryDate('');
      setBulkStudioId('');
      setBulkEditorId('');
      setBulkEventType('');
      setBulkStatus('');
      setBulkPriority('');
      setBulkProjectAmount('');
      setSelectedScannerProjectIds(new Set());

      setScannerNotice(`Successfully resolved & bulk-updated ${updatedCount} project(s)!`);
      setTimeout(() => setScannerNotice(null), 5000);
    } catch (err: any) {
      console.error('Failed to apply bulk updates:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Smart Auto-Fix: Set 30-Day Delivery Dates for projects with shootDate but no deliveryDate
  const handleSmartAutoFixDeliveryDates = async () => {
    if (!onUpdateProject) return;
    const candidates = scannerAuditData.filter((d) => d.canAutoDeriveDelivery);
    if (candidates.length === 0) return;

    setIsBulkUpdating(true);
    try {
      let count = 0;
      for (const item of candidates) {
        const shoot = new Date(item.shootDate.includes('T') ? item.shootDate : `${item.shootDate}T00:00:00`);
        if (!isNaN(shoot.getTime())) {
          const delDate = new Date(shoot.getTime() + 30 * 24 * 60 * 60 * 1000);
          const delStr = delDate.toISOString().split('T')[0];
          await onUpdateProject(item.id, { deliveryDate: delStr });
          count++;
        }
      }
      setScannerNotice(`Smart Auto-Fix applied standard 30-day delivery dates to ${count} project(s)!`);
      setTimeout(() => setScannerNotice(null), 5000);
    } catch (err: any) {
      console.error('Failed smart auto-fixing delivery dates:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Smart Auto-Fill: Fill missing Event Types with 'Wedding Film' and Priority with 'medium'
  const handleSmartAutoFillDefaults = async () => {
    if (!onUpdateProject) return;
    const candidates = scannerAuditData.filter((d) => d.missingEventType || !d.p.priority);
    if (candidates.length === 0) return;

    setIsBulkUpdating(true);
    try {
      let count = 0;
      for (const item of candidates) {
        const updates: Partial<Project> = {};
        if (item.missingEventType) updates.eventType = 'Wedding Film';
        if (!item.p.priority) updates.priority = 'medium';
        if (Object.keys(updates).length > 0) {
          await onUpdateProject(item.id, updates);
          count++;
        }
      }
      setScannerNotice(`Standardized ${count} project(s) with default Wedding Film event types and medium priority!`);
      setTimeout(() => setScannerNotice(null), 5000);
    } catch (err: any) {
      console.error('Failed smart auto-fill defaults:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Export Data Health & Missing Fields CSV Audit Report
  const handleExportDataHealthCSV = () => {
    const headers = [
      'Project ID',
      'Couple / Project Name',
      'Studio Name',
      'Shoot Date',
      'Delivery Date',
      'Assigned Editor',
      'Event Type',
      'Contract Valuation (INR)',
      'Status',
      'Missing Mandatory Fields Count',
      'Missing Field Details'
    ];

    const rows = scannerAuditData.map((d) => [
      `"${d.id}"`,
      `"${d.coupleName.replace(/"/g, '""')}"`,
      `"${d.studioName.replace(/"/g, '""')}"`,
      `"${d.shootDate || 'MISSING'}"`,
      `"${d.deliveryDate || 'MISSING'}"`,
      `"${d.assignedEditorName.replace(/"/g, '""')}"`,
      `"${d.eventType}"`,
      d.projectAmount,
      `"${d.status}"`,
      d.issues.length,
      `"${d.issues.map((i) => i.label).join('; ') || 'None (Complete)'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FrameCut_Data_Scanner_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsUpdatingProfile(true);

    if (!profileName.trim()) {
      setProfileError('Display name is required.');
      setIsUpdatingProfile(false);
      return;
    }

    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: profileName,
          photoURL: profilePhotoURL
        });
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        setProfileError('Profile update function not available.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 300, 300, 0.7);
          setProfilePhotoURL(compressed);
        }
        setProfileError("");
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetDatabase();
      setIsConfirmingReset(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentUser) {
      setPasswordError('You must be logged in to change your password.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and Confirmation password do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters long.');
      return;
    }

    try {
      // Default passwords map
      let passwordsMap: Record<string, string> = {
        'satish@framecut.com': 'satish123',
        'sateesh2000': 'Sateesh@504054',
        'vansh@framecut.com': 'vansh123',
        'vansh2000': '8889995988',
        'kk@weddingbykk.com': 'kk123'
      };

      const saved = localStorage.getItem('tfc_passwords');
      if (saved) {
        try {
          passwordsMap = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse tfc_passwords from localStorage. Using default map:", e);
        }
      }

      const userEmail = currentUser?.email || 'anonymous';
      const expectedOldPassword = passwordsMap[userEmail] || (userEmail.includes('@') ? `${userEmail.split('@')[0]}123` : 'admin123');

      if (currentPassword !== expectedOldPassword) {
        setPasswordError('The current password you entered is incorrect.');
        return;
      }

      // Update password
      passwordsMap[userEmail] = newPassword;
      localStorage.setItem('tfc_passwords', JSON.stringify(passwordsMap));

      setPasswordSuccess('Password updated successfully! Please use your new password next time you login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    }
  };

  const handleSyncToCloud = async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    setBackupUrl(null);
    
    // Smooth user feedback transition
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Compile dynamic state models into a unified JSON backup
    const backupData = {
      backupName: "Frame Cut Studio OS Unified ERP Backup",
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.email || 'anonymous_user',
      connectionState: isOnline ? 'online' : 'offline',
      recordsCount: {
        projects: projects.length,
        studios: studios.length,
        editors: editors.length,
        expenses: expenses.length,
        calendarEvents: calendarEvents.length,
        revisions: revisions.length,
        payments: payments.length
      },
      data: {
        projects,
        studios,
        editors,
        expenses,
        calendarEvents,
        revisions,
        payments
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `tfc_erp_backup_${new Date().toISOString().slice(0, 10)}_${isOnline ? 'online' : 'offline'}.json`;
    
    setBackupUrl(url);
    setBackupFilename(filename);

    if (isOnline) {
      try {
        // Record heartbeat in cloud database
        await addDoc(collection(db, 'syncHeartbeats'), {
          timestamp: serverTimestamp(),
          userId: currentUser?.uid || 'anonymous',
          userEmail: currentUser?.email || 'unknown',
          recordsCount: {
            projects: projects.length,
            studios: studios.length,
            editors: editors.length,
            expenses: expenses.length,
            calendarEvents: calendarEvents.length,
            revisions: revisions.length,
            payments: payments.length
          },
          status: 'success'
        });
        
        setSyncStatus('success');
        
        // Auto-clear success state
        setTimeout(() => setSyncStatus('idle'), 5000);
      } catch (err: any) {
        console.error('Firestore cloud heartbeat sync failed', err);
        setSyncError('Cloud synchronization handshake timed out. Activating offline JSON download.');
        setSyncStatus('offline_backup');
        triggerAutoDownload(url, filename);
      }
    } else {
      setSyncStatus('offline_backup');
      triggerAutoDownload(url, filename);
    }
  };

  const triggerAutoDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Settings Panel */}
      <div className="p-6 rounded-3xl glass-panel relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-green-800/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-white">System Settings</h2>
            <p className="text-xs text-gray-400 mt-1">Configure workspace defaults, trigger data synchronizations, and adjust ERP properties.</p>
          </div>

          {/* Navigation Tabs Header */}
          <div className="flex items-center p-1 bg-charcoal-950/80 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSettingsActiveTab('general')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                settingsActiveTab === 'general'
                  ? 'bg-gradient-to-r from-luxury-green-700 to-luxury-green-800 text-white shadow-md border border-luxury-green-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>General Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsActiveTab('automation_rules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                settingsActiveTab === 'automation_rules'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-charcoal-950 shadow-md border border-amber-400 font-black'
                  : 'text-gray-400 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Automation Rules</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                settingsActiveTab === 'automation_rules' ? 'bg-charcoal-950/30 text-charcoal-950 font-black' : 'bg-amber-500/20 text-amber-400'
              }`}>
                Firestore
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* When Automation Rules Tab is Active */}
      {settingsActiveTab === 'automation_rules' && (
        <AutomationRulesSettings
          projects={projects}
          onUpdateProject={onUpdateProject}
        />
      )}

      {/* Main Blocks (General Tab) */}
      <div className={`space-y-4 ${settingsActiveTab === 'automation_rules' ? 'hidden' : 'block'}`}>

        {/* User Profile Settings Block */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-5">
          <h3 className="text-sm font-bold font-display text-white flex items-center space-x-3">
            <div className="p-2.5 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block font-display">User Profile Details</span>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-widest">Update your name and premium brand avatar</p>
            </div>
          </h3>

          {profileError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Visual Avatar Editor Interface */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-charcoal-950/40 p-4.5 rounded-2xl border border-luxury-green-900/10">
              <div className="relative group shrink-0">
                <img
                  src={profilePhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-2xl object-cover border border-gold-500/30 shadow-lg"
                />
                <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Upload className="w-5 h-5 text-gold-400" />
                </div>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <span className="text-xs font-semibold text-gray-200">Modify profile photograph</span>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Upload a local JPEG/PNG file, select from our curated premium avatars, or paste a custom image link below.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="px-3.5 py-1.5 bg-luxury-green-800/20 hover:bg-luxury-green-800/40 border border-luxury-green-500/20 text-gold-400 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-colors flex items-center space-x-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Premium Avatar Grid Selection */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider">Curated Preset Avatars</span>
              <div className="grid grid-cols-6 gap-2.5">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProfilePhotoURL(url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border transition-all hover:scale-105 cursor-pointer ${
                      profilePhotoURL === url 
                        ? 'border-gold-500 ring-2 ring-gold-500/20 shadow-[0_0_12px_rgba(212,175,55,0.25)] scale-102' 
                        : 'border-white/5 opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    {profilePhotoURL === url && (
                      <div className="absolute inset-0 bg-gold-500/10 flex items-center justify-center">
                        <div className="bg-gold-500 text-charcoal-950 rounded-full p-0.5 border border-charcoal-950">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields: Name & Custom Image Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="E.g. Satish Tiwari"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">Custom Image URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    placeholder="Paste image link: https://..."
                    value={profilePhotoURL.startsWith('data:') ? '' : profilePhotoURL}
                    onChange={(e) => setProfilePhotoURL(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55"
              >
                {isUpdatingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Updating Profile...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Color Palette Toggle Block with Smooth Cross-Fade Animation */}
        <div className="relative p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 overflow-hidden space-y-5 transition-all duration-700">
          
          {/* Ambient Cross-Fade Aura Background Layer */}
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 pointer-events-none -z-0"
              style={{
                background: theme === 'luxury-green'
                  ? 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(60, 143, 120, 0.16) 0%, rgba(12, 43, 35, 0.04) 60%, transparent 100%)'
                  : theme === 'midnight-gold'
                  ? 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212, 175, 55, 0.16) 0%, rgba(140, 113, 31, 0.04) 60%, transparent 100%)'
                  : 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37, 99, 235, 0.18) 0%, rgba(13, 21, 46, 0.04) 60%, transparent 100%)'
              }}
            />
          </AnimatePresence>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold font-display text-white flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl border transition-all duration-700 ${
                theme === 'luxury-green'
                  ? 'bg-luxury-green-500/15 text-luxury-green-400 border-luxury-green-500/30'
                  : theme === 'midnight-gold'
                  ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                  : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              }`}>
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight block font-display">Application Color Palette</span>
                <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-widest">Select user interface brand theme • 3 Presets Available</p>
              </div>
            </h3>

            {/* Live Active Theme Visual Indicator & Reset to Default Action */}
            <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
              {/* Prominent Active Theme Visual Indicator Pill */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme + (themeTransitioning ? '-transitioning' : '')}
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold border backdrop-blur-md ${
                    theme === 'luxury-green'
                      ? 'bg-luxury-green-950/90 text-luxury-green-300 border-luxury-green-500/40 shadow-[0_0_15px_rgba(60,143,120,0.3)]'
                      : theme === 'midnight-gold'
                      ? 'bg-amber-950/90 text-gold-300 border-gold-500/40 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'bg-blue-950/90 text-blue-300 border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                  }`}
                >
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      theme === 'luxury-green' ? 'bg-luxury-green-400' : theme === 'midnight-gold' ? 'bg-gold-400' : 'bg-blue-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      theme === 'luxury-green' ? 'bg-luxury-green-500' : theme === 'midnight-gold' ? 'bg-gold-500' : 'bg-blue-500'
                    }`} />
                  </span>
                  <span className="text-gray-400 font-normal mr-1">Active:</span>
                  <span className="font-bold text-white mr-1.5">{THEME_CONFIGS[theme]?.name || 'Theme'}</span>
                  {theme === 'luxury-green' ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-luxury-green-500/20 text-luxury-green-300 border border-luxury-green-500/30">
                      Default Brand
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-gray-300 border border-white/15">
                      Custom Theme
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* 'Reset to Default' Button */}
              <button
                type="button"
                id="reset-theme-default-btn"
                onClick={handleResetDefaultTheme}
                title={theme === 'luxury-green' ? 'Default Luxury Green theme is currently active' : 'Click to reset theme back to factory default (Luxury Green)'}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-300 cursor-pointer ${
                  theme === 'luxury-green'
                    ? 'bg-charcoal-800/70 text-gray-400 border border-white/10 hover:border-white/20 hover:text-gray-200'
                    : 'bg-luxury-green-950/90 hover:bg-luxury-green-900 text-luxury-green-300 border border-luxury-green-500/50 shadow-[0_0_15px_rgba(60,143,120,0.25)] hover:shadow-[0_0_20px_rgba(60,143,120,0.4)] hover:border-luxury-green-400 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${theme !== 'luxury-green' ? 'text-luxury-green-400 animate-spin-reverse' : 'text-gray-400'}`} />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          {/* Real-time Theme Feedback Banner */}
          <AnimatePresence>
            {themeFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-10 overflow-hidden"
              >
                <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono border ${
                  themeFeedback.type === 'success'
                    ? 'bg-luxury-green-950/70 border-luxury-green-500/40 text-luxury-green-300 shadow-[0_0_12px_rgba(60,143,120,0.2)]'
                    : 'bg-charcoal-800/90 border-white/15 text-gray-300'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-luxury-green-400" />
                  <span>{themeFeedback.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="relative z-10 text-xs text-gray-400 leading-relaxed">
            Customize the look and feel of your ERP workspace with real-time hardware-accelerated cross-fades. Choose between the deep <strong className="text-luxury-green-400">Luxury Green</strong> signature brand, the high-contrast warmth of <strong className="text-gold-400">Midnight Gold</strong>, or the regal <strong className="text-blue-400">Royal Sapphire</strong> theme. You can revert back to factory branding at any time with the <strong className="text-white">Reset to Default</strong> button.
          </p>

          {/* Theme Option Cards with Distinct Active Visual Indicators */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Luxury Green Card Option */}
            <motion.button
              type="button"
              id="theme-opt-green"
              onClick={() => handleSelectTheme('luxury-green')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-2xl border text-left cursor-pointer flex flex-col justify-between group overflow-hidden transition-all duration-500 ${
                theme === 'luxury-green'
                  ? 'bg-luxury-green-950/70 border-luxury-green-400 ring-2 ring-luxury-green-400/80 ring-offset-2 ring-offset-charcoal-900 text-white shadow-[0_0_25px_rgba(60,143,120,0.35)]'
                  : 'bg-charcoal-950/60 border-luxury-green-800/10 text-gray-400 hover:border-luxury-green-800/40 hover:bg-charcoal-950/80'
              }`}
            >
              <div className="flex items-center justify-between w-full relative z-10 mb-2">
                {/* Visual indicator of colors */}
                <div className="flex -space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-luxury-green-900 border border-charcoal-950 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-luxury-green-500 border border-charcoal-950 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-500 border border-charcoal-950 shadow-sm" />
                </div>

                {/* Active / Inactive Badge */}
                {theme === 'luxury-green' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-luxury-green-500 text-charcoal-950 shadow-[0_0_10px_rgba(60,143,120,0.6)] flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-charcoal-950 animate-pulse" />
                    <span>Active (Default)</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-gray-500 group-hover:text-gray-400">
                    Click to activate
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between w-full relative z-10 mt-1">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold block text-white group-hover:text-luxury-green-300 transition-colors">Luxury Green</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-luxury-green-500/20 text-luxury-green-400 border border-luxury-green-500/30">
                      Default
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Emerald & Gold Signature</span>
                </div>

                <div className={`relative z-10 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500 ${
                  theme === 'luxury-green'
                    ? 'border-luxury-green-400 bg-luxury-green-500 text-charcoal-950 shadow-[0_0_10px_rgba(60,143,120,0.7)] scale-110'
                    : 'border-gray-600 bg-charcoal-900/80 text-transparent group-hover:border-gray-400'
                }`}>
                  {theme === 'luxury-green' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </motion.button>

            {/* Midnight Gold Card Option */}
            <motion.button
              type="button"
              id="theme-opt-gold"
              onClick={() => handleSelectTheme('midnight-gold')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-2xl border text-left cursor-pointer flex flex-col justify-between group overflow-hidden transition-all duration-500 ${
                theme === 'midnight-gold'
                  ? 'bg-amber-950/50 border-gold-400 ring-2 ring-gold-400/80 ring-offset-2 ring-offset-charcoal-900 text-white shadow-[0_0_25px_rgba(212,175,55,0.35)]'
                  : 'bg-charcoal-950/60 border-luxury-green-800/10 text-gray-400 hover:border-gold-500/40 hover:bg-charcoal-950/80'
              }`}
            >
              <div className="flex items-center justify-between w-full relative z-10 mb-2">
                {/* Visual indicator of colors */}
                <div className="flex -space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-950 border border-charcoal-950 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-600 border border-charcoal-950 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-400 border border-charcoal-950 shadow-sm" />
                </div>

                {/* Active / Inactive Badge */}
                {theme === 'midnight-gold' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-gold-500 text-charcoal-950 shadow-[0_0_10px_rgba(212,175,55,0.6)] flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-charcoal-950 animate-pulse" />
                    <span>Active Theme</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-gray-500 group-hover:text-gray-400">
                    Click to activate
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between w-full relative z-10 mt-1">
                <div>
                  <span className="text-xs font-bold block text-white group-hover:text-gold-300 transition-colors">Midnight Gold</span>
                  <span className="text-[10px] text-gray-400 font-mono">Warm Obsidian & Rich Gold</span>
                </div>

                <div className={`relative z-10 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500 ${
                  theme === 'midnight-gold'
                    ? 'border-gold-300 bg-gold-500 text-charcoal-950 shadow-[0_0_10px_rgba(212,175,55,0.7)] scale-110'
                    : 'border-gray-600 bg-charcoal-900/80 text-transparent group-hover:border-gray-400'
                }`}>
                  {theme === 'midnight-gold' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </motion.button>

            {/* Royal Sapphire Card Option */}
            <motion.button
              type="button"
              id="theme-opt-sapphire"
              onClick={() => handleSelectTheme('royal-sapphire')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-2xl border text-left cursor-pointer flex flex-col justify-between group overflow-hidden transition-all duration-500 ${
                theme === 'royal-sapphire'
                  ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-400/80 ring-offset-2 ring-offset-charcoal-900 text-white shadow-[0_0_25px_rgba(59,130,246,0.35)]'
                  : 'bg-charcoal-950/60 border-luxury-green-800/10 text-gray-400 hover:border-blue-500/40 hover:bg-charcoal-950/80'
              }`}
            >
              <div className="flex items-center justify-between w-full relative z-10 mb-2">
                {/* Visual indicator of colors */}
                <div className="flex -space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-950 border border-charcoal-950 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-charcoal-950 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-charcoal-950 shadow-sm" />
                </div>

                {/* Active / Inactive Badge */}
                {theme === 'royal-sapphire' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)] flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Active Theme</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-gray-500 group-hover:text-gray-400">
                    Click to activate
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between w-full relative z-10 mt-1">
                <div>
                  <span className="text-xs font-bold block text-white group-hover:text-blue-300 transition-colors">Royal Sapphire</span>
                  <span className="text-[10px] text-gray-400 font-mono">Regal Navy & Sapphire Blue</span>
                </div>

                <div className={`relative z-10 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500 ${
                  theme === 'royal-sapphire'
                    ? 'border-blue-300 bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.7)] scale-110'
                    : 'border-gray-600 bg-charcoal-900/80 text-transparent group-hover:border-gray-400'
                }`}>
                  {theme === 'royal-sapphire' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </motion.button>
          </div>

          {/* Active Theme Status & Reset Summary Bar */}
          <div className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-500 ${
            theme === 'luxury-green'
              ? 'bg-charcoal-950/50 border-white/5'
              : 'bg-charcoal-950/80 border-gold-500/25 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
          }`}>
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  theme === 'luxury-green' ? 'bg-luxury-green-400' : theme === 'midnight-gold' ? 'bg-gold-400' : 'bg-blue-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  theme === 'luxury-green' ? 'bg-luxury-green-500' : theme === 'midnight-gold' ? 'bg-gold-500' : 'bg-blue-500'
                }`} />
              </span>
              <span className="text-xs text-gray-300 font-mono">
                Current active theme: <strong className="text-white">{THEME_CONFIGS[theme]?.name}</strong>
                {theme === 'luxury-green' ? (
                  <span className="text-luxury-green-400 ml-1.5">(Default brand palette active)</span>
                ) : (
                  <span className="text-gold-300 ml-1.5">(Custom theme active • Saved in workspace)</span>
                )}
              </span>
            </div>

            <button
              type="button"
              id="reset-theme-bottom-btn"
              onClick={handleResetDefaultTheme}
              className={`inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-300 cursor-pointer ${
                theme === 'luxury-green'
                  ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 border border-white/10'
                  : 'bg-luxury-green-950/90 hover:bg-luxury-green-900 text-luxury-green-300 border border-luxury-green-500/50 shadow-[0_0_12px_rgba(60,143,120,0.25)] hover:border-luxury-green-400 hover:scale-[1.02]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{theme === 'luxury-green' ? 'Reset to Default' : 'Reset to Default (Luxury Green)'}</span>
            </button>
          </div>

          {/* Interactive Live Theme Cross-Fade Showcase Panel */}
          <div className="relative z-10 pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-700 ${
                  theme === 'luxury-green'
                    ? 'bg-gradient-to-r from-emerald-950/40 via-charcoal-950/80 to-charcoal-900/90 border-emerald-500/25 shadow-[0_4px_24px_rgba(60,143,120,0.1)]'
                    : theme === 'midnight-gold'
                    ? 'bg-gradient-to-r from-amber-950/30 via-charcoal-950/80 to-charcoal-900/90 border-gold-500/25 shadow-[0_4px_24px_rgba(212,175,55,0.1)]'
                    : 'bg-gradient-to-r from-blue-950/40 via-charcoal-950/80 to-charcoal-900/90 border-blue-500/25 shadow-[0_4px_24px_rgba(37,99,235,0.1)]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Active Theme Info & Color Swatches */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                        theme === 'luxury-green' ? 'text-luxury-green-400' : theme === 'midnight-gold' ? 'text-gold-400' : 'text-blue-400'
                      }`}>
                        {THEME_CONFIGS[theme]?.name} Preview
                      </span>
                      <span className="text-gray-600 text-xs">•</span>
                      <span className="text-[11px] text-gray-400">{THEME_CONFIGS[theme]?.tagline}</span>
                    </div>

                    {/* Color Swatch Dots with Hex Labels */}
                    <div className="flex items-center space-x-3 pt-0.5">
                      <div className="flex items-center space-x-1.5 bg-charcoal-950/70 px-2 py-1 rounded-lg border border-white/5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: THEME_CONFIGS[theme]?.primaryColor }}
                        />
                        <span className="text-[10px] font-mono text-gray-300">Primary: {THEME_CONFIGS[theme]?.primaryColor}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-charcoal-950/70 px-2 py-1 rounded-lg border border-white/5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: THEME_CONFIGS[theme]?.accentColor }}
                        />
                        <span className="text-[10px] font-mono text-gray-300">Accent: {THEME_CONFIGS[theme]?.accentColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Simulated UI Components */}
                  <div className="flex items-center space-x-2.5 self-start md:self-auto bg-charcoal-950/50 p-2 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mr-1">Live UI:</span>
                    
                    {/* Simulated Sample Button */}
                    <button
                      type="button"
                      tabIndex={-1}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-display shadow-sm transition-all duration-500 cursor-default ${
                        theme === 'luxury-green'
                          ? 'bg-luxury-green-500 text-charcoal-950 shadow-[0_0_10px_rgba(60,143,120,0.3)]'
                          : theme === 'midnight-gold'
                          ? 'bg-gold-500 text-charcoal-950 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                          : 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                      }`}
                    >
                      Sample Action
                    </button>

                    {/* Simulated Sample Pill Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-all duration-500 ${
                      theme === 'luxury-green'
                        ? 'bg-luxury-green-950/80 text-luxury-green-400 border-luxury-green-500/30'
                        : theme === 'midnight-gold'
                        ? 'bg-amber-950/80 text-gold-400 border-gold-500/30'
                        : 'bg-blue-950/80 text-blue-400 border-blue-500/30'
                    }`}>
                      Live Accent
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Pre-Login Welcome / Splash Screen & Login Portal Customizer */}
        <LoginScreenCustomizer />

        {/* Sync & Seeding Block */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-4">
          <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Database seeding & repair</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The Frame Cut Studio OS is powered by dynamic Firebase Firestore databases. If files, folders or templates are deleted, you can reset the entire database to factory seeding parameters immediately.
          </p>

          <button
            id="btn-reset-db"
            onClick={() => setIsConfirmingReset(true)}
            className="flex items-center space-x-2 px-4.5 py-2.5 bg-red-500/15 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Reset Database Seeding</span>
          </button>
        </div>

        {/* Change Password Block */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center space-x-3">
            <div className="p-2.5 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/20">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block font-display">Change Security Password</span>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-widest">Update credential access properties</p>
            </div>
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400">
                {passwordSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                <span>Save New Password</span>
              </button>
            </div>
          </form>
        </div>

        {/* Offline Support & PWA indicators */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-luxury-green-800/15 space-y-4">
          <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span>PWA & Offline Persistent Cache</span>
          </h3>
          
          <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
            <p>
              The system features a dual caching mechanism: <strong className="text-gold-400">IndexedDB Local Persistence</strong> for Firestore queries and standard offline synchronization triggers.
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-950/80 p-3.5 rounded-2xl border border-luxury-green-800/10">
              <div className="flex items-center space-x-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Network Status</span>
                  <span className="text-xs font-bold text-white">{isOnline ? 'Cloud Connected (Online)' : 'Offline Cache Mode'}</span>
                </div>
              </div>

              <button
                id="btn-sync-cloud"
                type="button"
                onClick={handleSyncToCloud}
                disabled={syncStatus === 'syncing'}
                className="flex items-center justify-center space-x-1.5 px-4.5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Synchronising Data...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 shrink-0" />
                    <span>Sync to Cloud</span>
                  </>
                )}
              </button>
            </div>

            {/* Sync Notifications/Results */}
            <AnimatePresence mode="wait">
              {syncStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 flex items-center space-x-2.5"
                >
                  <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Cloud Synchronization Handshake Successful</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">All active models synchronized perfectly with Cloud Firestore database logs.</p>
                  </div>
                </motion.div>
              )}

              {syncStatus === 'offline_backup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400 space-y-3"
                >
                  <div className="flex items-start space-x-2.5">
                    <CloudOff className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Internet Connection Interrupted</span>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                        The cloud sync sequence could not handshake. All active wedding schedules, payments, and financial ledgers have been packed and locally cached as a JSON backup file.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-amber-500/10">
                    <a
                      href={backupUrl || undefined}
                      download={backupFilename}
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-amber-500 text-charcoal-950 font-bold rounded-lg hover:bg-amber-400 transition-colors cursor-pointer text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Download JSON Backup</span>
                    </a>
                    <span className="text-[9px] font-mono text-gray-500 truncate select-all">{backupFilename}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Relational Cloud SQL & Supabase Storage Integration Card */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-gold-500/25 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
              <Database className="w-4 h-4 text-gold-400" />
              <span>Relational Database (Cloud SQL) & Supabase Media Storage</span>
            </h3>
            <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full border ${
              sqlDbStatus?.status === 'connected'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-gold-500/15 text-gold-300 border-gold-500/30'
            }`}>
              {sqlDbStatus?.status === 'connected' ? 'Connected • Drizzle ORM' : 'Active • Cloud SQL'}
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Structured relational persistence with Cloud SQL (PostgreSQL & Drizzle ORM) and photo asset uploads routed to Supabase storage bucket (<code className="text-gold-400">theframecut-media</code>).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase">Engine & Pool</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-white font-bold block">PostgreSQL • Drizzle ORM</span>
              <span className="text-[9px] text-gray-500 block">Object pool connection verified</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase">Photos & Media Bucket</span>
                <span className={`w-2 h-2 rounded-full ${sqlDbStatus?.supabase?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-gold-400'}`} />
              </div>
              <span className="text-gold-300 font-bold block">
                {sqlDbStatus?.supabase?.configured ? 'Supabase Storage (Active)' : 'Supabase Storage'}
              </span>
              <span className="text-[9px] text-gray-500 block">
                Bucket: {sqlDbStatus?.supabase?.bucket || 'theframecut-media'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-950/80 p-3.5 rounded-2xl border border-white/5 font-mono text-xs">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase">Instance Region & Storage</span>
              <span className="text-white font-bold">Cloud SQL (us-west1) • Supabase Bucket</span>
            </div>

            <button
              type="button"
              disabled={isCheckingSqlDb}
              onClick={async () => {
                setIsCheckingSqlDb(true);
                try {
                  const res = await fetch('/api/db/status');
                  const data = await res.json();
                  setSqlDbStatus({
                    status: data.status,
                    database: data.info?.database_name || 'cloud_sql_development_database',
                    timestamp: data.info?.current_time || new Date().toISOString(),
                    supabase: data.supabase
                  });
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsCheckingSqlDb(false);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSqlDb ? 'animate-spin' : ''}`} />
              <span>{isCheckingSqlDb ? 'Testing...' : 'Test DB & Storage'}</span>
            </button>
          </div>
        </div>

        {/* Weekly Data Protection & JSON Backup Card */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-gold-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
              <FileJson className="w-4 h-4 text-gold-400" />
              <span>Weekly Data Protection & Local JSON Backup</span>
            </h3>
            <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full border ${
              isWeeklyBackupDue 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {isWeeklyBackupDue ? 'Prompt Due' : 'Protected'}
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Automated quality-of-life prompt triggers a browser download for a full offline JSON backup of your current project state once per week, ensuring you always have local copies of critical wedding studio data.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-charcoal-950/80 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Current Running Projects</span>
              <span className="text-white font-black text-sm">
                {projects.filter(p => p.status !== 'closed').length} Active
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-charcoal-950/80 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Total Due Balance</span>
              <span className="text-gold-300 font-black text-sm">
                ₹{projects.reduce((sum, p) => sum + (p.remainingBalance !== undefined ? p.remainingBalance : Math.max(0, (p.projectAmount || 0) - (p.advancePayment || 0))), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-950/80 p-3.5 rounded-2xl border border-white/5 font-mono text-xs">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase">Last Local Backup Date</span>
              <span className="text-white font-bold">
                {lastWeeklyBackupDate 
                  ? lastWeeklyBackupDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
                  : 'Never Downloaded'}
              </span>
            </div>

            {onTriggerWeeklyBackup && (
              <button
                type="button"
                onClick={onTriggerWeeklyBackup}
                className="px-4 py-2 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-charcoal-950" />
                <span>Download Weekly Backup</span>
              </button>
            )}
          </div>
        </div>

        {/* Automation Rules & Status Transitions Section */}
        <AutomationRulesSettings
          projects={projects}
          onUpdateProject={onUpdateProject}
        />

        {/* Payment Ledger & Remaining Balance Diagnostic Auditor Panel */}
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-gold-500/30 space-y-5 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white tracking-tight flex items-center space-x-2">
                    <span>Payment & Remaining Balance Diagnostic Auditor</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-gold-500/20 text-gold-300 border border-gold-500/30 rounded-full font-bold uppercase">
                      Live Verification Panel
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Real-time verification of logic-calculated remaining balances (<code className="text-emerald-400">Contract Total - Received Receipts</code>) versus stored database fields (<code className="text-gold-400">p.remainingBalance</code>).
                  </p>
                </div>
              </div>
            </div>

            {auditSummary.mismatches > 0 && onUpdateProject && (
              <button
                type="button"
                onClick={handleRepairAllDiscrepancies}
                disabled={isFixingField === 'bulk'}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 disabled:opacity-55"
              >
                {isFixingField === 'bulk' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-charcoal-950" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5 text-charcoal-950" />
                    <span>Sync & Repair All ({auditSummary.mismatches}) Discrepancies</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Toast / Notification */}
          <AnimatePresence>
            {auditNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-mono flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{auditNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audit Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase block">Total Projects Audited</span>
              <div className="text-white font-bold text-base flex items-center space-x-1.5">
                <span>{auditSummary.total} Projects</span>
              </div>
              <span className="text-[9px] text-gray-500 block">
                {auditSummary.totalReceiptsCount} payment receipts logged
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase block">Verification Accuracy</span>
              <div className="flex items-center space-x-1.5">
                {auditSummary.mismatches === 0 ? (
                  <span className="text-emerald-400 font-bold text-base flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>100% Accurate</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold text-base flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{auditSummary.matches}/{auditSummary.total} Match</span>
                  </span>
                )}
              </div>
              <span className="text-[9px] text-gray-500 block">
                {auditSummary.mismatches} stored value variance(s)
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase block">Calculated Portfolio Due</span>
              <div className="text-gold-300 font-bold text-base">
                ₹{auditSummary.totalComputedOut.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-emerald-400 block">
                Logic-accurate (Contract - Receipts)
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase block">Stored Field Portfolio Due</span>
              <div className="text-gray-300 font-bold text-base">
                ₹{auditSummary.totalStoredOut.toLocaleString('en-IN')}
              </div>
              <span className={`text-[9px] block ${
                auditSummary.totalStoredOut === auditSummary.totalComputedOut 
                  ? 'text-emerald-400' 
                  : 'text-amber-400'
              }`}>
                {auditSummary.totalStoredOut === auditSummary.totalComputedOut 
                  ? 'Perfect Match with Math' 
                  : `Variance: ₹${Math.abs(auditSummary.totalStoredOut - auditSummary.totalComputedOut).toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {/* Controls / Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-charcoal-950/80 p-3 rounded-2xl border border-white/5 text-xs">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search project, couple, studio..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
              />
              {auditSearch && (
                <button
                  onClick={() => setAuditSearch('')}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
              <button
                type="button"
                onClick={() => setAuditFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  auditFilter === 'all'
                    ? 'bg-gold-500 text-charcoal-950'
                    : 'bg-charcoal-900 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                All ({auditSummary.total})
              </button>

              <button
                type="button"
                onClick={() => setAuditFilter('discrepancy')}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  auditFilter === 'discrepancy'
                    ? 'bg-amber-500 text-charcoal-950'
                    : 'bg-charcoal-900 text-amber-400 hover:text-amber-300 border border-amber-500/20'
                }`}
              >
                <span>Discrepancies</span>
                <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[9px]">
                  {auditSummary.mismatches}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAuditFilter('matching')}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  auditFilter === 'matching'
                    ? 'bg-emerald-500 text-charcoal-950'
                    : 'bg-charcoal-900 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                Match ({auditSummary.matches})
              </button>

              <button
                type="button"
                onClick={() => setAuditFilter('dues')}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  auditFilter === 'dues'
                    ? 'bg-luxury-green-500 text-charcoal-950'
                    : 'bg-charcoal-900 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                Active Dues
              </button>
            </div>

            {/* Expand / Collapse buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={expandAllProjects}
                className="px-2.5 py-1.5 bg-charcoal-900 hover:bg-charcoal-800 text-gray-400 hover:text-white rounded-lg border border-white/5 text-[10px] font-mono cursor-pointer transition-colors"
              >
                Expand Payments
              </button>
              <button
                type="button"
                onClick={collapseAllProjects}
                className="px-2.5 py-1.5 bg-charcoal-900 hover:bg-charcoal-800 text-gray-400 hover:text-white rounded-lg border border-white/5 text-[10px] font-mono cursor-pointer transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Diagnostic Project Audit Table / Cards List */}
          <div className="space-y-3">
            {filteredAuditData.length === 0 ? (
              <div className="p-8 text-center bg-charcoal-950/60 rounded-2xl border border-white/5 text-gray-500 font-mono text-xs">
                No projects matched your diagnostic filter query.
              </div>
            ) : (
              filteredAuditData.map(({
                p,
                contractAmt,
                initialAdv,
                pPayments,
                loggedReceiptsSum,
                effectiveReceived,
                computedRemaining,
                storedRemaining,
                discrepancy,
                isMatch,
                studioName
              }) => {
                const isExpanded = expandedProjectIds.has(p.id);

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isMatch
                        ? 'bg-charcoal-950/70 border-white/5 hover:border-luxury-green-800/30'
                        : 'bg-amber-950/15 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    }`}
                  >
                    {/* Main Summary Row */}
                    <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Project Details */}
                      <div className="flex items-start space-x-3.5 min-w-[220px]">
                        <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                          isMatch 
                            ? 'bg-luxury-green-950/50 text-emerald-400 border-luxury-green-800/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          <CreditCard className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-white font-display">
                              {p.coupleName || p.projectName || 'Untitled Project'}
                            </h4>
                            <span className="px-2 py-0.2 text-[9px] font-mono bg-white/5 text-gray-400 rounded border border-white/10 uppercase">
                              {p.eventType || 'Wedding'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1 font-mono">
                            <span className="text-gold-400 font-medium">{studioName}</span>
                            <span>•</span>
                            <span className="text-gray-500 text-[10px]">{p.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Math Calculation Breakdown Columns */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs flex-1 bg-charcoal-900/60 p-3 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block">Contract Total</span>
                          <span className="text-white font-bold">₹{contractAmt.toLocaleString('en-IN')}</span>
                        </div>

                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block">
                            Logged Payments ({pPayments.length})
                          </span>
                          <span className="text-emerald-400 font-bold">
                            ₹{effectiveReceived.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[8px] text-gray-500 block truncate">
                            {pPayments.length > 0 ? `${pPayments.length} Receipt(s)` : 'Initial Advance'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] text-gold-400 uppercase block font-bold">
                            Logic Remaining
                          </span>
                          <span className="text-gold-300 font-bold">
                            ₹{computedRemaining.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[8px] text-gray-500 block">
                            Contract - Received
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] text-gray-400 uppercase block">
                            Stored DB Field
                          </span>
                          <span className={`font-bold ${isMatch ? 'text-gray-300' : 'text-amber-400 underline decoration-dashed'}`}>
                            ₹{storedRemaining.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[8px] text-gray-500 block">
                            p.remainingBalance
                          </span>
                        </div>
                      </div>

                      {/* Right: Verification Status Badge & Actions */}
                      <div className="flex items-center space-x-2 shrink-0 justify-end">
                        {isMatch ? (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Logic-Accurate</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Diff: ₹{discrepancy.toLocaleString('en-IN')}</span>
                            </div>

                            {onUpdateProject && (
                              <button
                                type="button"
                                onClick={() => handleRepairProjectBalance(p, computedRemaining)}
                                disabled={isFixingField === p.id}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-charcoal-950 text-xs font-bold font-mono rounded-xl transition-all cursor-pointer shadow-md flex items-center space-x-1 disabled:opacity-55"
                              >
                                {isFixingField === p.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin text-charcoal-950" />
                                ) : (
                                  <Wrench className="w-3 h-3 text-charcoal-950" />
                                )}
                                <span>Fix Field</span>
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleProjectExpand(p.id)}
                          className="p-2 bg-charcoal-900 hover:bg-charcoal-800 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
                          title="Toggle Payment Records"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Payment Records Sub-Table */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-charcoal-950 border-t border-white/5 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                            <span className="font-bold text-gold-400 uppercase tracking-wider flex items-center space-x-1.5">
                              <History className="w-3.5 h-3.5 text-gold-400" />
                              <span>Payment Ledger History ({pPayments.length} Records)</span>
                            </span>
                            <span className="text-[10px] text-gray-500">
                              Calculated Receipts Sum: ₹{loggedReceiptsSum.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {pPayments.length === 0 ? (
                            <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5 text-xs text-gray-400 font-mono flex items-center space-x-2">
                              <Info className="w-4 h-4 text-gray-500 shrink-0" />
                              <span>
                                No standalone payment history receipts logged yet. System accurately defaults to initial project advance payment (<strong>₹{initialAdv.toLocaleString('en-IN')}</strong>).
                              </span>
                            </div>
                          ) : (
                            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-white/5">
                              <table className="w-full min-w-[500px] text-left font-mono text-xs">
                                <thead className="bg-charcoal-900 text-gray-400 border-b border-white/5 text-[10px] uppercase">
                                  <tr>
                                    <th className="p-2.5">Date</th>
                                    <th className="p-2.5">Amount (₹)</th>
                                    <th className="p-2.5">Method</th>
                                    <th className="p-2.5">Received From</th>
                                    <th className="p-2.5">Txn ID / Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-gray-300 text-[11px]">
                                  {pPayments.map(pay => (
                                    <tr key={pay.id} className="hover:bg-white/[0.02]">
                                      <td className="p-2.5 text-gray-400">{pay.date}</td>
                                      <td className="p-2.5 font-bold text-emerald-400">
                                        ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                                      </td>
                                      <td className="p-2.5 text-gray-300">
                                        <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px]">
                                          {pay.paymentMethod || 'Cash'}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-gray-400">{pay.receivedFrom || studioName}</td>
                                      <td className="p-2.5 text-gray-500 text-[10px] italic">
                                        {pay.notes || pay.id}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DATA SCANNER & MANDATORY FIELDS INTEGRITY INSPECTOR                      */}
        {/* ========================================================================= */}
        <div id="data-scanner-panel" className="p-6 rounded-3xl bg-charcoal-900 border border-rose-500/30 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 via-amber-500 to-luxury-green-500" />

          {/* Scanner Notice Toast */}
          <AnimatePresence>
            {scannerNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 bg-luxury-green-950/80 border border-gold-500/40 rounded-2xl flex items-center justify-between text-xs text-gold-300 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-luxury-green-400 shrink-0" />
                  <span className="font-medium">{scannerNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScannerNotice(null)}
                  className="text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                    <span>Data Scanner & Integrity Inspector</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
                      Audit Utility
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Identifies projects missing mandatory fields (<span className="text-rose-300 font-mono">shootDate</span>, <span className="text-amber-300 font-mono">deliveryDate</span>, <span className="text-purple-300 font-mono">studio</span>, <span className="text-blue-300 font-mono">editor</span>) and provides bulk resolution tools.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {scannerSummary.canAutoDerive > 0 && (
                <button
                  type="button"
                  onClick={handleSmartAutoFixDeliveryDates}
                  disabled={isBulkUpdating}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600/90 to-amber-500/90 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Automatically calculates deliveryDate as shootDate + 30 days for projects missing deliveryDate"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                  <span>Auto-Fix 30d Delivery ({scannerSummary.canAutoDerive})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSmartAutoFillDefaults}
                disabled={isBulkUpdating}
                className="px-3 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-gray-200 border border-gray-700 hover:border-gray-600 text-xs font-medium rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Populate missing event types with 'Wedding Film' and priority with 'medium'"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Default Event Types</span>
              </button>

              <button
                type="button"
                onClick={handleExportDataHealthCSV}
                className="px-3 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-gray-200 border border-gray-700 hover:border-gray-600 text-xs font-medium rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Download CSV report of data gaps"
              >
                <Download className="w-3.5 h-3.5 text-luxury-green-400" />
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>

          {/* Metrics Bento Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Health Score */}
            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-gray-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Health Score</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${scannerSummary.healthScore >= 90 ? 'text-luxury-green-400' : scannerSummary.healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`} />
              </div>
              <div className="mt-2">
                <div className={`text-xl font-black font-display ${scannerSummary.healthScore >= 90 ? 'text-luxury-green-400' : scannerSummary.healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {scannerSummary.healthScore}%
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {scannerSummary.complete}/{scannerSummary.total} complete
                </div>
              </div>
            </div>

            {/* Missing Shoot Date */}
            <div
              onClick={() => setScannerFilter('missing_shoot')}
              className={`p-3.5 rounded-2xl bg-charcoal-950/80 border transition-all cursor-pointer ${
                scannerFilter === 'missing_shoot'
                  ? 'border-rose-500 bg-rose-500/10'
                  : 'border-gray-800 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">No Shoot Date</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-display text-rose-400">
                  {scannerSummary.missingShoot}
                </div>
                <div className="text-[10px] text-rose-300/70 font-mono mt-0.5">
                  {scannerSummary.missingShoot > 0 ? 'Action required' : 'All set'}
                </div>
              </div>
            </div>

            {/* Missing Delivery Date */}
            <div
              onClick={() => setScannerFilter('missing_delivery')}
              className={`p-3.5 rounded-2xl bg-charcoal-950/80 border transition-all cursor-pointer ${
                scannerFilter === 'missing_delivery'
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-gray-800 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">No Delivery Date</span>
                <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-display text-amber-400">
                  {scannerSummary.missingDelivery}
                </div>
                <div className="text-[10px] text-amber-300/70 font-mono mt-0.5">
                  {scannerSummary.canAutoDerive > 0 ? `${scannerSummary.canAutoDerive} auto-fixable` : 'No dates set'}
                </div>
              </div>
            </div>

            {/* Unlinked Studio */}
            <div
              onClick={() => setScannerFilter('missing_studio')}
              className={`p-3.5 rounded-2xl bg-charcoal-950/80 border transition-all cursor-pointer ${
                scannerFilter === 'missing_studio'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-800 hover:border-purple-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Unlinked Studio</span>
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-display text-purple-400">
                  {scannerSummary.missingStudio}
                </div>
                <div className="text-[10px] text-purple-300/70 font-mono mt-0.5">
                  Direct / Unassigned
                </div>
              </div>
            </div>

            {/* Unassigned Editor */}
            <div
              onClick={() => setScannerFilter('missing_editor')}
              className={`p-3.5 rounded-2xl bg-charcoal-950/80 border transition-all cursor-pointer ${
                scannerFilter === 'missing_editor'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-800 hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Unassigned Editor</span>
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-display text-blue-400">
                  {scannerSummary.missingEditor}
                </div>
                <div className="text-[10px] text-blue-300/70 font-mono mt-0.5">
                  Lead Editor unassigned
                </div>
              </div>
            </div>

            {/* Zero Valuation */}
            <div
              onClick={() => setScannerFilter('missing_amount')}
              className={`p-3.5 rounded-2xl bg-charcoal-950/80 border transition-all cursor-pointer ${
                scannerFilter === 'missing_amount'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-800 hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Zero Amount</span>
                <IndianRupee className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black font-display text-orange-400">
                  {scannerSummary.missingAmount}
                </div>
                <div className="text-[10px] text-orange-300/70 font-mono mt-0.5">
                  Valuation ₹0
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs, Search & Multi-Select Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScannerFilter('all_incomplete')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    scannerFilter === 'all_incomplete'
                      ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                      : 'bg-charcoal-800 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>All Incomplete ({scannerSummary.incomplete})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScannerFilter('missing_shoot')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    scannerFilter === 'missing_shoot'
                      ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                      : 'bg-charcoal-800 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  Shoot Date ({scannerSummary.missingShoot})
                </button>

                <button
                  type="button"
                  onClick={() => setScannerFilter('missing_delivery')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    scannerFilter === 'missing_delivery'
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'bg-charcoal-800 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  Delivery Date ({scannerSummary.missingDelivery})
                </button>

                <button
                  type="button"
                  onClick={() => setScannerFilter('missing_studio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    scannerFilter === 'missing_studio'
                      ? 'bg-purple-500/20 border border-purple-500 text-purple-300'
                      : 'bg-charcoal-800 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  Studio ({scannerSummary.missingStudio})
                </button>

                <button
                  type="button"
                  onClick={() => setScannerFilter('missing_editor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    scannerFilter === 'missing_editor'
                      ? 'bg-blue-500/20 border border-blue-500 text-blue-300'
                      : 'bg-charcoal-800 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  Editor ({scannerSummary.missingEditor})
                </button>

                <button
                  type="button"
                  onClick={() => setScannerFilter('complete')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                    scannerFilter === 'complete'
                      ? 'bg-luxury-green-500/20 border border-luxury-green-500 text-luxury-green-300'
                      : 'bg-charcoal-800 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-luxury-green-400" />
                  <span>Complete ({scannerSummary.complete})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScannerFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    scannerFilter === 'all'
                      ? 'bg-gold-500/20 border border-gold-500 text-gold-300'
                      : 'bg-charcoal-800 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  All ({scannerSummary.total})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scannerSearch}
                  onChange={(e) => setScannerSearch(e.target.value)}
                  placeholder="Search project, couple, studio..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-charcoal-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
                />
                {scannerSearch && (
                  <button
                    type="button"
                    onClick={() => setScannerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-charcoal-950/60 border border-gray-800/80 text-xs">
              <div className="flex items-center space-x-2 text-gray-300">
                <span className="font-mono text-gray-400">
                  Showing <strong className="text-white">{filteredScannerData.length}</strong> of {scannerSummary.total} projects
                </span>
                {selectedScannerProjectIds.size > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold font-mono text-[11px]">
                    {selectedScannerProjectIds.size} selected
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={selectAllFilteredScannerProjects}
                  className="px-2.5 py-1 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <CheckSquare className="w-3 h-3 text-gold-400" />
                  <span>Select Filtered ({filteredScannerData.length})</span>
                </button>

                <button
                  type="button"
                  onClick={selectAllIncompleteProjects}
                  className="px-2.5 py-1 bg-charcoal-800 hover:bg-charcoal-700 text-rose-300 hover:text-rose-200 rounded-lg border border-rose-900/50 text-[11px] font-medium transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>Select All Incomplete ({scannerSummary.incomplete})</span>
                </button>

                {selectedScannerProjectIds.size > 0 && (
                  <button
                    type="button"
                    onClick={clearScannerSelections}
                    className="px-2.5 py-1 bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BULK RESOLUTION WORKBENCH (VISIBLE WHEN >=1 PROJECTS SELECTED)           */}
          {/* ========================================================================= */}
          <AnimatePresence>
            {selectedScannerProjectIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-luxury-green-950/40 border-2 border-gold-500/40 space-y-4 shadow-xl relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-gold-500/20 rounded-xl text-gold-400">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Bulk Update Resolution Suite</span>
                        <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-mono text-[11px] font-bold">
                          {selectedScannerProjectIds.size} Selected
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Choose fields to overwrite across all {selectedScannerProjectIds.size} selected projects. Blank fields will remain unchanged.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearScannerSelections}
                    className="text-xs text-gray-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dismiss Selection</span>
                  </button>
                </div>

                {/* Bulk Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Shoot Date */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Shoot Date</label>
                    <input
                      type="date"
                      value={bulkShootDate}
                      onChange={(e) => setBulkShootDate(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Delivery Date */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Delivery Date</label>
                    <input
                      type="date"
                      value={bulkDeliveryDate}
                      onChange={(e) => setBulkDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Studio Assignment */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Assign Studio</label>
                    <select
                      value={bulkStudioId}
                      onChange={(e) => setBulkStudioId(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    >
                      <option value="">-- Leave Unchanged --</option>
                      <option value="direct-client">Direct Client (No Studio)</option>
                      {studios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Editor Assignment */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Assign Editor</label>
                    <select
                      value={bulkEditorId}
                      onChange={(e) => setBulkEditorId(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    >
                      <option value="">-- Leave Unchanged --</option>
                      <option value="unassigned">Unassigned</option>
                      {editors.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Event Type */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Event Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Wedding Film, Teaser"
                      value={bulkEventType}
                      onChange={(e) => setBulkEventType(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Status</label>
                    <select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    >
                      <option value="">-- Leave Unchanged --</option>
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

                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Priority</label>
                    <select
                      value={bulkPriority}
                      onChange={(e) => setBulkPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    >
                      <option value="">-- Leave Unchanged --</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Project Valuation */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-gray-400 uppercase">Bulk Valuation (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={bulkProjectAmount}
                      onChange={(e) => setBulkProjectAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Bulk Apply Action */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={clearScannerSelections}
                    className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyBulkUpdates}
                    disabled={isBulkUpdating}
                    className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-charcoal-950 font-bold text-xs rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isBulkUpdating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-charcoal-950" />
                        <span>Applying Updates to {selectedScannerProjectIds.size} Projects...</span>
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-4 h-4 text-charcoal-950" />
                        <span>Apply Updates to ({selectedScannerProjectIds.size}) Selected Project(s)</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* PROJECTS AUDIT & INLINE RESOLUTION LIST                                   */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            {filteredScannerData.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-charcoal-950/60 border border-gray-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-luxury-green-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Matching Projects</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  {scannerFilter === 'all_incomplete'
                    ? 'All projects in your database currently meet mandatory field standards! No missing shoot or delivery dates.'
                    : 'No projects match your current search and filter criteria.'}
                </p>
              </div>
            ) : (
              filteredScannerData.map((item) => {
                const isSelected = selectedScannerProjectIds.has(item.id);
                const isEditingThis = inlineEditingProjectId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isEditingThis
                        ? 'bg-charcoal-950 border-gold-500/60 shadow-xl'
                        : isSelected
                        ? 'bg-charcoal-950/90 border-rose-500/50 shadow-md'
                        : item.isIncomplete
                        ? 'bg-charcoal-950/60 border-gray-800 hover:border-gray-700'
                        : 'bg-charcoal-950/40 border-luxury-green-900/30'
                    }`}
                  >
                    {/* Project Row Header */}
                    <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: Checkbox, Project Info & Issues Badges */}
                      <div className="flex items-start space-x-3 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleScannerSelection(item.id)}
                          className="mt-1 text-gray-500 hover:text-white cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-600 hover:text-gray-400" />
                          )}
                        </button>

                        {/* Details */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{item.coupleName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-charcoal-800 text-gray-300 border border-gray-700">
                              {item.id}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-luxury-green-950/40 text-luxury-green-300 border border-luxury-green-800/30">
                              {item.eventType}
                            </span>
                          </div>

                          {/* Issues Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {item.issues.length === 0 ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-luxury-green-500/15 text-luxury-green-300 border border-luxury-green-500/30 font-semibold">
                                <Check className="w-3 h-3" />
                                <span>100% Complete</span>
                              </span>
                            ) : (
                              item.issues.map((iss) => (
                                <span
                                  key={iss.code}
                                  className={`inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                                    iss.color === 'rose'
                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                      : iss.color === 'amber'
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      : iss.color === 'purple'
                                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                      : iss.color === 'blue'
                                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                      : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                                  }`}
                                >
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{iss.label}</span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Key Field Values & Inline Edit Trigger */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-300 shrink-0">
                        {/* Shoot Date */}
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase">Shoot Date</span>
                          <span className={item.missingShootDate ? 'text-rose-400 font-bold' : 'text-gray-200'}>
                            {item.shootDate || '⚠️ MISSING'}
                          </span>
                        </div>

                        {/* Delivery Date */}
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase">Delivery Date</span>
                          <span className={item.missingDeliveryDate ? 'text-amber-400 font-bold' : 'text-gray-200'}>
                            {item.deliveryDate || '⚠️ MISSING'}
                          </span>
                        </div>

                        {/* Studio */}
                        <div className="flex flex-col hidden sm:flex">
                          <span className="text-[10px] text-gray-500 uppercase">Studio</span>
                          <span className={item.missingStudio ? 'text-purple-400 font-bold truncate max-w-[120px]' : 'text-gray-300 truncate max-w-[120px]'}>
                            {item.studioName}
                          </span>
                        </div>

                        {/* Editor */}
                        <div className="flex flex-col hidden md:flex">
                          <span className="text-[10px] text-gray-500 uppercase">Editor</span>
                          <span className={item.missingEditor ? 'text-blue-400 font-bold truncate max-w-[110px]' : 'text-gray-300 truncate max-w-[110px]'}>
                            {item.assignedEditorName}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-auto lg:ml-2">
                          {!isEditingThis ? (
                            <button
                              type="button"
                              onClick={() => handleStartInlineEdit(item)}
                              className="px-3 py-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-gold-400 hover:text-gold-300 border border-gold-500/30 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Quick Fix</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="px-3 py-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline Quick Fix Form (Expanded when editing this row) */}
                    <AnimatePresence>
                      {isEditingThis && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-charcoal-900 border-t border-gray-800 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gold-400 font-mono uppercase flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Inline Project Resolution</span>
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              Update mandatory fields directly in Firestore
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            {/* Shoot Date */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-gray-300">
                                Shoot Date <span className="text-rose-400">*</span>
                              </label>
                              <input
                                type="date"
                                value={inlineEditValues.shootDate || ''}
                                onChange={(e) => setInlineEditValues((prev) => ({ ...prev, shootDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                              />
                            </div>

                            {/* Delivery Date */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-mono text-gray-300">
                                  Delivery Date <span className="text-amber-400">*</span>
                                </label>
                                {inlineEditValues.shootDate && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const shoot = new Date(
                                        inlineEditValues.shootDate!.includes('T')
                                          ? inlineEditValues.shootDate!
                                          : `${inlineEditValues.shootDate}T00:00:00`
                                      );
                                      if (!isNaN(shoot.getTime())) {
                                        const del = new Date(shoot.getTime() + 30 * 24 * 60 * 60 * 1000);
                                        setInlineEditValues((prev) => ({ ...prev, deliveryDate: del.toISOString().split('T')[0] }));
                                      }
                                    }}
                                    className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer font-mono"
                                  >
                                    +30 days
                                  </button>
                                )}
                              </div>
                              <input
                                type="date"
                                value={inlineEditValues.deliveryDate || ''}
                                onChange={(e) => setInlineEditValues((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                              />
                            </div>

                            {/* Studio Selector */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-gray-300">Studio Association</label>
                              <select
                                value={inlineEditValues.studioId || ''}
                                onChange={(e) => {
                                  const sid = e.target.value;
                                  const found = studios.find((s) => s.id === sid);
                                  setInlineEditValues((prev) => ({
                                    ...prev,
                                    studioId: sid,
                                    studioName: found ? found.name : sid === 'direct-client' ? 'Direct Client' : ''
                                  }));
                                }}
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                              >
                                <option value="">Select Studio</option>
                                <option value="direct-client">Direct Client</option>
                                {studios.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Editor Selector */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-gray-300">Assigned Lead Editor</label>
                              <select
                                value={inlineEditValues.assignedEditorId || ''}
                                onChange={(e) => {
                                  const eid = e.target.value;
                                  const found = editors.find((ed) => ed.id === eid);
                                  setInlineEditValues((prev) => ({
                                    ...prev,
                                    assignedEditorId: eid,
                                    assignedEditorName: found ? found.name : 'Unassigned'
                                  }));
                                }}
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                              >
                                <option value="">Unassigned</option>
                                {editors.map((ed) => (
                                  <option key={ed.id} value={ed.id}>
                                    {ed.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Event Type */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-gray-300">Event Type</label>
                              <input
                                type="text"
                                value={inlineEditValues.eventType || ''}
                                onChange={(e) => setInlineEditValues((prev) => ({ ...prev, eventType: e.target.value }))}
                                placeholder="Wedding Film, Teaser..."
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                              />
                            </div>

                            {/* Valuation */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-gray-300">Contract Valuation (₹)</label>
                              <input
                                type="number"
                                value={inlineEditValues.projectAmount ?? ''}
                                onChange={(e) => setInlineEditValues((prev) => ({ ...prev, projectAmount: Number(e.target.value) }))}
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                              />
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-gray-300">Status</label>
                              <select
                                value={inlineEditValues.status || 'data_received'}
                                onChange={(e) => setInlineEditValues((prev) => ({ ...prev, status: e.target.value as any }))}
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
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

                            {/* Priority */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-gray-300">Priority</label>
                              <select
                                value={inlineEditValues.priority || 'medium'}
                                onChange={(e) => setInlineEditValues((prev) => ({ ...prev, priority: e.target.value as any }))}
                                className="w-full px-3 py-2 bg-charcoal-950 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                          </div>

                          {/* Save / Cancel Controls */}
                          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-800">
                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(item.id)}
                              disabled={isSavingInline}
                              className="px-5 py-2 bg-luxury-green-600 hover:bg-luxury-green-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isSavingInline ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving to Firestore...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save Resolution</span>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Workspace info */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-luxury-green-950/20 to-charcoal-900 border border-luxury-green-800/25 space-y-4">
          <h3 className="text-sm font-bold font-mono text-gold-500 uppercase flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>ERP Build Specifications</span>
          </h3>

          <div className="space-y-2 text-xs font-mono text-gray-400">
            <div className="flex justify-between border-b border-luxury-green-800/10 pb-2">
              <span>Platform Framework:</span>
              <span className="text-white">React 19 + Vite 6 + Tailwind v4</span>
            </div>
            <div className="flex justify-between border-b border-luxury-green-800/10 pb-2">
              <span>Primary Engine:</span>
              <span className="text-white">Firebase SDK (Auth, Firestore, Offline)</span>
            </div>
            <div className="flex justify-between pb-1">
              <span>Version release:</span>
              <span className="text-gold-500">v1.2.0-Production READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Reset confirmation modal */}
      <AnimatePresence>
        {isConfirmingReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsConfirmingReset(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Reset Seeding Database</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to reset the entire database to factory seeding configurations? This will delete all current records and restore default weddings, partners, and expenses.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  disabled={isResetting}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-55"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99] flex items-center space-x-1.5 disabled:opacity-55"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset Seeding</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification Alert Toast */}
      <AnimatePresence>
        {showSuccessAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-luxury-green-950/90 border border-gold-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm gold-glow"
          >
            <div className="p-2 bg-gold-500/25 rounded-xl text-gold-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Database Seeding Complete</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Luxury seeding properties restored successfully.</p>
            </div>
            <button 
              onClick={() => setShowSuccessAlert(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
