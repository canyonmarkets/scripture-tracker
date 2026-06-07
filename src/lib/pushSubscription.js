import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Subscribes this device to Web Push and syncs the reminder time to Supabase.
 * Call this when the user enables notifications or changes their reminder time.
 */
export async function syncScripturePushSubscription(reminderTime) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!SUPABASE_URL || !VAPID_PUBLIC_KEY) return;
  if (!reminderTime) return;

  try {
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }
    if (Notification.permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subJson = subscription.toJSON();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    await supabase.from('push_subscriptions').upsert(
      {
        app: 'scripture',
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        reminders: [{ id: 'daily', name: 'Daily Reading', time: reminderTime }],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );
  } catch (err) {
    console.error('[Scripture] Push subscription error:', err);
  }
}

/**
 * Removes this device's push subscription from Supabase.
 * Call this when the user disables notifications.
 */
export async function removePushSubscription() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', subscription.endpoint);

    await subscription.unsubscribe();
  } catch (err) {
    console.error('[Scripture] Unsubscribe error:', err);
  }
}
