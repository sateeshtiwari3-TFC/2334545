import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, StudioInvoice, AppNotification, AutomationSettings, AutomationExecutionReport, CustomAutomationRule, ProjectStatus } from '../types';
import { parseDueDateToMs } from './deadlineRunner';
import { sendDeadlinePushNotification } from '../utils/browserNotifications';

export const DEFAULT_CUSTOM_STATUS_RULES: CustomAutomationRule[] = [
  {
    id: 'rule-folder-path-review',
    name: 'Move to Review when Delivery/Folder Path is Added',
    description: 'Automatically advances project to "Review" (Ready for Review) when an editor or studio provides a final export folder, Google Drive link, or deliverables path.',
    triggerEvent: 'folder_path_added',
    folderField: 'any_delivery_path',
    pathMatchPattern: '', // Matches any valid folder/link path
    targetStatus: 'review',
    enabled: true,
    autoNotify: true
  },
  {
    id: 'rule-editor-assigned-editing',
    name: 'Move to Editing when Editor is Assigned',
    description: 'Automatically transitions project from "Data Received" or "Assigned" to "Editing" once an editor is successfully allocated.',
    triggerEvent: 'editor_assigned',
    targetStatus: 'editing',
    enabled: true,
    autoNotify: true
  },
  {
    id: 'rule-raw-footage-received',
    name: 'Move to Data Received when Hard Disk / Raw Footage is Logged',
    description: 'Automatically sets status to "Data Received" when raw footage size or hard disk volume identifier is recorded.',
    triggerEvent: 'all_footage_received',
    targetStatus: 'data_received',
    enabled: true,
    autoNotify: false
  }
];

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  autoOverdueFlagging: true,
  autoTurnaroundDays: 21,
  autoDeliveryDateCalc: true,
  autoArchiveDeliveredDays: 30,
  autoArchiveDeliveredEnabled: true,
  autoBalanceStatusCalc: true,
  autoPostShootPaymentTrigger: true,
  autoInvoiceNumberPrefix: 'TFC',
  autoInvoiceNumberEnabled: true,
  autoWhatsAppRemindersEnabled: true,
  autoEditorDeadlineHours: 24,
  autoBackupWeeklyPrompt: true,
  rulesRunCount: 0,
  customStatusRules: DEFAULT_CUSTOM_STATUS_RULES
};

const STORAGE_KEY = 'tfc_automation_settings';
const INVOICE_COUNTER_KEY = 'tfc_invoice_seq_counter';

/**
 * Loads current automation settings from localStorage or defaults
 */
export function getAutomationSettings(): AutomationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_AUTOMATION_SETTINGS, 
        ...parsed,
        customStatusRules: Array.isArray(parsed.customStatusRules) && parsed.customStatusRules.length > 0
          ? parsed.customStatusRules
          : DEFAULT_CUSTOM_STATUS_RULES
      };
    }
  } catch (err) {
    console.error("Failed to load automation settings from storage:", err);
  }
  return { ...DEFAULT_AUTOMATION_SETTINGS };
}

/**
 * Saves updated automation settings to localStorage
 */
export function saveAutomationSettings(settings: AutomationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save automation settings to storage:", err);
  }
}

/**
 * Calculates delivery date based on shoot date and turnaround days
 */
export function calculateDeliveryDate(shootDateStr: string, turnaroundDays: number = 21): string {
  if (!shootDateStr) return '';
  try {
    // Handle YYYY-MM-DD or ISO
    const cleanDate = shootDateStr.includes('T') ? shootDateStr.split('T')[0] : shootDateStr;
    const parts = cleanDate.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + turnaroundDays);
      return d.toISOString().split('T')[0];
    }
  } catch {
    // Fallback
  }
  return '';
}

/**
 * Computes logical remaining balance and payment status from contract amount and advance
 */
export function calculateProjectBalance(projectAmount: number, advancePayment: number): {
  remainingBalance: number;
  paymentStatus: 'Full Payment' | 'Partial Payment' | 'Unpaid';
} {
  const amt = Math.max(0, Number(projectAmount) || 0);
  const adv = Math.max(0, Number(advancePayment) || 0);
  const remaining = Math.max(0, amt - adv);

  let paymentStatus: 'Full Payment' | 'Partial Payment' | 'Unpaid' = 'Unpaid';
  if (adv >= amt && amt > 0) {
    paymentStatus = 'Full Payment';
  } else if (adv > 0) {
    paymentStatus = 'Partial Payment';
  }

  return { remainingBalance: remaining, paymentStatus };
}

/**
 * Generates the next sequential invoice number (e.g. TFC-2026-0042)
 */
export function generateNextInvoiceNumber(prefix: string = 'TFC'): string {
  const year = new Date().getFullYear();
  let currentSeq = 1;
  try {
    const storedSeq = localStorage.getItem(INVOICE_COUNTER_KEY);
    if (storedSeq) {
      currentSeq = parseInt(storedSeq, 10) + 1;
    } else {
      currentSeq = 42; // standard starting offset
    }
    localStorage.setItem(INVOICE_COUNTER_KEY, currentSeq.toString());
  } catch {
    currentSeq = Math.floor(Math.random() * 900) + 100;
  }

  const paddedSeq = String(currentSeq).padStart(4, '0');
  const cleanPrefix = (prefix || 'TFC').toUpperCase().trim();
  return `${cleanPrefix}-${year}-${paddedSeq}`;
}

/**
 * Master Automation Suite Runner:
 * Executes all enabled automation rules across projects, invoices, and payment triggers.
 */
export async function runStudioAutomationSuite(
  projectsList?: Project[],
  invoicesList?: StudioInvoice[],
  notificationsList?: AppNotification[],
  customSettings?: AutomationSettings
): Promise<AutomationExecutionReport> {
  const settings = customSettings || getAutomationSettings();
  const now = new Date();
  const nowMs = now.getTime();
  const todayStr = now.toISOString().slice(0, 10);

  const report: AutomationExecutionReport = {
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    checkedProjectsCount: 0,
    overdueProjectsCount: 0,
    overdueInvoicesCount: 0,
    postShootRemindersCount: 0,
    autoArchivedProjectsCount: 0,
    balancesAuditedCount: 0,
    notificationsGenerated: 0,
    details: []
  };

  try {
    // 1. Load Projects if not supplied
    let projects: Project[] = [];
    if (projectsList && projectsList.length > 0) {
      projects = projectsList;
    } else {
      const snap = await getDocs(collection(db, 'projects'));
      snap.forEach(docSnap => {
        projects.push({ ...docSnap.data() as any, id: docSnap.id });
      });
    }
    report.checkedProjectsCount = projects.length;

    // 2. Load Invoices if not supplied
    let invoices: StudioInvoice[] = [];
    if (invoicesList && invoicesList.length > 0) {
      invoices = invoicesList;
    } else {
      try {
        const snap = await getDocs(collection(db, 'studioInvoices'));
        snap.forEach(docSnap => {
          invoices.push({ ...docSnap.data() as any, id: docSnap.id });
        });
      } catch (e) {
        console.warn("Could not load invoices for automation:", e);
      }
    }

    // 3. Load Notifications if not supplied
    let notifs: AppNotification[] = [];
    if (notificationsList) {
      notifs = notificationsList;
    } else {
      try {
        const snap = await getDocs(collection(db, 'notifications'));
        snap.forEach(docSnap => {
          notifs.push({ ...docSnap.data() as any, id: docSnap.id });
        });
      } catch (e) {
        console.warn("Could not load notifications for automation:", e);
      }
    }

    // ==============================================================
    // RULE 1: AUTO-FLAG OVERDUE PROJECTS & ESCALATE PRIORITY
    // ==============================================================
    if (settings.autoOverdueFlagging) {
      for (const p of projects) {
        // Skip closed or delivered
        if (p.status === 'closed' || p.status === 'delivered') continue;

        if (p.deliveryDate) {
          const dueMs = parseDueDateToMs(p.deliveryDate);
          if (dueMs && dueMs < nowMs) {
            // Project delivery date is past!
            report.overdueProjectsCount++;
            const daysOverdue = Math.max(1, Math.floor((nowMs - dueMs) / (1000 * 3600 * 24)));

            // Update in Firestore to 'high' priority if not high
            if (p.priority !== 'high') {
              try {
                await updateDoc(doc(db, 'projects', p.id), {
                  priority: 'high',
                  updatedAt: serverTimestamp()
                });
                report.details.push(`Escalated priority to HIGH for overdue project: "${p.coupleName || p.projectName}" (${daysOverdue}d late)`);
              } catch (err) {
                console.warn(`Could not update priority for ${p.id}:`, err);
              }
            }

            // Create deduplicated automated notification
            const dedupeId = `auto-overdue-${p.id}-${todayStr}`;
            const alreadyNotified = notifs.some(n => n.id === dedupeId || (n.projectId === p.id && n.title.includes('Overdue')));

            if (!alreadyNotified) {
              const notifTitle = `🚨 Overdue Project Alert: ${p.coupleName || p.projectName}`;
              const notifMsg = `Project "${p.coupleName || p.projectName}" (${p.studioName || 'Studio'}) was due on ${p.deliveryDate} and is ${daysOverdue} day(s) overdue. Please follow up with assigned editor!`;

              try {
                await setDoc(doc(db, 'notifications', dedupeId), {
                  id: dedupeId,
                  title: notifTitle,
                  message: notifMsg,
                  type: 'delivery_tomorrow',
                  projectId: p.id,
                  isAutomated: true,
                  read: false,
                  createdAt: serverTimestamp()
                }, { merge: true });

                report.notificationsGenerated++;
                sendDeadlinePushNotification(notifTitle, notifMsg, p.id);
                report.details.push(`Dispatched Overdue alert for "${p.coupleName || p.projectName}"`);
              } catch (err) {
                console.warn(`Failed writing overdue notif for ${p.id}:`, err);
              }
            }
          }
        }
      }
    }

    // ==============================================================
    // RULE 2: AUTO-FLAG OVERDUE INVOICES
    // ==============================================================
    for (const inv of invoices) {
      const payable = Number(inv.totalPayable || 0);
      if (inv.status === 'pending' && payable > 0) {
        const dueDate = inv.dueDate || inv.issuedDate || inv.date;
        if (dueDate) {
          const dueMs = parseDueDateToMs(dueDate);
          if (dueMs && dueMs < nowMs) {
            report.overdueInvoicesCount++;
            try {
              await updateDoc(doc(db, 'studioInvoices', inv.id), {
                status: 'overdue',
                updatedAt: serverTimestamp()
              });
              report.details.push(`Updated invoice status to OVERDUE for ${inv.invoiceNo || inv.id} (Studio: ${inv.studioName})`);
            } catch (err) {
              console.warn(`Failed marking invoice overdue ${inv.id}:`, err);
            }
          }
        }
      }
    }

    // ==============================================================
    // RULE 3: POST-SHOOT PAYMENT STAGE-2 TRIGGER
    // ==============================================================
    if (settings.autoPostShootPaymentTrigger) {
      for (const p of projects) {
        if (p.status === 'closed' || p.status === 'delivered') continue;

        const remBal = typeof p.remainingBalance === 'number'
          ? p.remainingBalance
          : Math.max(0, (Number(p.projectAmount) || 0) - (Number(p.advancePayment) || 0));

        if (remBal > 0 && p.shootDate) {
          const shootMs = parseDueDateToMs(p.shootDate);
          // If shoot date was completed (today is on or after shoot date)
          if (shootMs && shootMs <= nowMs) {
            const daysSinceShoot = Math.floor((nowMs - shootMs) / (1000 * 3600 * 24));
            // Trigger alert within 7 days after shoot
            if (daysSinceShoot >= 0 && daysSinceShoot <= 14) {
              report.postShootRemindersCount++;

              const dedupeId = `auto-post-shoot-${p.id}`;
              const alreadyNotified = notifs.some(n => n.id === dedupeId);

              if (!alreadyNotified) {
                const notifTitle = `💳 Post-Shoot Payment Due: ${p.coupleName || p.projectName}`;
                const notifMsg = `Shoot for "${p.coupleName || p.projectName}" was concluded ${daysSinceShoot === 0 ? 'today' : `${daysSinceShoot}d ago`}. Stage 2 billing is due (Pending: ₹${remBal.toLocaleString('en-IN')}). Send 1-click reminder via WhatsApp.`;

                try {
                  await setDoc(doc(db, 'notifications', dedupeId), {
                    id: dedupeId,
                    title: notifTitle,
                    message: notifMsg,
                    type: 'payment_pending',
                    projectId: p.id,
                    isAutomated: true,
                    read: false,
                    createdAt: serverTimestamp()
                  }, { merge: true });

                  report.notificationsGenerated++;
                  report.details.push(`Generated Stage-2 post-shoot payment alert for "${p.coupleName}"`);
                } catch (err) {
                  console.warn(`Failed writing post-shoot notif for ${p.id}:`, err);
                }
              }
            }
          }
        }
      }
    }

    // ==============================================================
    // RULE 4: AUTO-ARCHIVE / CLOSE DELIVERED PROJECTS
    // ==============================================================
    if (settings.autoArchiveDeliveredEnabled) {
      const archiveThresholdMs = settings.autoArchiveDeliveredDays * 24 * 3600 * 1000;

      for (const p of projects) {
        if (p.status === 'delivered') {
          // Check last updated or delivery date
          const refDateStr = p.deliveryDate || (p.updatedAt ? new Date(p.updatedAt).toISOString() : null);
          if (refDateStr) {
            const refMs = parseDueDateToMs(refDateStr);
            if (refMs && (nowMs - refMs) > archiveThresholdMs) {
              try {
                await updateDoc(doc(db, 'projects', p.id), {
                  status: 'closed',
                  archivedAt: serverTimestamp()
                });
                report.autoArchivedProjectsCount++;
                report.details.push(`Auto-archived delivered project after ${settings.autoArchiveDeliveredDays} days: "${p.coupleName || p.projectName}"`);
              } catch (err) {
                console.warn(`Failed auto-archiving project ${p.id}:`, err);
              }
            }
          }
        }
      }
    }

    // ==============================================================
    // RULE 5: AUTO-AUDIT & REPAIR REMAINING BALANCES
    // ==============================================================
    if (settings.autoBalanceStatusCalc) {
      for (const p of projects) {
        const contract = Number(p.projectAmount) || 0;
        const adv = Number(p.advancePayment) || 0;
        const correctRem = Math.max(0, contract - adv);

        if (p.remainingBalance !== correctRem && contract > 0) {
          try {
            await updateDoc(doc(db, 'projects', p.id), {
              remainingBalance: correctRem
            });
            report.balancesAuditedCount++;
            report.details.push(`Auto-repaired remaining balance for "${p.coupleName}": ₹${correctRem.toLocaleString('en-IN')}`);
          } catch (err) {
            console.warn(`Failed updating balance for ${p.id}:`, err);
          }
        }
      }
    }

    // ==============================================================
    // RULE 6: CUSTOM STATUS TRANSITION RULES (FOLDER PATHS, ETC.)
    // ==============================================================
    const statusRules = (settings.customStatusRules || DEFAULT_CUSTOM_STATUS_RULES).filter(r => r.enabled);
    if (statusRules.length > 0) {
      for (const p of projects) {
        // Skip closed projects
        if (p.status === 'closed') continue;

        for (const rule of statusRules) {
          // Check if already at or beyond this status
          if (p.status === rule.targetStatus) continue;

          let shouldTrigger = false;
          let matchedValue = '';

          if (rule.triggerEvent === 'folder_path_added') {
            const fField = rule.folderField || 'any_delivery_path';
            const triggerKeyword = (rule.keywordTrigger || rule.pathMatchPattern || '').trim().toLowerCase();

            if (fField === 'any_delivery_path') {
              const val = p.deliveryFolder || p.finalExportFolder || p.googleDriveLink || p.cloudDriveLink || '';
              if (val && val.trim().length > 0) {
                if (!triggerKeyword || val.toLowerCase().includes(triggerKeyword)) {
                  shouldTrigger = true;
                  matchedValue = val;
                }
              }
            } else {
              const val = (p as any)[fField];
              if (typeof val === 'string' && val.trim().length > 0) {
                if (!triggerKeyword || val.toLowerCase().includes(triggerKeyword)) {
                  shouldTrigger = true;
                  matchedValue = val;
                }
              }
            }
          } else if (rule.triggerEvent === 'all_footage_received') {
            if ((p.hardDiskName && p.hardDiskName.trim().length > 0) || (p.rawFootageSizeGB && p.rawFootageSizeGB > 0)) {
              if (p.status === 'data_received') {
                // already data_received
              } else {
                shouldTrigger = true;
              }
            }
          } else if (rule.triggerEvent === 'editor_assigned') {
            if ((p.assignedEditorId || p.assignedEditorName) && (p.status === 'data_received' || p.status === 'assigned')) {
              shouldTrigger = true;
            }
          }

          // Trigger transition if eligible
          if (shouldTrigger) {
            try {
              const prevStatus = p.status;
              await updateDoc(doc(db, 'projects', p.id), {
                status: rule.targetStatus,
                updatedAt: serverTimestamp()
              });
              p.status = rule.targetStatus; // update local ref
              report.details.push(`Auto-advanced "${p.coupleName || p.projectName}" from "${prevStatus}" to "${rule.targetStatus}" [Rule: ${rule.name}]`);

              // Notification if configured
              if (rule.autoNotify) {
                const notifId = `rule-trigger-${rule.id}-${p.id}-${todayStr}`;
                const notifTitle = `⚡ Auto Transition: ${p.coupleName || p.projectName}`;
                const notifMsg = `Project was automatically moved to "${rule.targetStatus.replace(/_/g, ' ').toUpperCase()}" because: ${rule.name}${matchedValue ? ` (${matchedValue})` : ''}.`;
                
                await setDoc(doc(db, 'notifications', notifId), {
                  id: notifId,
                  title: notifTitle,
                  message: notifMsg,
                  type: 'status_update',
                  projectId: p.id,
                  isAutomated: true,
                  read: false,
                  createdAt: serverTimestamp()
                }, { merge: true });
                report.notificationsGenerated++;
              }
            } catch (err) {
              console.warn(`Failed executing status transition rule for ${p.id}:`, err);
            }
          }
        }
      }
    }

    // Save run telemetry in settings
    const updatedSettings: AutomationSettings = {
      ...settings,
      lastAutomationRun: now.toISOString(),
      rulesRunCount: (settings.rulesRunCount || 0) + 1
    };
    saveAutomationSettings(updatedSettings);

    if (report.details.length === 0) {
      report.details.push("All project timelines, payment balances, and delivery schedules are verified optimal. No issues found.");
    }
  } catch (error: any) {
    console.error("Error running studio automation suite:", error);
    report.details.push(`Automation error: ${error.message || 'Unknown failure'}`);
  }

  return report;
}

/**
 * Real-time evaluator called whenever a project is updated or edited.
 * Checks active automation rules and returns suggested status updates if conditions match.
 */
export function evaluateProjectStatusTransitions(
  existingProject: Project,
  incomingUpdates: Partial<Project>,
  customRules?: CustomAutomationRule[]
): {
  targetStatus?: ProjectStatus;
  triggeredRule?: CustomAutomationRule;
  reason?: string;
} {
  const rules = (customRules || getAutomationSettings().customStatusRules || DEFAULT_CUSTOM_STATUS_RULES).filter(r => r.enabled);
  if (rules.length === 0) return {};

  const merged: Project = { ...existingProject, ...incomingUpdates };

  for (const rule of rules) {
    // If incoming updates already explicitly set status, respect user intent unless it matches
    if (incomingUpdates.status && incomingUpdates.status === rule.targetStatus) {
      continue;
    }
    // If project is already at targetStatus, skip
    if (existingProject.status === rule.targetStatus) {
      continue;
    }
    // Do not auto-revert closed or delivered projects unless explicit
    if (existingProject.status === 'closed') {
      continue;
    }

    if (rule.triggerEvent === 'folder_path_added') {
      const fField = rule.folderField || 'any_delivery_path';
      
      let incomingVal = '';
      let previousVal = '';

      if (fField === 'any_delivery_path') {
        incomingVal = incomingUpdates.deliveryFolder || incomingUpdates.finalExportFolder || incomingUpdates.googleDriveLink || incomingUpdates.cloudDriveLink || '';
        previousVal = existingProject.deliveryFolder || existingProject.finalExportFolder || existingProject.googleDriveLink || existingProject.cloudDriveLink || '';
      } else {
        incomingVal = (incomingUpdates as any)[fField] || '';
        previousVal = (existingProject as any)[fField] || '';
      }

      // Check if newly added or non-empty
      if (incomingVal && incomingVal.trim().length > 0 && incomingVal !== previousVal) {
        const triggerKeyword = (rule.keywordTrigger || rule.pathMatchPattern || '').trim().toLowerCase();
        if (!triggerKeyword || incomingVal.toLowerCase().includes(triggerKeyword)) {
          return {
            targetStatus: rule.targetStatus,
            triggeredRule: rule,
            reason: `Folder/link path added: "${incomingVal}" matched rule "${rule.name}"${triggerKeyword ? ` [Keyword: "${triggerKeyword}"]` : ''}`
          };
        }
      }
    } else if (rule.triggerEvent === 'all_footage_received') {
      const hadDisk = Boolean(existingProject.hardDiskName || existingProject.rawFootageSizeGB);
      const nowDisk = Boolean(merged.hardDiskName || merged.rawFootageSizeGB);
      if (!hadDisk && nowDisk && merged.status !== rule.targetStatus) {
        return {
          targetStatus: rule.targetStatus,
          triggeredRule: rule,
          reason: `Footage hard drive or size recorded: "${merged.hardDiskName || merged.rawFootageSizeGB + ' GB'}"`
        };
      }
    } else if (rule.triggerEvent === 'editor_assigned') {
      const hadEditor = Boolean(existingProject.assignedEditorId || existingProject.assignedEditorName);
      const nowEditor = Boolean(merged.assignedEditorId || merged.assignedEditorName);
      if (!hadEditor && nowEditor && (merged.status === 'data_received' || merged.status === 'assigned')) {
        return {
          targetStatus: rule.targetStatus,
          triggeredRule: rule,
          reason: `Assigned editor allocated: "${merged.assignedEditorName || merged.assignedEditorId}"`
        };
      }
    }
  }

  return {};
}
