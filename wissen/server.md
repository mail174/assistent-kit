# Server: Grundausstattung und erste Fallen

## Grundausstattung vollstaendig installieren, bevor irgendetwas anderes passiert

**Regel:** Vor Claude-Login und Bot-Setup die komplette Grundausstattung installieren:
`git curl jq ripgrep tmux ffmpeg python3-pip unzip`, Node 22, **bun**, die
GitHub-CLI **gh** und ein headless Chromium, dazu faster-whisper fuer die
Transkription. bun ist Pflicht, nicht Kuer: das Telegram-Plugin laeuft darauf.
gh ebenso: ohne gh scheitern die GitHub-Sicherung (Device-Flow `gh auth login`,
`gh repo create`) in Phase 3 und die Feedback-Tickets (`gh issue create`) des
Kit-Abgleichs. Chromium braucht die Mail-Vorschau und jedes Seiten-Pruefen,
ffmpeg die Sprachmemos.

**Warum:** Beim ersten Live-Setup mit einer Gruppe am 24.08.2026 blieb der Bot eines
Teilnehmers stumm, obwohl Dienst und Token korrekt waren. Ursache: bun fehlte, das
Telegram-Plugin konnte nie starten. Die Ursache war schwer zu finden, weil von aussen
alles gesund aussah.

**Werkzeug:** `vorlagen/assistent-bot.service` und `skripte/mail-vorschau.py` setzen
diese Grundausstattung voraus.

**Fertig wenn:**
```
for c in git jq ffmpeg node bun gh python3; do command -v $c || echo "FEHLT: $c"; done
command -v chromium || command -v chromium-browser || command -v google-chrome
gh --version
```
Ausgabe: nur Pfade und eine gh-Versionszeile, keine `FEHLT:`-Zeile.

## Login-Link im Ganzen kopieren

**Regel:** Der Anmelde-Link von Claude Code (OAuth-URL) wird vollstaendig und ohne
Zeilenumbruch kopiert. Bricht das Browser-Terminal die Zeile um: Link erst in ein
leeres Dokument einfuegen, Leerzeichen und Umbrueche entfernen, dann im
Standard-Browser oeffnen. Sobald VS Code eingerichtet ist, entfaellt das Problem.

**Warum:** Am 24.08.2026 scheiterten mehrere Teilnehmer mit der Meldung
"ungueltiger redirect-Parameter". Der Link war beim Kopieren aus dem Terminal am
Zeilenumbruch zerbrochen, ein unsichtbarer Fehler.

**Werkzeug:** Die VS-Code-Verbindung aus `wissen/zugaenge.md`; ihre
localhost-Weiterleitung macht Browser-Logins trivial.

**Fertig wenn:** `claude` startet ohne erneute Anmeldeaufforderung und beantwortet
eine Testfrage.

## Wo-bin-ich-Check: Server oder eigener Rechner

**Regel:** Vor jedem Setup-Schritt klaeren, wo die Sitzung laeuft: `hostname`
ausfuehren. Zeigt es den eigenen Rechnernamen statt des Servernamens, ist man im
falschen Terminal. Befehle fuer den Server laufen NUR auf dem Server.

**Warum:** Am 24.08.2026 arbeitete ein Teilnehmer minutenlang in einer lokalen
Claude-Session auf seinem Mac und wunderte sich, dass auf dem Server nichts ankam.
Server gegen eigenen Rechner ist das groesste Konzeptloch bei Einsteigern.

**Werkzeug:** `hostname` als Bordmittel; die Rolle in `vorlagen/bot-rolle.md` laeuft
ohnehin nur auf dem Server.

**Fertig wenn:** `hostname` zeigt den Namen des Servers (steht im Panel des
Anbieters), nicht den des eigenen Rechners.
