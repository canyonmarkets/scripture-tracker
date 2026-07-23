# Scripture Tracker — Project Notes

## Overview
Personal PWA for Jeff Martin to read and track progress through the LDS standard works.
Create a reading plan (book + timeline), get a daily chapter assignment, read in-app
(text fetched from the open-source scriptures-json GitHub project), mark days read,
track streak/history, optional audio playback and daily push reminders.

**Live URL:** https://scripture-tracker.netlify.app
**GitHub:** https://github.com/canyonmarkets/scripture-tracker
**Local path:** C:\Users\jeffm\Documents\CLAUDE\PERSONAL & GCU PROJECTS\scripture-tracker

## Deploy Workflow
Jeff's rule: run `npm run dev`, verify changes in the browser locally FIRST, batch all
related edits, then one push to GitHub → Netlify auto-deploys `master` (~1 min).
Never call a task done without pushing (after local preview approval).

## Tech Stack
- React 19 + Vite 8, plain JS (no TypeScript)
- vite-plugin-pwa with `strategies: 'injectManifest'` — custom service worker at `src/sw.js`
  (workbox precache + scripture JSON cache + push notification handlers)
- All user data in localStorage — no accounts. Supabase is used ONLY for push subscriptions.
- lucide-react icons

## App Structure
```
src/
  App.jsx                 — tabs, plans/readDays/bookmarks state, markTodayRead,
                            todayAssignment memo, push re-sync on launch
  components/
    Home.jsx              — progress card (streak), Continue Reading, Today's Reading,
                            CalendarHeatmap (Reading History)
    Reader.jsx            — scripture text, goal strip, audio, auto-scroll, highlights,
                            bookmark button, completion overlay
    NewPlan.jsx / Plans.jsx / Journal.jsx / Preferences.jsx / NoteModal.jsx / SplashScreen.jsx
  data/scriptureIndex.js  — verse counts for all books, buildReadingPlan,
                            getTodaysAssignment, getPlanDayIndex, reading speeds
  lib/
    dates.js              — localDateKey() + migrateUtcReadDays() (see Date Handling)
    pushSubscription.js   — Web Push subscribe + Supabase upsert/remove
    highlights.js         — verse highlight/note storage
    churchAudio.js        — audio URL resolution (proxied via Netlify function)
netlify/functions/
  send-reminders.mjs      — scheduled fn, every 5 min, sends due reminders via web-push
  audio-urls.mjs          — CORS proxy for audio (why audio shows "unavailable" on local dev)
```

## localStorage Keys
`st_plans`, `st_readDays` (per-plan arrays of "YYYY-MM-DD"), `st_bookmarks` (per-plan
{book, chapter}), `st_activePlan`, `st_notes`, `st_theme`, `st_fontSize`, `st_fontFamily`,
`st_notifEnabled`, `st_reminderTime`, `st_scrollSpeed`, `st_dateFix_v1` (migration flag).

## Date Handling — CRITICAL RULE
**Never use `toISOString().slice(0,10)` for a calendar-day key.** That yields the UTC day,
which rolls over at 5 PM in Arizona (America/Phoenix, UTC-7, no DST). Jeff reads in the
evening, so every "Mark Read" was recorded under tomorrow's date — streak showed 0 while
Days Read showed 4, and the heatmap was shifted one day. Fixed 2026-06-12.
- Always use `localDateKey()` from `src/lib/dates.js` for day keys.
- `migrateUtcReadDays()` runs once before render (called in main.jsx, guarded by the
  `st_dateFix_v1` flag): if a plan's history lacks the creation-day key but has the
  day-after key (the evening-reader signature), every entry shifts back one day.
  Do not remove this until long after all devices have loaded the app once.
- `getStreak` in Home.jsx tolerates stray future-dated entries (skips, doesn't zero out).

## Today's Reading — Recalibration Logic (2026-06-12)
The bookmark (saved via the Reader's bookmark button) means "the NEXT chapter to read."
`getTodaysAssignment(plan, bookmark)` in scriptureIndex.js: takes all chapters from the
bookmark to the end of the book, divides their verses by the days remaining in the plan,
and returns today's chunk (greedy fill to verses-per-day). Reading ahead lightens the
daily load; falling behind grows it — the plan always re-aims at the original end date.
No bookmark → falls back to the original fixed calendar. Used by BOTH Home.jsx (Today's
Reading card) and App.jsx (`todayAssignment` memo → Reader goal strip). If you change one,
keep them shared — they were previously two diverging code paths and that was a bug.

## Server Push Reminders — Architecture (shared with GRIT habit-tracker)
1. `src/lib/pushSubscription.js` subscribes the browser (VAPID public key) and upserts
   endpoint + reminder time + IANA timezone into Supabase table `push_subscriptions`
   with `app: 'scripture'`. The SAME table serves GRIT (`app: 'grit'`) — same Supabase
   project, same VAPID key pair for both apps.
2. App.jsx re-syncs the subscription on EVERY launch (if `st_notifEnabled` is 'true' and
   permission granted) — this self-heals devices that failed to register earlier.
3. `netlify/functions/send-reminders.mjs` runs every 5 min (cron in netlify.toml + in-file
   config), matches each row's reminder time in its timezone within a 5-min window, sends
   via web-push. 410/404 → row auto-deleted.
4. `src/sw.js` displays the push.

Env vars — names must match EXACTLY (.env.local locally, Netlify site env for prod):
- Build-time (baked into bundle; Netlify changes need a redeploy): `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`
- Function runtime (apply on next run, no redeploy): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## June 2026 Reminder Fix (history — read before debugging notifications)
Reminders never fired. TWO independent breaks, both from the same clipboard glitch that
clips the FIRST character of a paste:
1. Netlify env var names were `ITE_VAPID_PUBLIC_KEY` and `UPABASE_SERVICE_KEY` (Jeff
   renamed them 2026-06-12), so the client never got the VAPID key → never subscribed →
   zero 'scripture' rows in Supabase.
2. The `SUPABASE_SERVICE_KEY` VALUE was also missing its first character (on BOTH this
   site and grit-tracker) → the function's DB query failed every run. Fixed via
   `netlify env:set`. GRIT confirmed firing live the same morning.
**When any pasted key/var misbehaves, check the first character first.**

## Diagnostics Playbook (notifications)
- Netlify CLI is logged in on this PC; repo is linked (site id
  a3c4be9f-1ec8-43e8-a4a5-34837245914e). `netlify env:list`, `netlify functions:list`.
- Inspect subscriptions: `GET {SUPABASE_URL}/rest/v1/push_subscriptions?app=eq.scripture&select=*`
  with `apikey` + `Authorization: Bearer` headers = SUPABASE_SERVICE_KEY (from .env.local).
- End-to-end phone test without waiting for cron: Node script using the `web-push` package,
  `setVapidDetails` from .env.local, send to the row's endpoint/p256dh/auth. 201 = delivered.
- Check what's baked in the deployed bundle: fetch scripture-tracker.netlify.app, get the
  /assets/index-*.js name, search the JS for the literal env value.
- Function logs: Netlify dashboard → scripture-tracker → Logs → Functions → send-reminders.
  Healthy: `Scripture reminders: checked N devices, sent M notifications` every 5 min.
- Reminder enable/sync status surfaces in-app: Prefs → "notif sync: ok" (or the error reason).

## ⚠️ Open Item — VITE_VAPID_PUBLIC_KEY Missing on Netlify
`VITE_VAPID_PUBLIC_KEY` (the build-time baked key) may not be set on Netlify, which means the client-side push subscription never gets the VAPID public key → no 'scripture' rows in Supabase → reminders never fire. If reminders stop working after a redeploy, check this env var first. Fix: `netlify env:set VITE_VAPID_PUBLIC_KEY <key>` then trigger a redeploy. Value is in `.env.local`.

## Status as of 2026-06-12
- Date fix + migration, bookmark recalibration, and launch re-sync are deployed to production.
- GRIT reminders confirmed firing end-to-end (9:00 AM live test).
- PENDING VERIFICATION: Jeff needs to fully close + reopen Scripture Tracker on his phone
  once so it registers (check `push_subscriptions` for an app='scripture' row, then expect
  the reminder at his set time, default 07:00). If no row appears after he opens the app,
  check Prefs → toggle state and "notif sync" status line.
- Jeff uses the app only on his phone — keep one subscription row per app.

## Misc
- "Audio unavailable" on `npm run dev` is EXPECTED — audio is proxied through a Netlify
  function that doesn't run under plain Vite. It works on the deployed site.
- Scripture text JSON comes from raw.githubusercontent.com (bcbooks/scriptures-json),
  cached by the service worker for 90 days.


---
## LOCATION (re-indexed 2026-07-23)
This project lives at: `C:\Users\jeffm\Documents\CLAUDE\PERSONAL\scripture-tracker`

This is the FINAL post-reorg home. The workspace root is C:\Users\jeffm\Documents\CLAUDE with four buckets (CANYON-APTS, CANYON-HQ, CANYON-MARKETS, PERSONAL) plus an OLD archive of the pre-reorg tree. The D:\COWORK CLEANUP staging area is GONE. Any older path mentioned elsewhere in this document is STALE — trust this note.
