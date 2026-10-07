# NEXLIFE

**Your life, in progress.** NEXLIFE turns everyday intentions into quests, experience points, levels and small moments of momentum. It is a private, local-first, offline-ready real-life RPG: no account, backend or analytics required.

## Features

- **Flexible quests:** create, edit, complete, filter and delete missions across five life domains. Undo an accidental deletion during the brief on-screen undo window.
- **Recurring habits:** schedule quests for every day or selected weekdays; one-time quests automatically leave the list on the next day.
- **Quest templates:** start from 10 editable ideas for study, fitness, projects, personal growth and trading education.
- **Progression and rewards:** earn XP, level up, build a streak, collect one-time bonus-XP achievement badges, and claim a daily-boss bonus after finishing today's scheduled quests.
- **Weekly challenge:** a rotating goal tracks quests, XP, focus sessions or active days and grants bonus XP when completed. Progress resets each Monday.
- **Private daily journal:** save a mood and a short reflection for today; past notes appear in the activity timeline and travel with your JSON backup.
- **Momentum insights:** see a 30-day activity heatmap and a weekly recap of quests, focus minutes, XP, active days and your most-used path.
- **Custom focus and breaks:** choose 25, 45 or 60-minute focus sessions and 5, 10 or 15-minute breaks. A completed focus session awards 25 XP.
- **Optional reminders:** opt into browser notifications and choose a daily reminder time. The app must be open in a browser for reminders to run; this is not a background or server-side alarm.
- **Backup and restore:** export a portable JSON save and restore it on another browser. Version 1 backups remain supported.
- **Private by design:** quests, profile, XP, journal and settings stay in this browser's `localStorage`. There is no cloud synchronization; download a backup to transfer your save between devices.
- **Installable and offline-ready:** a lightweight web app manifest and service worker cache the app shell after its first visit.
- **Responsive and accessible:** keyboard-friendly controls, visible focus states, screen-reader labels, reduced-motion support and layouts for small screens.
- **Dark and light themes:** switch from the top bar; your choice is saved in this browser, applied before first paint, and included in new backups. Dark remains the default look.

## Run locally

No build step or package installation is needed. Serve the project over HTTP so the service worker and browser notifications can work:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Progress is saved in that browser profile. Use **Backup** in the header or your profile to export/restore a save.

## Publish with GitHub Pages

Open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/(root)`. GitHub Pages serves `index.html` without a build step or backend. Browser notifications require a secure context, such as HTTPS or localhost, and browser permission.

The GitHub Actions quality check runs on pushes and pull requests. It verifies JavaScript syntax, local asset references, required pages, manifest validity and core product features; it does **not** publish the site.

## Project structure

```text
.
├── index.html              # Dashboard, history, achievements, dialogs and PWA metadata
├── style.css               # Responsive visual system and components
├── script.js               # Quests, recurrence, progression, focus, reminders and local persistence
├── theme-init.js           # Applies the saved color theme before first paint
├── manifest.webmanifest    # Installable web-app metadata
├── service-worker.js       # Offline app-shell cache and notification click handling
├── icon.svg                # NEXLIFE mark
├── tests/check_project.py  # Dependency-free static project checks
└── .github/workflows/      # GitHub Actions quality workflow
```

## Data and backups

NEXLIFE keeps the player profile, quest schedules, XP, streak, achievement claims, weekly challenge, activity journal, focus preferences and reminder time in browser storage on this device. Clearing browser data removes the local save. Export a backup regularly if you want a portable copy. Importing a backup replaces the current local progress. Older version 1 JSON backups continue to import; new backups include the additional settings and history.

## Checks

```bash
node --check script.js
node --check service-worker.js
python3 tests/check_project.py
```
