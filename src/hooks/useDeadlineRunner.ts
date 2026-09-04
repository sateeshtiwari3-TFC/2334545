import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent, AppNotification, Project } from '../types';
import { runDeadlineRunnerCheck, DeadlineCheckResult } from '../services/deadlineRunner';
import { playDeadlineAlertChime } from '../utils/chimeSound';
import { 
  getBrowserNotificationPermission, 
  requestBrowserNotificationPermission, 
  sendDeadlinePushNotification,
  sendBrowserNotification
} from '../utils/browserNotifications';

export function useDeadlineRunner(
  calendarEvents: CalendarEvent[],
  notifications: AppNotification[],
  projects: Project[] = [],
  enabled: boolean = true,
  intervalSeconds: number = 30
) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<DeadlineCheckResult | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [recentToastMessage, setRecentToastMessage] = useState<string | null>(null);
  const [pushPermissionState, setPushPermissionState] = useState<NotificationPermission | 'unsupported'>(
    getBrowserNotificationPermission()
  );

  // Keep ref to avoid stale closure in interval
  const calendarEventsRef = useRef(calendarEvents);
  const notificationsRef = useRef(notifications);
  const projectsRef = useRef(projects);

  useEffect(() => {
    calendarEventsRef.current = calendarEvents;
  }, [calendarEvents]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Sync push permission state on mount
  useEffect(() => {
    setPushPermissionState(getBrowserNotificationPermission());
  }, []);

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestBrowserNotificationPermission();
    setPushPermissionState(getBrowserNotificationPermission());
    return granted;
  }, []);

  const sendTestPush = useCallback(async () => {
    let perm = getBrowserNotificationPermission();
    if (perm !== 'granted') {
      const granted = await requestPushPermission();
      if (!granted) return false;
    }

    sendDeadlinePushNotification(
      '⏰ Test Deadline Push Alert',
      'This is a test browser push notification for upcoming project deadlines (due within 24 hours).',
      'test-event-id'
    );
    return true;
  }, [requestPushPermission]);

  const executeCheck = useCallback(async () => {
    setIsRunning(true);
    try {
      const res = await runDeadlineRunnerCheck(
        calendarEventsRef.current,
        notificationsRef.current,
        projectsRef.current
      );
      setLastResult(res);
      setLastCheckTime(new Date());
      setCheckCount(c => c + 1);

      if (res.triggeredNotifications.length > 0) {
        const count = res.triggeredNotifications.length;
        const titles = res.triggeredNotifications.map(t => t.title).join(', ');
        setRecentToastMessage(`⏰ Automated Alert Runner: Triggered ${count} notification(s) for task(s)/unpaid delivery within due date window! (${titles})`);

        // Trigger browser push notification for each newly triggered deadline item if not already dispatched
        res.triggeredNotifications.forEach(notifItem => {
          sendDeadlinePushNotification(
            `⏰ Deadline Alert: ${notifItem.title}`,
            notifItem.message || `Project deadline "${notifItem.title}" is due within ~${notifItem.hoursRemaining}h!`,
            notifItem.eventId
          );
        });

        // Play subtle audio chime for deadline alerts
        playDeadlineAlertChime(0.3);

        // Auto dismiss toast after 7 seconds
        setTimeout(() => {
          setRecentToastMessage(null);
        }, 7000);
      }
    } catch (err) {
      console.error("[useDeadlineRunner] Error running check:", err);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Periodic timer effect
  useEffect(() => {
    if (!enabled) return;

    // Run check immediately on mount or when enabled
    executeCheck();

    // Set recurring timer
    const timerId = setInterval(() => {
      executeCheck();
    }, Math.max(10, intervalSeconds) * 1000);

    return () => clearInterval(timerId);
  }, [enabled, intervalSeconds, executeCheck]);

  return {
    isRunning,
    lastResult,
    lastCheckTime,
    checkCount,
    recentToastMessage,
    pushPermissionState,
    requestPushPermission,
    sendTestPush,
    dismissToast: () => setRecentToastMessage(null),
    triggerManualCheck: executeCheck
  };
}
