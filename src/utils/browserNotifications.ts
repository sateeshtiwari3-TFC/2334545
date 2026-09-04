/**
 * Browser-based Web Push Notification Utility
 * Provides native desktop/browser notifications for 24-hour project deadline alerts.
 */

export interface BrowserNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  renotify?: boolean;
  silent?: boolean;
  data?: any;
}

/**
 * Checks if the Web Notification API is supported in the current environment.
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission state for browser notifications.
 */
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser notification permission from the user.
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!isBrowserNotificationSupported()) {
    console.warn('[Browser Notifications] Web Notifications API is not supported in this browser.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('[Browser Notifications] Error requesting permission:', err);
    return false;
  }
}

/**
 * Dispatches a native browser push notification if permission is granted.
 */
export function sendBrowserNotification(
  title: string,
  options: BrowserNotificationOptions = {}
): Notification | null {
  if (!isBrowserNotificationSupported()) {
    console.warn('[Browser Notifications] Cannot send notification: API unsupported.');
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const defaultOptions: any = {
      body: options.body || '',
      icon: options.icon || '/favicon.ico',
      tag: options.tag || `deadline-alert-${Date.now()}`,
      renotify: options.renotify ?? true,
      silent: options.silent ?? false,
      data: options.data || {}
    };

    const notification = new Notification(title, defaultOptions);

    notification.onclick = (event) => {
      event.preventDefault();
      if (typeof window !== 'undefined') {
        window.focus();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('[Browser Notifications] Error displaying browser notification:', err);
    return null;
  }
}

/**
 * Helper specifically designed for project deadline alerts within 24 hours.
 */
export function sendDeadlinePushNotification(
  title: string,
  message: string,
  eventId?: string
): Notification | null {
  const notificationTitle = title.startsWith('⏰') ? title : `⏰ ${title}`;
  return sendBrowserNotification(notificationTitle, {
    body: message,
    tag: eventId ? `deadline-24h-${eventId}` : `deadline-${Date.now()}`,
    renotify: true,
    silent: false
  });
}
