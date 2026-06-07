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
    const localTime = getLocalTime(now, sub.timezone);

    for (const reminder of sub.reminders || []) {
      if (reminder.time !== localTime) continue;

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

function getLocalTime(utcDate, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(utcDate);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  } catch {
    return '99:99';
  }
}

export const config = {
  schedule: '*/5 * * * *',
};
