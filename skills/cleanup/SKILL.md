---
name: cleanup
description: Use when der Mensch Folder-Housekeeping will, "raeum das auf", "projects aufraeumen", "folder housekeeping", "cleanup", "/cleanup", oder wenn ein Project-Folder mit losen Files, Backup-Versionen, Test-Outputs, .DS_Store oder Stale Drafts zugemuellt ist und sortiert/bereinigt werden soll. Default-Scope ist `projects/`. Immer dry-run zuerst, Apply nur nach explizitem "ok".
---

# /cleanup - Projects Housekeeping

## Overview

Raeumt `projects/` auf: tote Files raus, lose Files in passende
Subfolders, Junk loeschen. **Default = dry-run.** Apply erst nach
OK des Menschen.

## When to Use

- Der Mensch sagt "raeum auf", "cleanup", "/cleanup", "housekeeping",
  "folder ist Muellhalde"
- Project-Folder hat lose Files am Root (ausserhalb `call-logs/`,
  `data/`, `notes/`, `creatives/`)
- `.DS_Store`, `*.bak`, `*.tmp`, `Thumbs.db`, `~$*` sichtbar
- Vor Review-Ritualen, wenn ein Folder unuebersichtlich ist

**NICHT verwenden fuer:**

- Code-Refactoring (das ist `simplify` <wenn vorhanden>)
- Git-History-Cleanup (das ist `git rebase`/`gc`)
- Interne Memory-Files des Modells

## Iron Rules (HART)

1. **NIEMALS Hauptdateien loeschen.** Die Project-MD
   (`projects/<projekt>/<projekt>.md`) bleibt IMMER.
2. **NIEMALS git-tracked Files loeschen ohne explizite Zustimmung.**
   Vor jedem Delete-Plan: `git ls-files <file>` checken.
3. **NIEMALS auto-apply.** Default ist dry-run. Apply nur wenn der
   Mensch explizit `--apply`, "ok", "weiter", "mach" sagt.
4. **Order matters bei Apply:** erst Moves, dann Deletes. Niemals
   umgekehrt (sonst loescht du was du grade verschieben wolltest).
5. **Bei Unsicherheit: FLAG, nicht Delete.** Lieber dem Menschen zur
   manuellen Review zeigen als falsch wegwerfen.

## Workflow

### Phase 1 - Scope

```
Default: projects/
Optional: der Mensch gibt einen Subfolder an ("nur <projekt> aufraeumen")
```

Frage NUR wenn unklar. Default ohne Rueckfrage starten.

### Phase 2 - Scan

Walk durch den Scope. Pro File klassifizieren:

| Klasse | Heuristik | Action |
|---|---|---|
| **Hauptdatei** | Filename = Foldername + `.md` (z.B. `<projekt>.md` in `<projekt>/`) | Keep |
| **Strukturierter Subfolder** | File liegt in `call-logs/`, `data/`, `notes/`, `creatives/`, `reports/`, `invoicing/`, `prompts/`, `landing/`, `brand-assets/`, `design-system/`, `competitive-research/` o.ae. | Keep (skip Recursion ausser der Mensch will Deep-Cleanup) |
| **Audit/Report/Plan** | Pattern: `SECURITY-AUDIT-*`, `*-PLAN-*`, `analysis-*`, `*-scan-*`, `learnings.md`, `*-spec.md`, `*-options.md`, `*-guide*.md`, `*-workflow.md`, `*-prompt.md` | Keep (relevante Project-Docs) |
| **Junk** | `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.bak`, `*.pre-redact-bak`, `~$*`, `*.swp`, `*.swo` | DELETE-Kandidat |
| **Lose am Root** | Markdown/Text/CSV/JSON am Project-Root, kein Match oben | CLASSIFY-Kandidat |
| **Stale Draft** | mtime > 90 Tage UND Filename matcht `*-draft*`, `*-wip*`, `untitled*`, `temp*`, `test-*` | ARCHIVE-Kandidat (-> `_archive/`) |

### Phase 3 - Classify (lose Files)

Lese erste 500 Bytes. Match Pattern -> Ziel-Subfolder:

| Content-Pattern | Ziel |
|---|---|
| Transkript-Marker: "Sprecher", "Speaker", `[00:`, "Anrufer", "Call mit" | `call-logs/` |
| CSV-Header / JSON-Array / Tabular-Dump | `data/` |
| Image-Referenz, Creative-Brief, Headline-Liste, Ad-Copy-Variants | `creatives/` |
| Frei-Text Brain-Dump, Meeting-Notiz, Idee-Skizze | `notes/` |
| Kein klares Match | **FLAG** (manual review, nicht moven) |

Subfolder anlegen falls nicht existent.

### Phase 4 - Plan-Output (immer dry-run zuerst)

Format pro Project:

```
Project: <name>/
  Keep:     <hauptdatei>.md, <weitere keeps>
  Move:     <file> -> <subfolder>/        (Grund: <pattern>)
  Delete:   <junk-files>                  (git-status: untracked)
  Flag:     <unklare files>               (manual review noetig)
  Archive:  <stale drafts>                (mtime <date>, -> _archive/)
```

Am Ende: Zusammenfassung

```
Total: X files scanned
  Keep:    X
  Move:    X (across Y projects)
  Delete:  X (Z bytes freed)
  Flag:    X
  Archive: X
```

Dann fragen: **"Apply? (ok / nein / nur moves / nur deletes)"**

### Phase 5 - Apply (nur nach OK)

Reihenfolge HART:
1. Subfolders anlegen (`mkdir -p`) fuer alle Move-Targets
2. Alle Moves (`git mv` wenn tracked, sonst `mv`)
3. Alle Archives (`mkdir -p _archive/ && mv`)
4. Alle Deletes (`rm` fuer untracked, `git rm` fuer tracked nach
   Re-Confirm)

Pro Aktion eine Log-Zeile. Am Ende: `git status` zeigen.

## Quick Reference

| Der Mensch sagt | Du machst |
|---|---|
| `/cleanup` | Default-Scope, dry-run |
| `/cleanup <projekt>` | Nur den Subfolder, dry-run |
| `/cleanup --apply` | NICHT direkt - erst dry-run zeigen, dann fragen |
| "ok" / "weiter" / "mach" nach Plan | Apply ausfuehren |
| "nur moves" | Apply nur Move-Operations, skip Deletes |
| "nein" / "stop" | Plan verwerfen, nichts tun |

## Git-Safety-Check (vor jedem Delete)

```bash
git ls-files --error-unmatch "<path>" 2>/dev/null
# exit 0 = tracked -> nicht ohne Re-Confirm loeschen
# exit 1 = untracked -> safe to delete
```

Im Plan-Output git-Status pro Delete-Item zeigen: `(tracked)` oder
`(untracked)`.

## Edge Cases

- **Folder leer nach Cleanup?** -> leeren Subfolder NICHT loeschen (der
  Mensch legt ihn evtl. bewusst an)
- **Symlinks?** -> Keep, nie delete
- **Hidden Folders (Tool-State-Ordner)?** -> Keep, sind Tool-State
- **Lockfiles (`deno.lock`, `package-lock.json`)?** -> Keep
- **Image-Files (`.jpg`, `.png`) am Project-Root?** -> Move nach
  `creatives/` oder `brand-assets/` je nach Filename-Hint
- **`.md` mit Datum im Namen am Root** (z.B. `site-scan-2026-05-03.md`)
  -> Keep wenn es ein Audit/Report ist (Pattern oben), sonst classify

## Common Mistakes

| Fehler | Fix |
|---|---|
| Hauptdatei in `notes/` verschoben weil "kurz" | Hauptdatei = Foldername.md, IMMER pruefen |
| `.DS_Store` in `_archive/` statt deleted | `.DS_Store` ist immer DELETE, nie Archive |
| Apply ohne dry-run gezeigt | Verboten. Erst Plan, dann fragen, dann Apply |
| `git rm` auf untracked -> Error | git-status pro File checken bevor du den Befehl waehlst |
| Lose Bilder ohne Klassifizierung gemoved | Bei Bildern Filename-Hint nutzen (`logo*` -> brand-assets, `ad-*` -> creatives) |
| Recursion in alle Subfolders -> false positives | Default = nur Root-Level pro Project. Deep nur auf Wunsch. |

## Cycle-Time-Erwartung

- Scan: ~5 sec pro Project (file-stat + erste 500B reads)
- Plan-Output: instant
- Apply: ~10 sec (mv + rm sind cheap)
- **Real run komplette `projects/`: 30-60 sec inkl. Approval**
