import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@canyonmarkets.com';

/**
 * Runs every 5 minutes via Netlify scheduled function.
 * Checks Supabase for any Scripture Tracker reminders due right now and sends push notifications.
 */
export default async function handler() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('Missing environment variables');
    return new Response('config error', { status: 500 });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('app', 'scripture');

  if (error) {
    console.error('Supabase query error:', error);
    return new Response('db error', { status: 500 });
  }

  const now = new Date();
  const sends = [];

  for (const sub of subscriptions || []) {
    for (const reminder of sub.reminders || []) {
      if (!isWithinWindow(now, reminder.time, sub.timezone)) continue;

      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      sends.push(
        webpush
          .sendNotification(
            pushSub,
            JSON.stringify({
              title: 'Scripture Tracker',
              body: "Time for your daily scripture reading!",
              tag: 'scripture-reminder',
            })
          )
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint);
            }
          })
      );
    }
  }

  await Promise.all(sends);
  console.log(`Scripture reminders: checked ${subscriptions?.length ?? 0} devices, sent ${sends.length} notifications`);
  return new Response('ok');
}

/**
 * Returns true if reminderTime (HH:MM) falls within the past 5-minute window.
 * Handles the case where the scheduler fires every 5 min but reminder times
 * can be set to any minute — without this, only :00/:05/:10... times ever fire.
 */
function isWithinWindow(utcNow, reminderTime, timezone) {
  try {
    // Get current local HH:MM in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23', // hour12:false yields "24" at midnight, breaking 00:XX reminders
    });
    const parts = formatter.formatToParts(utcNow);
    const nowH = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');
    const nowM = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');
    const nowTotal = nowH * 60 + nowM;

    const [rH, rM] = reminderTime.split(':').map(Number);
    const reminderTotal = rH * 60 + rM;

    // Fire if reminder time falls in (nowTotal-5, nowTotal] — i.e. within the last 5 minutes
    // Handle midnight rollover (e.g. window spanning 23:58–00:02)
    const diff = (nowTotal - reminderTotal + 1440) % 1440;
    return diff >= 0 && diff < 5;
  } catch {
    return false;
  }
}

export const config = {
  schedule: '*/5 * * * *',
};
