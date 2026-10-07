#!/usr/bin/env python3
"""Dependency-free integrity checks for the NEXLIFE static site."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.local_assets: list[str] = []
        self.page_sections: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        element_id = attributes.get("id")
        if element_id:
            self.ids.append(element_id)
            if tag == "section" and "page" in (attributes.get("class") or "").split():
                self.page_sections.add(element_id)
        asset = attributes.get("href") if tag in {"link", "a"} else attributes.get("src") if tag in {"script", "img"} else None
        if asset:
            parsed = urlsplit(asset)
            if not parsed.scheme and not parsed.netloc and parsed.path and not parsed.path.startswith("#"):
                self.local_assets.append(parsed.path)


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def main() -> None:
    html_path = ROOT / "index.html"
    if not html_path.is_file():
        fail("index.html is missing")
    parser = SiteParser()
    parser.feed(html_path.read_text(encoding="utf-8"))

    duplicates = sorted(identifier for identifier, count in Counter(parser.ids).items() if count > 1)
    if duplicates:
        fail(f"duplicate HTML ids: {', '.join(duplicates)}")

    missing = sorted({asset for asset in parser.local_assets if not (ROOT / asset).is_file()})
    if missing:
        fail(f"missing local assets: {', '.join(missing)}")

    required_pages = {"dashboard", "study", "trading", "fitness", "projects", "growth", "history", "achievements"}
    missing_pages = sorted(required_pages - parser.page_sections)
    if missing_pages:
        fail(f"missing dashboard pages: {', '.join(missing_pages)}")

    required_ids = {
        "openTemplates", "templateGrid", "questRecurrence", "weeklyDays", "questForm", "historyList",
        "achievementGrid", "challengeProgressFill", "focusDuration", "breakDuration", "reminderTime", "enableReminders", "themeToggle",
        "activityHeatmap", "weeklyRecapHeading", "weeklyQuests", "weeklyFocus", "weeklyXP", "weeklyActiveDays",
        "dailyJournalForm", "journalMood", "journalEntry", "journalCount", "journalSaved",
    }
    missing_ids = sorted(required_ids - set(parser.ids))
    if missing_ids:
        fail(f"required feature controls are missing: {', '.join(missing_ids)}")

    manifest_path = ROOT / "manifest.webmanifest"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        fail(f"invalid web-app manifest: {error}")
    if manifest.get("name") != "NEXLIFE — Your life, in progress":
        fail("manifest app name is missing or unexpected")
    for icon in manifest.get("icons", []):
        if not (ROOT / icon.get("src", "")).is_file():
            fail(f"manifest icon is missing: {icon.get('src')}")

    js = (ROOT / "script.js").read_text(encoding="utf-8")
    required_functions = (
        "function completeQuest", "function completeBoss", "function renderWeek", "function exportBackup",
        "function importBackup", "function submitQuest", "function restoreDeletedQuest", "function renderTemplates",
        "function renderHistory", "function renderAchievements", "function checkWeeklyChallenge", "function checkReminder",
        "function getActivityScore", "function renderActivityHeatmap", "function renderWeeklyRecap", "function saveDailyJournal",
    )
    for required in required_functions:
        if required not in js:
            fail(f"expected application feature is missing: {required}")
    if "[1, 2].includes(backup.version)" not in js:
        fail("version 1 and version 2 backup compatibility is missing")
    if "function applyTheme" not in js or "nexlife_theme" not in js or "theme: currentTheme" not in js:
        fail("persistent theme switching or backup support is missing")
    theme_init = (ROOT / "theme-init.js").read_text(encoding="utf-8")
    if 'document.documentElement.dataset.theme = theme' not in theme_init:
        fail("early theme initialization is missing")

    css = (ROOT / "style.css").read_text(encoding="utf-8")
    if "@media (max-width: 650px)" not in css or "prefers-reduced-motion" not in css:
        fail("responsive layout or reduced-motion styles are missing")
    if ".toast.show { pointer-events: auto; }" not in css:
        fail("the undo action must be keyboard and pointer reachable")

    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    if not re.search(r"nexlife-shell-v\d+", worker) or "notificationclick" not in worker:
        fail("service-worker cache version or notification click handling is missing")

    print(f"PASS: {len(parser.ids)} unique HTML ids; {len(parser.local_assets)} local references; {len(parser.page_sections)} dashboard pages; journal, insights, manifest and offline worker verified.")


if __name__ == "__main__":
    main()
