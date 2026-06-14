import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AlertPrefs, Subscription } from './types';
import { alertInstantFor, daysUntil, formatDayMonth } from './dates';
import { formatINR } from './format';

/**
 * Local renewal alerts. Fires at 09:00 IST, `days_before` days ahead of each
 * active subscription's next renewal. Server push (FCM) is wired into the
 * Expo project config but deferred until the backend exists.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('renewals', {
    name: 'Renewal alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#34E5B0',
  });
  await Notifications.setNotificationChannelAsync('detections', {
    name: 'New subscriptions found',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 150, 200],
    lightColor: '#8B7CFF',
  });
}

/**
 * "We found a new subscription on your account" - fired after a scan surfaces
 * detections, tapping it opens the review inbox.
 */
export async function notifyNewDetections(count: number): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  await setupAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title:
        count === 1
          ? 'New subscription found on your account'
          : `${count} new subscriptions found`,
      body: 'Tap to review and add them - one tap each. No typing.',
      data: { route: '/(tabs)/inbox' },
    },
    trigger: null, // deliver now
  });
}

/**
 * Source of truth scheduling: wipe and re-create everything. Called after any
 * subscription or preference change - idempotent and cheap at manual-entry scale.
 */
export async function rescheduleAllAlerts(
  subs: Subscription[],
  prefs: AlertPrefs,
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.enabled) return 0;

  const granted = await ensureNotificationPermission();
  if (!granted) return 0;
  await setupAndroidChannel();

  let scheduled = 0;
  for (const sub of subs) {
    if (sub.status !== 'active') continue;
    const fireAt = alertInstantFor(sub.next_renewal_date, prefs.days_before);
    if (fireAt.getTime() <= Date.now()) continue; // alert window already passed

    const days = daysUntil(sub.next_renewal_date);
    const when =
      prefs.days_before === 0
        ? 'today'
        : prefs.days_before === 1
          ? 'tomorrow'
          : `on ${formatDayMonth(sub.next_renewal_date)}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${sub.service_name} renews ${when}`,
        body: `${formatINR(sub.price_inr)} · ${sub.plan_name || sub.billing_cycle}. Pause or cancel in Subme if you don't need it.`,
        data: { subscription_id: sub.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: 'renewals',
      },
    });
    scheduled += 1;
    void days;
  }
  return scheduled;
}
