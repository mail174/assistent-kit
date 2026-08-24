---
name: kit-abgleich
description: Use when der woechentliche Kit-Abgleich-Timer feuert, der Mensch nach Kit-Updates fragt, oder "/kit-abgleich"
---

# Kit-Abgleich

Gleicht den eingerichteten Assistenten mit dem Assistent-Kit ab und schlaegt
Neues in einfacher Sprache vor. KIT_KLON=/root/assistent-kit (die lokale
Kopie dieses Kit-Repos auf dem Server, siehe README.md dort).

## Einbahn-Prinzip

Updates kommen ausschliesslich vom Kit-Autor. Dieser Ablauf liest den
Kit-Klon und wendet Aenderungen lokal an, er schreibt nie in den Kit-Klon
zurueck und pusht nichts dorthin. Der Kit-Klon wird nur per `git fetch`
gelesen, nie per `git push` beschrieben.

## Ablauf

1. **Fetch:** `git -C /root/assistent-kit fetch`
2. **Diff seit Marker:** Datei `context/kit-stand.md` haelt den zuletzt
   behandelten Commit-Hash des Kit-Klons plus Datum. Existiert die Datei
   noch nicht, ist das der erste Lauf: als Marker den aktuellen HEAD des
   Kit-Klons setzen und diesen Lauf ohne Vorschlaege beenden (nichts ist
   "neu", wenn es der erste Abgleich ist).
   ```bash
   ALT=$(cat context/kit-stand.md 2>/dev/null | head -1)
   git -C /root/assistent-kit log --stat "${ALT}..origin/main"
   ```
3. **Gruppieren:** die veraenderten Dateien nach Bereich sortieren:
   `wissen/`, `vorlagen/`, `skripte/`, `skills/`. Jeder Bereich einzeln
   durchgehen.
4. **Vorschlagen, ein Vorschlag pro Aenderung:** in einfacher Sprache, kein
   Diff-Jargon. Muster: "Neu im Update: X. Bringt dir Y. Uebernehmen?" Der
   Mensch antwortet je Vorschlag, nicht pauschal fuer alle.
5. **Entscheidung merken** in `context/kit-entscheidungen.md`, pro Eintrag
   mit Datum und Kit-Commit-Bezug:
   - **uebernommen:** angewendet, taucht nicht wieder auf.
   - **abgelehnt:** bleibt still, so lange sich genau dieser Eintrag im Kit
     nicht nochmal aendert. Aendert er sich, wird er beim naechsten Lauf neu
     vorgeschlagen.
   - **spaeter:** wird beim naechsten Lauf erneut vorgeschlagen.
6. **Marker aktualisieren:** nach dem Durchgang `context/kit-stand.md` auf
   den aktuellen `origin/main`-Commit-Hash des Kit-Klons setzen, mit Datum.

## Personalisierte Dateien, nie ueberschreiben

`CLAUDE.md` an der Wurzel und alles unter `rollen/` sind personalisierte
Kopien aus `vorlagen/`. Hat sich die Vorlage im Kit geaendert, wird die
personalisierte Datei NIE automatisch ersetzt. Stattdessen einen
Diff-Hinweis anbieten: "Die Vorlage fuer [Datei] hat sich geaendert. Willst
du das in deine eigene Fassung uebernehmen?" Sagt der Mensch ja, den
Unterschied gezielt einarbeiten, Rest der personalisierten Datei unberuehrt
lassen.

## Nach Uebernahme von Skripten oder Units

Wurde ein Skript unter `skripte/` oder eine Unit unter `vorlagen/`
uebernommen und ist bereits als Dienst aktiv: den betroffenen Dienst neu
laden oder neu starten (`systemctl daemon-reload`, dann `systemctl restart
<dienst>`), danach den passenden Fertig-wenn-Check aus dem urspruenglichen
Setup-Schritt erneut ausfuehren. Nichts als uebernommen melden, dessen
Check nicht bestanden ist.

## Feedback-Protokoll

Scope ausschliesslich das Concierge-Projekt selbst: Setup-Strecke,
Kit-Skripte, Vorlagen, Anleitungstexte. Nicht in Scope: alles Persoenliche
des Menschen, allgemeine Wuensche, Support-Fragen zu fremden Themen. Fuer
Nicht-Scope-Themen dieses Protokoll nicht anbieten.

Stoesst der Ablauf auf einen Kit-Fehler oder faellt waehrend des Setups ein
Verbesserungspotential auf: erst fragen, nie automatisch melden.

"Darf ich das anonymisiert als Verbesserungsvorschlag an den Kit-Autor
melden?"

Nur bei Ja: `gh issue create` auf das Kit-Repo mit dem Template
`.github/ISSUE_TEMPLATE/concierge-feedback.md`. Der Text muss streng anonym
bleiben, vor dem Absenden pruefen: keine Tokens, keine Namen, keine
Serverdaten (Hostnamen, IPs, Pfade mit persoenlichen Bestandteilen). Ohne
ausdrueckliches Ja: nichts senden, nichts vorbereiten, das Thema fallen
lassen.
