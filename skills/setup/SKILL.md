---
name: setup
description: Use when der Mensch /setup schreibt, nach jedem Neustart mitten im Setup, oder wenn Module eingerichtet, geprueft oder fortgesetzt werden sollen.
---

# Setup, der Concierge

Du richtest fuer einen Menschen ohne Technik-Hintergrund einen persoenlichen
Assistenten ein: 24/7 auf diesem Server, erreichbar ueber Telegram, mit
Gedaechtnis, Regeln und Selbstheilung. Der Assistent lebt unter
/root/assistent: ein Klon des Kits, der durch die Personalisierung zum
eigenen Repo wird. Zwei Remotes: `kit` (Updates vom Autor, nur lesen) und
`origin` (die eigene private Sicherung auf GitHub).

## Regel 1: Bestandsaufnahme zuerst, bei jedem Einstieg

Harte Regel. Bevor irgendetwas eingerichtet, geaendert oder fortgesetzt wird:
pruefen und berichten, was schon da ist. Auch nach einem Neustart mitten im
Setup, auch wenn der Mensch "mach weiter" schreibt.

Die Checks, alle ausfuehren:

```bash
claude --version
bun --version 2>/dev/null || echo "bun: fehlt"
git --version
ffmpeg -version 2>/dev/null | head -1 || echo "ffmpeg: fehlt"
chromium --version 2>/dev/null || chromium-browser --version 2>/dev/null || echo "chromium: fehlt"
python3 -c "import faster_whisper; print('faster-whisper: ok')" 2>/dev/null || echo "faster-whisper: fehlt"
gh --version 2>/dev/null | head -1 || echo "gh: fehlt"
gitleaks version 2>/dev/null || echo "gitleaks: fehlt"
grep -q superpowers /root/.claude/plugins/installed_plugins.json 2>/dev/null && echo "superpowers: ok" || echo "superpowers: fehlt"
ls /root/assistent 2>/dev/null && git -C /root/assistent remote -v || echo "repo: fehlt"
ls /root/assistent/.claude/skills/setup/SKILL.md 2>/dev/null || echo "skill-verdrahtung: kaputt"
ls /root/.claude/channels/ 2>/dev/null || echo "kanal-ordner: keine"
systemctl list-units --type=service --all 'assistent*' 'waechter*' 'nacht*' --no-pager
systemctl list-timers --all --no-pager
claude mcp list 2>/dev/null || echo "mcp: keine angeschlossen"
```

Achtung bei den Timern: `list-timers` zeigt eine NEXT-Spalte. Steht dort ein
Strich, ist der Timer enabled, aber nie gestartet worden. Er wird nie feuern.
Dann fehlt `systemctl start <name>.timer`.

Skill-Verdrahtung: `.claude/skills` ist Symlink auf die Kit-Skills
(`ls .claude/skills/setup/SKILL.md`). Meldet der Check
"skill-verdrahtung: kaputt", den Symlink neu setzen:
`mkdir -p /root/assistent/.claude && ln -sfn ../skills /root/assistent/.claude/skills`.

Danach eine kurze, gesprochene Zusammenfassung fuer den Menschen: das steht
schon, das fehlt. Keine Rohausgaben zeigen. Bereits abgeschlossene Phasen
ueberspringen, nicht erneut durchlaufen.

## Regel 2: Idempotenz

Vor jeder Aktion steht ihr Check. Nichts wird blind neu angelegt:

- Datei schreiben: erst pruefen, ob sie existiert und was drinsteht.
- Dienst anlegen: erst `systemctl status <name>` pruefen.
- Paket installieren: erst pruefen, ob es installiert ist.
- Ordner anlegen: `mkdir -p`, nie Bestehendes ueberschreiben.

Laeuft das Setup zum zweiten Mal, darf nichts kaputtgehen und nichts doppelt
entstehen.

## Regel 3: Fehler-Protokoll

Wenn etwas fehlschlaegt:

1. Fehlermeldung selbst lesen und verstehen.
2. Passenden Artikel unter wissen/ aufschlagen und anwenden.
3. Bis zu drei verschiedene Loesungswege probieren, nicht dreimal denselben.

Der Mensch sieht waehrenddessen nur: "kurzer Umweg, ich kuemmere mich."
Erst wenn alle drei Wege scheitern, eskalieren: in einfacher Sprache sagen,
was klemmt, und die EINE Handlung nennen, die vom Menschen gebraucht wird.
Nie Roh-Fehlerausgaben in den Chat kippen.

## Regel 4: Gespraechsregeln

- Einfache Sprache. Der Mensch ist kein Techniker. Fachwoerter nur, wenn
  sie erklaert werden.
- Ein Schritt pro Nachricht. Nie drei Anweisungen auf einmal.
- Muss der Mensch selbst etwas tun (Konto anlegen, Token kopieren, Link
  oeffnen): exakte Handlungsanweisung geben, dann warten. Nicht weiterbauen,
  waehrend die Antwort aussteht.
- Jeder Abschnitt endet mit einem Fertig-wenn-Check, und der wird wirklich
  ausgefuehrt, nicht nur behauptet.
- Nichts als erledigt melden, dessen Check nicht bestanden ist.

## Regel 5: Timer statt Vorsatz

Alles, was erinnert werden oder wiederkehren soll (Erinnerungen, Reports,
Abgleiche), wird IMMER als systemd-Timer angelegt, nie als Vorsatz im Chat
("ich melde mich morgen"). Bestaetigung immer mit Uhrzeit: "Steht, laeuft
taeglich um 7:00." Vorlagen fuer Unit und Timer: vorlagen/.

Fertig wenn: `systemctl list-timers --no-pager` den Timer mit echtem
NEXT-Zeitpunkt zeigt (kein Strich).

## Ausblick, direkt nach der VS-Code-Verbindung

Sobald die VS-Code-Verbindung steht (Phase 2), einmal kompakt zeigen, wohin
die Reise geht. Eine kurze, konkrete Tour, keine Featureliste; sie sitzt
frueh, damit der Mensch weiss, wofuer die naechsten Schritte sind.

**Das wirst du haben:** einen Telegram-Assistenten rund um die Uhr auf diesem
Server. Sprachnachricht rein, Sprachmemo raus. Mail-Entwuerfe kommen als Bild
zur Freigabe, nichts geht ungefragt raus. Ein Morgenreport zur Wunschzeit.
Ein eigener Coach-Bot mit festen Ritualen. Und Selbstheilung: faellt etwas
aus, repariert sich das System selbst und meldet es.

**Das sind die eingebauten Faehigkeiten** (je ein Satz, in den Worten des
Menschen erzaehlen):

- daily-review: der Tagesabschluss am Abend.
- weekly-review: der Wochenrueckblick am Sonntag.
- monthly-review: der Monatsrueckblick zum Monatsende.
- morning-ritual: der Start in den Tag mit Plan und Fokus.
- plan-week: die Woche einmal sauber durchplanen.
- coach-mode: ein freies Coaching-Gespraech, wann immer gebraucht.
- coach-setup: das grosse Ziele-Gespraech, das das Coaching aufsetzt.
- breakthrough: eine Tiefen-Session, wenn etwas feststeckt.
- prime: der Assistent laedt seinen kompletten Kontext.
- project: volles Projektwissen laden oder ein neues Projekt anlegen.
- push-tasks: offene Aufgaben in die Aufgabenliste druecken.
- email: Posteingang sichten und vorsortieren.
- focus: Hilfe beim Anfangen, wenn der Kopf blockiert.
- cleanup: Ordner und Ablage aufraeumen, erst als Vorschau.
- kit-abgleich: einmal die Woche schauen, was es im Kit Neues gibt.

**Und danach:** der Tool-Katalog (Mail, Kalender, Aufgaben und mehr) kommt in
einer eigenen Session, Stueck fuer Stueck nach Wahl.

Abschluss immer: "Jetzt bauen wir das. Naechster Schritt: ..." und den
tatsaechlich naechsten Schritt nennen.

## Onboarding-Showcase, nach dem ersten Bot

Sobald der erste Bot antwortet (Ende Phase 4), nicht einfach "fertig" sagen.
Der Bot stellt sich im Chat kurz selbst vor und gibt dem Menschen drei
konkrete Beispiel-Auftraege zum sofort Ausprobieren, etwa:

1. "Schick mir eine Sprachnachricht, ich antworte dir mit einem Sprachmemo."
2. "Frag mich: was steht in meinem Kalender?" (wenn angeschlossen, sonst
   ein Auftrag zu einem angeschlossenen Werkzeug)
3. "Gib mir eine Aufgabe mit Frist, ich erinnere dich puenktlich."

Danach die erste Automation anbieten: einen Morgenreport.

- Uhrzeit erfragen.
- systemd-Timer plus Report-Skript anlegen (Regel 5 gilt).
- Inhalt: Rueckblick auf gestern plus Plan fuer heute. Die Terminuebersicht
  schaltet sich zu, sobald der Kalender angeschlossen ist. Genau das dem
  Menschen so ansagen, damit klar ist, was heute schon kommt und was spaeter
  dazukommt.

Fertig wenn: der Timer steht mit NEXT-Zeitpunkt und der Mensch den ersten
Report im Chat bestaetigt hat.

## Modul-Katalog

Module in sinnvoller Reihenfolge anbieten, aber der Mensch entscheidet.
Vor jedem Modul: Bestandsaufnahme des Moduls. Nach jedem Modul: Fertig-wenn
ausfuehren.

### PC-Arbeitsplatz

VS Code auf dem eigenen Rechner, Remote-SSH auf diesen Server, dazu die
Claude-Extension. Damit laufen groessere Projekte am grossen Bildschirm,
der Alltag bleibt in Telegram.

Fertig wenn: der Mensch in VS Code eine Datei unter /root/assistent
geoeffnet hat und die Claude-Extension im Remote-Fenster antwortet.

### Tool-Stack

Werkzeuge anschliessen (Mail, Kalender, Aufgaben, weitere). Ablauf und
Reihenfolge: wissen/tool-stack.md. Grundmuster:

- Werkzeuge mit API-Key: der Mensch schickt den Key im Chat, Ablage nach
  Env-Muster (vorlagen/env-muster), nie im Klartext zurueckgeben.
- Werkzeuge mit OAuth: laufen ueber VS Code am eigenen Rechner, weil der
  Browser-Login dort moeglich ist. Exakte Klick-Anweisung geben, warten.
- Nach JEDEM Anschluss: Selbst-Neustart der Session, denn neue MCPs werden
  erst nach Neustart sichtbar. Danach wieder Bestandsaufnahme (Regel 1),
  dann weiter.

Fertig wenn: `claude mcp list` das neue Werkzeug als verbunden zeigt und
ein Lese-Testaufruf Daten liefert.

### Sprache

Sprachnachrichten rein (Transkription lokal, skripte/transcribe.py) und
Sprachmemos raus (skripte/sprachmemo.sh). Braucht ffmpeg und faster-whisper.
Fuer die kontingentfreie Fallback-Stimme: piper per `pip install piper-tts`
plus die Stimme de_DE-thorsten-medium nach /root/.local/share/piper-voices/
(genauer Ablauf: wissen/sprache.md).

Fertig wenn: eine Test-Sprachnachricht des Menschen korrekt transkribiert
wurde und ein Sprachmemo im richtigen Chat angekommen ist.

### Coaching-Bot

Zweiter Bot mit eigenem Token, eigenem Kanal-Ordner unter
/root/.claude/channels/ und der Rolle rollen/coaching-rolle.md (Kopie aus
vorlagen/). Eigener Gedaechtnis-Ordner coaching/. Nach dem Start folgt
das Ziele-Gespraech (Skill coach-setup): 60 bis 90 Minuten, fuellt
Identitaet, Werte und Zielbild. Danach laufen daily-review, weekly-review
und monthly-review.

Fester Bestandteil des Moduls sind die drei Review-Timer: taeglich abends
der Tagesabschluss (daily-review), sonntags der Wochenrueckblick
(weekly-review), am Monatsende der Monatsrueckblick (monthly-review).
Uhrzeiten beim Menschen erfragen (Regel 5 gilt). Der Timer schickt nur die
Erinnerung ueber den Coach-Bot; das Ritual selbst startet erst, wenn der
Mensch darauf antwortet.

Fertig wenn: der Coaching-Bot in seinem eigenen Chat antwortet, der
Hauptbot davon unberuehrt weiterlaeuft, das Ziele-Gespraech
abgeschlossen ist (.setup-progress steht auf done) und die drei
Review-Timer in `systemctl list-timers` mit echtem NEXT stehen.

### Master-Vision-Seite

Die Ein-Seiten-Zusammenfassung aus dem Ziele-Gespraech (Stufe 10 von
coach-setup) als gehostete, passwortgeschuetzte Seite: vom Handy lesbar
und editierbar, ohne Deploy. Vorlage: vorlagen/master-vision-site/
(Anleitung im dortigen README). Braucht Netlify (wissen/tool-stack.md).

Fertig wenn: die Seite hinter dem Passwort laedt und die Master-Vision
zeigt.

### Automatik

Waechter und Nacht-Neustart aus den Vorlagen (waechter.service,
waechter.timer, nacht-neustart.service, nacht-neustart.timer), dazu die
gewuenschten wiederkehrenden Reports (Regel 5).

Fertig wenn: alle Timer in `systemctl list-timers` mit echtem NEXT stehen
und der Waechter einen absichtlich gestoppten Bot wieder hochgeholt hat.

### Weitere Bots

Je Zweck ein Bot: eigener Token, eigener Kanal-Ordner, eigene Rolle als
Kopie aus vorlagen/bot-rolle.md, eigener systemd-Dienst. Jeder neue Dienst
kommt in SERVICES der waechter.conf. Ab dem zweiten Bot zusaetzlich den
woechentlichen Reihum-Neustart einrichten: vorlagen/wochen-neustart.service
plus vorlagen/wochen-neustart.timer (sonntags 04:00, startet alle Dienste
aus waechter.conf gestaffelt neu).

Fertig wenn: der neue Bot in seinem Chat antwortet und
`systemctl status <dienst>` aktiv zeigt.

### Woechentlicher Kit-Abgleich

Timer, der einmal pro Woche im eigenen Repo `git fetch kit` zieht,
die Aenderungen liest und dem Menschen im Chat vorschlaegt, was davon
uebernommen werden soll. Nichts ungefragt uebernehmen.

Fertig wenn: der Timer steht und ein Probelauf eine Zusammenfassung der
Kit-Aenderungen (oder "keine Aenderungen") in den Chat geschickt hat.

### Lernschleife

Korrekturen und selbst bemerkte Fehler werden zu Dateien im Gedaechtnis,
nach den Regeln im Abschnitt "Lernen" der CLAUDE.md-Vorlage: ein Satz
Regel, Vorfall mit Datum, Anwendung. Widerlegtes wird geloescht.

Fertig wenn: die erste echte Korrektur des Menschen als Datei liegt und
der Mensch den Wortlaut bestaetigt hat.
