# NEXLIFE

**Your life, in progress.** NEXLIFE turns everyday intentions into quests, experience points, levels and small moments of momentum. It is a local-first, offline-ready real-life RPG — no account, backend or analytics required.

## Features

- **Daily quests:** create, complete, filter and remove personal missions across five life domains.
- **Progression:** earn XP, level up, build a streak and unlock a daily-boss bonus after finishing every quest.
- **Focus mode:** a 25-minute focus timer awards 25 XP when a session is completed.
- **Weekly view:** see experience and active days at a glance.
- **Personal profile:** choose a player name and save or restore a JSON backup.
- **Private by design:** the app stores progress in this browser's `localStorage`; it does not send progress to a server.
- **Installable and offline-ready:** a lightweight web app manifest and service worker cache the app shell after its first visit.
- **Responsive and accessible:** keyboard-friendly controls, visible focus states, screen-reader labels, reduced-motion support and layouts for small screens.

## Run locally

No build step or package installation is needed. Serve the project over HTTP so the service worker can be enabled:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Progress is saved in that browser profile. Use **Backup** in the header to download a copy, or open your profile to restore one.

## Publish with GitHub Pages

NEXLIFE is a static site. To publish it from this repository, open **Settings → Pages** and select **Deploy from a branch**, then choose `main` and `/(root)`. GitHub Pages will serve `index.html` automatically. No secrets, build command or backend are required.

The repository includes a GitHub Actions quality check that runs on pushes and pull requests. It checks JavaScript syntax, local asset references, page IDs and manifest validity; it does **not** publish the site.

## Project structure

```text
.
├── index.html              # Dashboard, domain pages, dialogs and PWA metadata
├── style.css               # Responsive visual system and components
├── script.js               # Quest, XP, focus timer and local persistence logic
├── manifest.webmanifest    # Installable web-app metadata
├── service-worker.js       # Offline app-shell cache
├── icon.svg                # NEXLIFE mark
├── tests/check_project.py  # Dependency-free static project checks
└── .github/workflows/      # GitHub Actions quality workflow
```

## Data and backups

NEXLIFE keeps profile, quests, XP, streak and weekly activity in browser storage on the current device. Clearing browser data will remove the local save. Download backups regularly if you want a portable copy. Importing a backup replaces the current local progress in that browser.

## Checks

```bash
node --check script.js
python3 tests/check_project.py
```
