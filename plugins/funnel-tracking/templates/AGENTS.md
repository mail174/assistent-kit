# AGENTS.md · {{REPO}}

Gilt für jeden Agenten und jedes LLM, das in diesem Repo arbeitet (Claude, Codex, andere), und für Menschen genauso.

## Changelog-Pflicht

1. **Vor jedem Prod-Deploy ein neuer Eintrag oben in `CHANGELOG.md`.** Format steht im Kopf der Datei. Ein Eintrag pro deployter, inhaltlicher Änderung, nicht pro Edit.
2. **Deploy nur über `npm run deploy`** aus diesem Ordner. Nie `netlify deploy --prod` direkt. Das Script prüft die Site, verweigert ohne Eintrag, deployt, prüft die Live-Seite, stempelt Deploy-ID und Commit in den Eintrag und spiegelt ihn in den Store. Ein Claude-Hook und ein PATH-Shim blocken den direkten Weg zusätzlich.
3. `npm run deploy:check` zeigt vorher, ob alles passt, ohne zu deployen.
4. Gleicher Stand nochmal (Retry): `node scripts/deploy.mjs --redeploy`. Kein Fake-Eintrag.
5. Sync in den Store fehlgeschlagen: `node scripts/deploy.mjs --sync-only`.
6. Den Stempel-Commit (`changelog: deploy …`) nicht wegwerfen. Push bleibt manuell.
7. Der Fragenkatalog (`STEPS` in den in `MANIFESTS` genannten Dateien) wird beim Deploy automatisch gebündelt und als Manifest in den Store gestempelt; die Auswertungsseite zeigt die Fragen je Version. Neue Fragen brauchen nur eine `id`, die das Tracking als `step_label` sendet, und einen `question`-Text.

Funnels: {{FUNNELS}}. `site` ist nur für Seiten außerhalb der Funnels (Homepage-Texte, Demo, Rechtliches) und erzeugt keine Funnel-Row im Store. Was einen Funnel berührt, auch gemeinsamer Code wie Tracking oder Pixel, nennt die betroffenen Funnels ausdrücklich. Kategorien: hero, quiz, form, ads, copy, tracking, mail, other.

Warum: Die Analytics-Dashboards zeigen die Einträge als Änderungsliste je Funnel. Ohne Eintrag lässt sich keine CR-Bewegung einer Änderung zuordnen.

## Weitere Regeln

- Kommentare, Copy und Commit-Messages auf Deutsch. Keine Gedankenstriche im Em-Dash-Stil (weder Geviertstrich noch Halbgeviertstrich als Gedankenstrich), stattdessen Punkt, Komma, Doppelpunkt oder zwei Sätze.
- Preview-Deploys (`netlify deploy --alias …`) brauchen keinen Eintrag.
- Ist dieses Repo ein Submodul: erst hier pushen, dann im Hauptrepo.
- `.netlify/state.json` liegt lokal und ist nicht in git. Deploys laufen über die feste `SITE_ID` in `scripts/deploy.mjs`.
