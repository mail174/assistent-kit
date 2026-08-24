# Kit-Abgleich: Updates rein, Tickets raus, sonst nichts

## Einbahnstrasse: Inhalte fliessen nur vom Autor zum Nutzer

**Regel:** Kit-Inhalte fliessen NUR vom Autor zu den Nutzern, per `git pull`.
Kein Push, keine Pull-Requests, keine eigenen Commits ins Kit. Eigene Regeln,
Rollen und Skripte leben im eigenen Repo ausserhalb der kit-verwalteten Pfade
(CLAUDE.md an der Repo-Wurzel, `rollen/`, eigene `skripte/`-Ergaenzungen).

**Warum:** Das Kit ist der generalisierte Produktiv-Stack des Autors; lokale
Aenderungen darin kollidieren mit jedem Update und gehen beim naechsten Pull
verloren oder blockieren ihn. Die Trennung haelt Updates konfliktfrei.

**Werkzeug:** `vorlagen/assistent-bot-start` zeigt das Muster (Rolle als
personalisierte Kopie AUSSERHALB von `vorlagen/`).

**Fertig wenn:** `git -C <kit-ordner> status --porcelain` ist leer (keine lokal
geaenderten Kit-Dateien), und die eigenen Dateien liegen ausserhalb des Kits.

## Der Abgleich laeuft als Timer, woechentlich

**Regel:** Der Kit-Abgleich laeuft automatisch (Standard woechentlich, 14 Tage
als dokumentierte Option): `git fetch`, Diff seit dem letzten Abgleich, dann je
Aenderung ein Vorschlag in einfacher Sprache ("Neu im Update: X. Uebernehmen?").
Nichts wird ohne Zustimmung uebernommen.

**Warum:** Updates erreichen bestehende Setups nur, wenn der Abgleich von allein
laeuft; ein manueller Pull passiert nach zwei Wochen nie wieder (Idee und
Beschluss aus dem Setup vom 24.08.2026). Und ein Timer unterliegt derselben
Abnahme wie jeder andere: enabled ist nicht gestartet
(`wissen/automatik.md`).

**Werkzeug:** Timer-Paar nach dem Muster `vorlagen/nacht-neustart.service` +
`.timer`; die Pruefliste steckt in `wissen/automatik.md`.

**Fertig wenn:** `systemctl list-timers --all | grep abgleich` zeigt einen
NEXT-Zeitpunkt.

## Entscheidungen werden gemerkt

**Regel:** Jede Update-Entscheidung wird in `context/kit-entscheidungen.md`
festgehalten (Datum, Aenderung, Ja/Nein/Spaeter). Abgelehntes wird erst wieder
vorgeschlagen, wenn es sich inhaltlich aendert; "spaeter" kommt beim naechsten
Lauf automatisch wieder.

**Warum:** Ein Abgleich, der jede Woche dieselben abgelehnten Vorschlaege
bringt, nervt und wird abgeschaltet, und mit ihm alle kuenftigen Updates. Das
Entscheidungs-Gedaechtnis haelt den Lauf kurz und respektiert getroffene
Entscheidungen.

**Werkzeug:** `context/kit-entscheidungen.md` im eigenen Repo (legt der erste
Abgleich an).

**Fertig wenn:** Die Datei existiert und enthaelt je Entscheidung eine Zeile mit
Datum; der naechste Lauf schlaegt nichts erneut vor, was dort als abgelehnt
steht.

## Personalisierte Dateien: nur Diff-Hinweis, nie ueberschreiben

**Regel:** Aendert ein Update eine Vorlage, die der Nutzer personalisiert hat
(CLAUDE.md-Wurzel, `rollen/`), wird die Aenderung als Hinweis MIT Diff
angeboten, nie blind uebernommen. Der Nutzer entscheidet, welche Zeilen er in
seine Kopie zieht.

**Warum:** Ein Pull, der personalisierte Regeln ueberschreibt, wirft genau das
weg, was das Setup wertvoll macht: die eigenen Guardrails und Rollen. Deshalb
sind personalisierte Dateien Kopien ausserhalb der kit-verwalteten Pfade, und
das Update fasst sie nie direkt an.

**Werkzeug:** `git diff <alter-stand>..origin/main -- vorlagen/` als Quelle des
Hinweises; die Kopien-Konvention steht in `vorlagen/CLAUDE.md` (Abschnitt
Bots).

**Fertig wenn:** Nach einem Update mit Vorlagen-Aenderung existiert die eigene
Kopie unveraendert, und im Chat liegt der Diff-Hinweis mit der Frage, was
uebernommen werden soll.

## Feedback nur als GitHub-Issue, nur mit Erlaubnis, nur zum Setup-Projekt

**Regel:** Feedback an den Autor geht AUSSCHLIESSLICH als GitHub-Issue auf das
Kit-Repo, und nur fuer das Setup-/Concierge-Projekt selbst: Fehler in der
Setup-Strecke, kaputte oder unklare Kit-Skripte und Vorlagen. Vorher fragt der
Assistent einmal um Erlaubnis ("darf ich das anonymisiert als
Verbesserungsvorschlag melden?"); ohne Ja kein Ticket. Inhalt streng
anonymisiert: keine Tokens, keine Namen, keine Server-Details. Alles andere
(persoenliche Wuensche, allgemeine Ideen, Support-Fragen) bleibt lokal als
eigenes Learning.

**Warum:** Der Update-Kanal des Kits ist bewusst einseitig (Regel des Autors,
24.08.2026): Inhalte runter, Tickets rauf. Ein Ticket mit persoenlichen Daten
waere ein Leak in ein oeffentliches Repo, und Tickets ausserhalb des
Setup-Rahmens kann der Autor nicht beantworten.

**Werkzeug:** `gh issue create` auf dem Kit-Repo, strukturiert nach dem festen
Schema: Phase, Problem, Workaround, Vorschlag.

**Fertig wenn:** Vor dem Anlegen steht ein dokumentiertes Ja im Chatverlauf, und
`gh issue view <nr>` zeigt das Ticket ohne einen einzigen personenbezogenen
Wert.
