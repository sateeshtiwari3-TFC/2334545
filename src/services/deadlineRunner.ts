import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CalendarEvent, AppNotification, Project } from '../types';
import { sendDeadlinePushNotification } from '../utils/browserNotifications';

export interface DeadlineCheckResult {
  timestamp: string;
  checkedCount: number;
  upcomingCount: number;
  triggeredNotifications: {
    id: string;
    eventId: string;
    title: string;
    dueDate: string;
    hoursRemaining: number;
    message?: string;
  }[];
}

/**
 * Safely parses a due date value into milliseconds.
 * Supports YYYY-MM-DD date strings, ISO date strings, JS Dates, and Firestore timestamps.
 */
export function parseDueDateToMs(dateVal: any): number {
  if (!dateVal) return 0;

  // If Firestore Timestamp object
  if (typeof dateVal?.toMillis === 'function') {
    return dateVal.toMillis();
  }
  if (dateVal.seconds !== undefined) {
    return dateVal.seconds * 1000 + (dateVal.nanoseconds || 0) / 1000000;
  }

  // JS Date
  if (dateVal instanceof Date) {
    return dateVal.getTime();
  }

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // YYYY-MM-DD format: treat as end of day (23:59:59) in local time
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
    }
    const parsed = new Date(trimmed).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }

  if (typeof dateVal === 'number') {
    return dateVal;
  }

  return 0;
}

/**
 * Checks if a given due timestamp is within 24 hours of reference time.
 */
export function isWithin24Hours(dueMs: number, refTimeMs: number = Date.now()): { isWithin: boolean; hoursRemaining: number } {
  if (!dueMs) return { isWithin: false, hoursRemaining: 0 };

  const diffMs = dueMs - refTimeMs;
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  // Consider "within 24 hours" if due in the next 24 hours OR overdue within the last 12 hours
  const isWithin = hoursRemaining >= -12 && hoursRemaining <= 24;

  return { isWithin, hoursRemaining };
}

/**
 * Checks if a project has an unpaid remaining balance (>0) and its delivery date is within the next 48 hours.
 */
export function isPendingBalanceWithin48Hours(
  project: Project,
  refTimeMs: number = Date.now()
): { isCritical: boolean; remainingBalance: number; hoursRemaining: number; daysLeft: number } {
  if (!project || project.status === 'closed') {
    return { isCritical: false, remainingBalance: 0, hoursRemaining: 0, daysLeft: 0 };
  }

  const remainingBalance = typeof project.remainingBalance === 'number'
    ? project.remainingBalance
    : (Number(project.projectAmount || 0) - Number(project.advancePayment || 0));

  if (remainingBalance <= 0 || !project.deliveryDate) {
    return { isCritical: false, remainingBalance, hoursRemaining: 0, daysLeft: 0 };
  }

  const dueMs = parseDueDateToMs(project.deliveryDate);
  if (!dueMs) {
    return { isCritical: false, remainingBalance, hoursRemaining: 0, daysLeft: 0 };
  }

  const diffMs = dueMs - refTimeMs;
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const daysLeft = Math.ceil(diffMs / (1000 * 3600 * 24));

  // Critical if delivery is due within 48 hours or newly overdue with an uncleared balance
  const isCritical = hoursRemaining <= 48 && hoursRemaining >= -48;

  return { isCritical, remainingBalance, hoursRemaining, daysLeft };
}

/**
 * Background Task Runner Execution:
 * Checks upcoming project deadlines in the 'calendar' collection
 * and checks projects with remaining balance > 0 due within 48 hours,
 * triggering automated notifications and browser push alerts if criteria are met.
 */
export async function runDeadlineRunnerCheck(
  currentCalendarEvents?: CalendarEvent[],
  existingNotifications?: AppNotification[],
  currentProjects?: Project[]
): Promise<DeadlineCheckResult> {
  const result: DeadlineCheckResult = {
    timestamp: new Date().toLocaleTimeString(),
    checkedCount: 0,
    upcomingCount: 0,
    triggeredNotifications: []
  };

  try {
    // 1. Load events from 'calendar' collection in Firestore if not supplied
    let calendarEvents: CalendarEvent[] = [];
    if (currentCalendarEvents && currentCalendarEvents.length > 0) {
      calendarEvents = currentCalendarEvents;
    } else {
      const calSnap = await getDocs(collection(db, 'calendar'));
      calSnap.forEach(docSnap => {
        calendarEvents.push({ ...docSnap.data() as any, id: docSnap.id });
      });
    }

    // 2. Load notifications from 'notifications' collection if not supplied
    let notifList: AppNotification[] = [];
    if (existingNotifications) {
      notifList = existingNotifications;
    } else {
      const notifSnap = await getDocs(collection(db, 'notifications'));
      notifSnap.forEach(docSnap => {
        notifList.push({ ...docSnap.data() as any, id: docSnap.id });
      });
    }

    // 3. Load projects from 'projects' collection if not supplied
    let projectsList: Project[] = [];
    if (currentProjects && currentProjects.length > 0) {
      projectsList = currentProjects;
    } else {
      const prjSnap = await getDocs(collection(db, 'projects'));
      prjSnap.forEach(docSnap => {
        projectsList.push({ ...docSnap.data() as any, id: docSnap.id });
      });
    }

    result.checkedCount = calendarEvents.length + projectsList.length;
    const nowMs = Date.now();

    // Scan Calendar Events (24-hour deadline scan)
    for (const evt of calendarEvents) {
      const dateStr = evt.start;
      if (!dateStr) continue;

      const dueMs = parseDueDateToMs(dateStr);
      if (!dueMs) continue;

      const { isWithin, hoursRemaining } = isWithin24Hours(dueMs, nowMs);

      if (isWithin) {
        result.upcomingCount++;

        // Deduplication ID per calendar event and due date
        const dateKey = typeof dateStr === 'string' ? dateStr.slice(0, 10) : new Date(dueMs).toISOString().slice(0, 10);
        const dedupeId = `notif-deadline-${evt.id}-${dateKey}`;

        // Check if an alert for this calendar event has already been created
        const alreadyNotified = notifList.some(
          n => n.id === dedupeId ||
               n.calendarEventId === evt.id ||
               (n.title.includes('Deadline') && n.message.includes(evt.title))
        );

        if (!alreadyNotified) {
          const formattedHours = hoursRemaining < 0
            ? `overdue by ${Math.abs(Math.round(hoursRemaining))}h`
            : `due in ~${Math.max(1, Math.round(hoursRemaining))}h`;

          const notificationTitle = `⏰ Deadline Alert: ${evt.title}`;
          const notificationMessage = `Upcoming deadline "${evt.title}" ${evt.coupleName ? `(${evt.coupleName})` : ''} is ${formattedHours} [Due: ${dateKey}]!`;

          const notifPayload: Omit<AppNotification, 'createdAt'> & { createdAt: any } = {
            id: dedupeId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'delivery_tomorrow',
            projectId: evt.projectId || '',
            calendarEventId: evt.id,
            isAutomated: true,
            read: false,
            createdAt: serverTimestamp()
          };

          try {
            const notifRef = doc(db, 'notifications', dedupeId);
            await setDoc(notifRef, notifPayload, { merge: true });

            result.triggeredNotifications.push({
              id: dedupeId,
              eventId: evt.id,
              title: evt.title,
              dueDate: dateKey,
              hoursRemaining: Math.round(hoursRemaining),
              message: notificationMessage
            });

            // Dispatch native browser-based push notification
            sendDeadlinePushNotification(notificationTitle, notificationMessage, evt.id);

            console.log(`[Deadline Runner] Triggered automated notification for task/event '${evt.title}' (${dedupeId})`);
          } catch (writeErr) {
            console.error(`[Deadline Runner] Failed to write notification for ${evt.id}:`, writeErr);
          }
        }
      }
    }

    // Scan Projects with Remaining Balance > 0 and Delivery Date within next 48 hours
    for (const proj of projectsList) {
      const { isCritical, remainingBalance, hoursRemaining } = isPendingBalanceWithin48Hours(proj, nowMs);

      if (isCritical) {
        result.upcomingCount++;
        const dateKey = typeof proj.deliveryDate === 'string'
          ? proj.deliveryDate.slice(0, 10)
          : new Date(parseDueDateToMs(proj.deliveryDate)).toISOString().slice(0, 10);
        
        const dedupeId = `notif-balance-48h-${proj.id}-${dateKey}`;

        const alreadyNotified = notifList.some(
          n => n.id === dedupeId ||
               (n.projectId === proj.id && (n.title.includes('Remaining Balance') || n.title.includes('Unpaid Balance') || n.title.includes('Balance Alert')) && n.message.includes(dateKey))
        );

        if (!alreadyNotified) {
          const formattedTime = hoursRemaining < 0
            ? `past due by ${Math.abs(Math.round(hoursRemaining))}h`
            : `due in ~${Math.max(1, Math.round(hoursRemaining))}h`;

          const notificationTitle = `🚨 Unpaid Balance & 48h Deadline: ${proj.coupleName || proj.projectName}`;
          const notificationMessage = `Project "${proj.coupleName || proj.projectName}" (${proj.studioName}) has a remaining balance of ₹${remainingBalance.toLocaleString('en-IN')} and delivery date is ${formattedTime} [Due: ${dateKey}]. Please follow up with client/studio!`;

          const notifPayload: Omit<AppNotification, 'createdAt'> & { createdAt: any } = {
            id: dedupeId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'payment_pending',
            projectId: proj.id,
            isAutomated: true,
            read: false,
            createdAt: serverTimestamp()
          };

          try {
            const notifRef = doc(db, 'notifications', dedupeId);
            await setDoc(notifRef, notifPayload, { merge: true });

            result.triggeredNotifications.push({
              id: dedupeId,
              eventId: proj.id,
              title: notificationTitle,
              dueDate: dateKey,
              hoursRemaining: Math.round(hoursRemaining),
              message: notificationMessage
            });

            // Dispatch native browser-based push notification
            sendDeadlinePushNotification(notificationTitle, notificationMessage, proj.id);

            console.log(`[Deadline Runner] Triggered 48h balance alert for project '${proj.coupleName}' (${dedupeId})`);
          } catch (writeErr) {
            console.error(`[Deadline Runner] Failed to write 48h balance notification for project ${proj.id}:`, writeErr);
          }
        }
      }
    }

    // Scan studioInvoices for Overdue Status Automation
    try {
      const invSnap = await getDocs(collection(db, 'studioInvoices'));
      for (const invDoc of invSnap.docs) {
        const invData = invDoc.data() as any;
        const totalPayable = Number(invData.totalPayable ?? invData.totalAmount ?? 0);
        const currentStatus = invData.status || (totalPayable === 0 ? 'paid' : 'pending');
        
        // Only process pending invoices that have a balance payable
        if (currentStatus === 'pending' && totalPayable > 0) {
          const dueDateStr = invData.dueDate || invData.invoiceDate || invData.date;
          if (dueDateStr) {
            const dueMs = parseDueDateToMs(dueDateStr);
            if (dueMs && dueMs < nowMs) {
              // Current date has passed the due date and invoice is pending -> Update status to 'overdue'
              try {
                await setDoc(doc(db, 'studioInvoices', invDoc.id), {
                  status: 'overdue',
                  updatedAt: serverTimestamp()
                }, { merge: true });

                const daysOverdue = Math.max(1, Math.floor((nowMs - dueMs) / (1000 * 3600 * 24)));
                const dedupeId = `notif-invoice-overdue-${invDoc.id}`;
                const alreadyNotified = notifList.some(n => n.id === dedupeId);

                if (!alreadyNotified) {
                  const notifTitle = `⚠️ Overdue Invoice Alert: ${invData.invoiceNo || invDoc.id}`;
                  const notifMessage = `Invoice ${invData.invoiceNo || invDoc.id} for "${invData.studioName || 'Studio'}" (₹${totalPayable.toLocaleString('en-IN')}) is overdue by ${daysOverdue} day(s). [Due was: ${dueDateStr}].`;
                  
                  await setDoc(doc(db, 'notifications', dedupeId), {
                    id: dedupeId,
                    title: notifTitle,
                    message: notifMessage,
                    type: 'payment_pending',
                    projectId: '',
                    studioId: invData.studioId || '',
                    isAutomated: true,
                    read: false,
                    createdAt: serverTimestamp()
                  }, { merge: true });

                  sendDeadlinePushNotification(notifTitle, notifMessage, invDoc.id);
                  result.triggeredNotifications.push({
                    id: dedupeId,
                    eventId: invDoc.id,
                    title: notifTitle,
                    dueDate: dueDateStr,
                    hoursRemaining: -daysOverdue * 24,
                    message: notifMessage
                  });
                }
              } catch (invErr) {
                console.error(`[Deadline Runner] Failed to update overdue status for invoice ${invDoc.id}:`, invErr);
              }
            }
          }
        }
      }
    } catch (invScanErr) {
      console.error("[Deadline Runner] Error scanning invoices for overdue status:", invScanErr);
    }
  } catch (error) {
    console.error("[Deadline Runner] Error during execution:", error);
  }

  return result;
}
