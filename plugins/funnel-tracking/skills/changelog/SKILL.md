---
name: changelog
description: "Use when ein Funnel-Repo die Changelog-Pflicht braucht oder ohne CHANGELOG.md deployt werden soll: 'Changelog-Pflicht ausrollen', 'Deploy-Wrapper', 'npm run deploy einrichten', 'Fragenkatalog als Manifest', oder wenn netlify deploy --prod vom Hook geblockt wurde. Rollt CHANGELOG.md, scripts/deploy.mjs, Deploy-Guard, Shim, AGENTS.md und das Manifest-Stempeln in ein Netlify-Funnel-Repo aus."
---

# funnel-tracking:changelog

Nach dem Rollout gilt im Repo:

- `CHANGELOG.md` im Repo-Root ist die Quelle. Eintrag oben, Format im Kopf
  der Datei (`## JJJJ-MM-TT · funnel[,funnel] · kategorie · Titel`,
  Kategorien hero, quiz, form, ads, copy, tracking, mail, other).
- `npm run deploy` ist der einzige Prod-Weg. Bricht ohne ausstehenden
  Eintrag ab, prueft die Site-ID gegen den Namen, buendelt den Fragenkatalog,
  deployt, prueft die Live-Seite auf den neuen Build, stempelt Deploy-ID und
  Commit in den Eintrag, committet den Stempel, spiegelt Eintrag und
  Manifest in den Store (eine Row je Funnel).
- Rohes `netlify deploy --prod` wird geblockt, dreifach: Plugin-Hook
  (`hooks/deploy-guard.py`, gilt ueberall, wo das Plugin aktiv ist),
  Repo-Hook ueber `settings.json` (gilt auch ohne Plugin) und PATH-Shim fuer
  alle anderen (andere Agenten, Menschen, Cron).
- `AGENTS.md` (Quelle) und `CLAUDE.md` (`@AGENTS.md`) im Repo,
  Banner-Kommentare in den Kernfiles.

Vorlagen: `templates/` im Plugin-Root (zwei Ebenen ueber dieser Datei), Pfad
zur Laufzeit ermitteln, nicht raten. Inventur und Nachfragen:
`funnel-tracking:rollout`.

## Dateien anlegen

| Vorlage | Ziel im Repo | Anpassen |
|---|---|---|
| `changelog-lib.mjs` | `scripts/changelog-lib.mjs` | nichts, 1:1 |
| `changelog-lib.test.ts` | `scripts/changelog-lib.test.ts` | nichts, 1:1 |
| `deploy.mjs` | `scripts/deploy.mjs` | Konfig-Block: `SITE_ID`, `SITE_NAME`, `PROD_URL`, `FUNNELS` (mit `"site"` am Ende), `PUBLISH_DIR`, `MANIFESTS` (je Funnel die `steps.ts` mit Export `STEPS`); `sink()` ist auf die Netlify DB der Site eingestellt (`NETLIFY_DB_URL`, Tabelle `funnel_events`), bei anderem Store austauschen |
| `deploy-guard.py` | `scripts/deploy-guard.py` | nichts |
| `settings.json` | `.claude/settings.json` | nichts (bei bestehender Datei den Hook mergen) |
| `AGENTS.md` | `AGENTS.md` | `{{REPO}}`, `{{FUNNELS}}`; bestehende Repo-Regeln unten anhaengen |
| `CLAUDE.md` | `CLAUDE.md` | nichts |
| `CHANGELOG.md` | `CHANGELOG.md` | `{{REPO}}`, `{{FUNNELS}}`, `{{DATE}}` |
| `banner.txt` | Kopf von `netlify.toml`, Build-Config, App-Einstieg, jeder Tracking-Lib, Event-Sink | passende Kommentar-Variante |

Dazu in `package.json`: `"deploy": "node scripts/deploy.mjs"`,
`"deploy:check": "node scripts/deploy.mjs --check"`, und der Schluessel
`"funnelChangelog": "Prod-Deploy nur ueber npm run deploy. Regeln: AGENTS.md"`
(package.json kennt keine Kommentare). Vitest-Include um
`scripts/**/*.{test,spec}.{ts,mjs}` erweitern.

Der Event-Sink darf `site_changelog` und `funnel_manifest` **nicht** in seine
erlaubten Event-Typen aufnehmen. Der Browser darf keine Changelog-Rows
erzeugen koennen.

## Fragenkatalog als Manifest

`MANIFESTS` im Konfig-Block zeigt je Funnel auf die `steps.ts` (Export
`STEPS`). `deploy.mjs` buendelt sie vor dem Deploy mit esbuild (ohne Katalog
kein Deploy) und schreibt nach dem Deploy je Funnel eine Row
`funnel_manifest` in den Store (`session_id "__changelog__"`, `step_label` =
Hash, `metadata.steps` mit `id`, `kind`, `question`, `conditional`,
`options`). Die Auswertungsseite schneidet daraus Versionen und zeigt die
Fragen je Version (Details: `funnel-tracking:analytics`). Der Katalog muss
ein `STEPS`-Array mit `id` (= `step_label` im Tracking), `question` und
optional `options[{value,label}]` exportieren; `showIf` wird nur als Flag
uebernommen, `optionsFrom` nicht aufgerufen. Neuer Funnel im Repo: Eintrag in
`MANIFESTS` plus Funnel-Name in `FUNNELS`.

`NETLIFY_DB_URL` auf der Funnel-Site **nicht als Secret** setzen:
`deploy.mjs` liest den Wert ueber `netlify env:get`, und als Secret markierte
Werte kommen dort nur maskiert zurueck. Der Sink scheitert dann mit "not a
valid URL", und zwar erst nach dem Deploy. `--sync-only` holt Changelog-,
Experiment- und Manifest-Rows nach.

## Sperren

- Plugin-Hook liegt mit `hooks/hooks.json` automatisch an.
- Repo-Hook ueber `.claude/settings.json` zusaetzlich, damit die Sperre auch
  ohne Plugin greift.
- Shim: `bash <plugin-root>/scripts/install-shim.sh`. Er legt ein
  `netlify`-Skript in `~/.local/bin`, das `--prod` in einem Repo mit
  Changelog-Marker abweist und sonst an die echte CLI durchreicht. Nur
  sinnvoll, wenn `~/.local/bin` im PATH vor dem echten CLI liegt.

## Abnahme

Alles im Repo-Ordner:

1. `npm test` gruen, inklusive `scripts/changelog-lib.test.ts`.
2. Hook:
   `echo '{"cwd":"<repo>","tool_input":{"command":"netlify deploy --prod"}}' | python3 scripts/deploy-guard.py; echo $?`
   gibt `2` und den Hinweis. Mit `--alias x` statt `--prod` gibt es `0`.
   Kaputtes JSON gibt `0`. Dreimal laufen lassen: mit `HOME`, mit
   `env -u HOME sh -c '...'`, ohne die Variable. Breiter:
   `python3 <plugin-root>/scripts/test-deploy-guard.py scripts/deploy-guard.py <repo-mit-marker> <repo-ohne-marker>`
   (18 Faelle).
3. Shim: `netlify deploy --prod --site <id>` im Repo endet mit Exit 2, ohne
   dass das echte CLI laeuft. `netlify status` laeuft normal.
4. `npm run deploy:check` bestaetigt Site-Name, ausstehenden Eintrag und die
   Fragenkataloge.
5. Erst nach dem Go des Menschen: `npm run deploy`. Danach pruefen: neuer
   veroeffentlichter Deploy, Stempel-Commit im Repo, Rows im Store, Funnel in
   der Auswertungsseite. Retry desselben Stands:
   `node scripts/deploy.mjs --redeploy`, Sync nachholen: `--sync-only`.

## Grenzen

Kein Prod-Deploy ohne Go. Keine Secrets ausgeben. Vorlagen im Plugin sind die
Quelle: Verbesserungen an `deploy.mjs` oder `changelog-lib.mjs` erst in der
Vorlage, dann in die Repos nachziehen. Keine Gedankenstriche im Em-Dash-Stil.
