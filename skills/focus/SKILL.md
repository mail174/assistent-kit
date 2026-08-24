---
name: focus
description: Use when der Mensch Hilfe mit Focus/Executive-Function braucht - "/focus", "ich kann nicht anfangen", "Task-Paralyse", "brain stuck", "open loops", "dopamine menu", "body double", "brain dump", "context switch", "ADHD-mode", "ich vergesse die Zeit", "boring task gamify". Sieben Modi: break-down, dopamine-menu, body-double, switch, gamify, time-map, brain-dump. Ein Trigger, der Mensch waehlt den Modus (oder das Modell waehlt basierend auf der Situation).
---

# /focus - Executive Function Toolkit

## Overview

Sieben kuratierte Prompt-Modi fuer typische Focus/ADHD-Situationen. Der
Mensch triggert mit `/focus` oder einer der Symptom-Phrasen - das Modell
erkennt aus dem Kontext, welcher Modus passt, sonst Menu anzeigen.

## When to Use

- Der Mensch sagt explizit `/focus`, "focus mode", "ADHD-Hilfe", "ich
  brauch Struktur"
- Der Mensch beschreibt ein Symptom aus der Modus-Matrix unten
- Mid-Session: der Mensch merkt selbst "ich kipp gerade" und braucht
  Re-Anchor

**NICHT verwenden:**

- Strategie-Decisions (das ist `coach-mode` <wenn vorhanden>)
- Konkrete Aufgaben, die einfach erledigt werden koennen (just do it)
- Wenn der Mensch klar ein anderes Skill braucht (Daily Review, Project,
  etc.)

## Modus-Matrix - Symptom -> Modus

| Symptom | Modus | Was passiert |
|---|---|---|
| "Ich starre an die Task, kann nicht anfangen" | **break-down** | Ridiculously-small Steps, erste Hand-Position |
| "Bin unterstimuliert, langweilig" | **dopamine-menu** | 5/20/10-min Aktivitaets-Menue |
| "Bleibst du bei mir waehrend ich arbeite?" | **body-double** | Virtual co-working mit Check-ins |
| "Brain ist noch in Task A, soll Task B machen" | **switch** | 3-min Mental-Palate-Cleanser |
| "Diese Admin-Task ist so langweilig" | **gamify** | Quest-Struktur via Hyper-Fixation |
| "Dachte 20 min, sind 2 h geworden" | **time-map** | Hidden-Sub-Tasks aufdecken |
| "Mein Kopf ist voll Open Loops" | **brain-dump** | Now/Later/Trash + Next-Steps |

Wenn unklar welcher Modus passt -> kurzes Menu posten (1 Zeile pro
Modus), den Menschen picken lassen.

## Die sieben Modi

### 1. break-down - Task-Paralyse-Shatterer

**Trigger:** "Ich kann nicht anfangen mit X", "starre an die Task",
"blockiert"

**Was du machst:**
1. Frag: "Was ist die Task konkret?" (wenn nicht klar)
2. Zerlege in Steps von **<60 Sekunden** Dauer - physisch beschreibbar
3. Gib NUR den ersten Step zurueck, mit Hand-Position: "Oeffne den
   Laptop. Klick auf X-Icon im Dock. Schreib in die Adresszeile: ..."
4. Sag: "Wenn der erste Step done ist, sag mir Bescheid fuer den
   naechsten" - keep momentum mit Drip-Reveal

**Anti-Pattern:** Nicht alle 12 Steps auf einmal posten. Genau einer.
Der naechste kommt on demand.

### 2. dopamine-menu - Stimulation-Menue

**Trigger:** "Bin unterstimuliert", "langweilig", "Hirn braucht Snack",
"Pause vorschlag?"

**Was du machst:**
Bau ein Menu in drei Sektionen, jeweils 3-4 Optionen, alle konkret und
auf den Kontext des Menschen zugeschnitten (Ort, Arbeitssituation,
Equipment das verfuegbar ist):

- **Appetizers (5 min):** schnelle Bewegung - Treppe rauf+runter,
  Liegestuetze, kurz raus ans Tageslicht, Gesicht mit kaltem Wasser
- **Entrees (20 min):** Deep Work / Single-Focus - eine Notiz fertig
  schreiben, ein kleines Stueck Arbeit abschliessen, etwas deployen
- **Sides (10 min):** Creative Play - Sprachmemo Brainstorm, eine Idee
  notieren, eine Hand-Zeichnung, kurze Skizze

Format: emoji + Name + 1-Satz Wirkung. Keine Erklaerungs-Litanei.

### 3. body-double - Virtual Co-Working

**Trigger:** "Bleib bei mir", "body double", "co-work mit mir",
"begleite mich durch X"

**Was du machst:**
1. Frag: "Wie lang? (15 / 30 / 60 min) Was bearbeitest du?"
2. Bestaetige Setup mit 1 Satz: "Ok - 30 min, [Task]. Ich pinge dich
   alle 10 min."
3. Keine automatischen Timer-Reminders schedulen - stattdessen: der
   Mensch pingt nach jedem Block selbst kurz "im Flow" / "stuck" -> du
   reagierst mit 1-Satz Re-Anchor
4. Check-in Format (wenn der Mensch pingt oder ein Zeit-Update kommt):
   - "[HH:MM] - Status?" -> wartet auf "flow" / "stuck" / "done"
   - Bei "stuck": sofort `break-down` Modus auf Sub-Step
   - Bei "flow": ein einziges Wort zurueck ("weiter") - keine
     Conversation
5. End-of-Block: 1-Satz Anerkennung + Frage ob weiter

**Anti-Pattern:** Nicht mit Motivations-Sprueche labern. Body-Doubling
= Praesenz, nicht Coaching.

### 4. switch - Context-Switching Guide

**Trigger:** "Komme nicht raus aus Task A", "muss jetzt B machen aber
Kopf haengt fest", "context switch"

**Was du machst:**
Liefere eine **3-Minuten-Routine** in drei Schritten, immer angepasst
auf den konkreten Switch:

1. **Close-Out Task A (60s):** Eine 2-Satz Notiz: "Letzter Stand: X.
   Naechster Move: Y." -> Brain weiss, es ist nicht verloren
2. **Body-Reset (60s):** Physisch - Kniebeugen / kaltes Wasser /
   Treppe / Atem-Reset (4-7-8). Wichtig: nicht Screen.
3. **On-Ramp Task B (60s):** Lade eine *erste*, *trivial-kleine*
   Aktion in Task B - File oeffnen, ein Doc lesen, einen Satz
   schreiben. Kein Big-Lift.

Format: nummerierte Liste mit Sekunden-Zeit + konkrete Aktion. Keine
Theorie.

### 5. gamify - Boring Task + Hyper-Fixation

**Trigger:** "Diese Admin-Task ist langweilig", "kann mich nicht
aufraffen", "gamify das"

**Was du machst:**
1. Frag: "Was ist die boring Task? Und worauf bist du aktuell
   hyper-fixiert?" (wenn nicht klar - checke die aktuellen Projekte
   des Menschen als Default-Fixation, z.B. `context/projekte.md` <wenn
   vorhanden>)
2. Bau eine **Quest-Struktur:**
   - Quest-Title (drama, Hyper-Fixation-coded)
   - 3-5 Sub-Missions (Mikro-Steps der eigentlichen Task)
   - XP pro Mission (arbitraere Zahlen, fuehlt sich gut an)
   - **Unlock-Reward:** Konkret + sofort einloesbar - 15 min an der
     Hyper-Fixation arbeiten, ein Video schauen, etc.
3. Output: Quest-Card in Markdown, Sub-Missions als Checkboxen

**Beispiel-Frame:** Boring=Buchhaltung sortieren, Fixation=eigenes
Hobby-Projekt -> Quest "Operation Clean Ledger - entsperre 20 min
Brainstorm am Hobby-Projekt".

### 6. time-map - Time-Blindness Auditor

**Trigger:** "Wie lang braucht X realistisch?", "ich unterschaetze
Zeiten", "time-map this", "ist 20 min realistisch?"

**Was du machst:**
1. Frag: "Was schaetzt du? Was war's beim letzten Mal tatsaechlich?"
2. Decke **drei Hidden Sub-Tasks** auf, die typisch vergessen werden:
   - **Context-Loading:** Notiz oeffnen, letzten Stand lesen, Tool
     hochfahren -> meist 5-15 min
   - **Decision-Friction:** "Welcher Approach?" -> meist 10-30 min
     wenn nicht prep'd
   - **Tail-End:** Commit, Deploy, Verify, Update melden, Stand
     festhalten -> meist 10-20 min
3. Sag eine **realistische Range** mit 1.5x-3x Multiplier auf die
   Schaetzung des Menschen + Begruendung welche Sub-Task die groesste
   Variable ist
4. Frag: "Willst du das im Kalender blocken?" <wenn Kalender
   angeschlossen> -> wenn ja, Termin vorschlagen oder direkt anlegen

**Anti-Pattern:** Nicht moralisieren ("du unterschaetzt immer..."). Nur
die versteckten Sub-Tasks aufzeigen + Range geben.

### 7. brain-dump - Executive Function Externalizer

**Trigger:** "Kopf ist voll", "open loops ueberall", "brain dump",
"sortier das mit mir"

**Was du machst:**
1. Sag: "Dump alles rein. Bullets oder Fliesstext, egal. Ich sortier
   nachher."
2. Der Mensch pastet alles. Du:
   - **Now** - heute / diese Session loesbar, <30 min Aufwand
   - **Later** - wichtig aber nicht heute -> optional in die
     Aufgabenliste eintragen <wenn Aufgabenliste angeschlossen ist>,
     mit Projekt-Kuerzel falls das im Kontext ueblich ist
   - **Trash** - Sorgen ohne Aktion, Hypotheticals, "ich sollte mal..."
     Items
3. Fuer jedes **Now**-Item: **EINEN konkreten Next-Step in 1 Satz**
   (Verb-first, <60s actionable)
4. Output-Format:

```
## Now (3)
- [Item] -> Next: [Verb + konkret]
- ...

## Later (5)
- [Item]  (-> optional: Projekt-Kuerzel)
- ...

## Trash (2)
- [Item] - Reason: pure worry, no action
- ...
```

5. Optional am Ende: "Willst du die Later-Items in die Aufgabenliste
   pushen?" <wenn Aufgabenliste angeschlossen ist>

## Quick Reference - Trigger-Mapping

```
"kann nicht anfangen"      -> break-down
"langweilig / unterstimuliert" -> dopamine-menu
"bleib bei mir / co-work"  -> body-double
"context switch / Kopf haengt" -> switch
"gamify / boring task"     -> gamify
"wie lang braucht / unterschaetze" -> time-map
"open loops / Kopf voll"   -> brain-dump
"/focus" (kein Symptom)    -> Menu anzeigen
```

## Modus-Cross-Overs

Manchmal triggert ein Modus den naechsten - das ist erwuenscht, nicht
stoppen:

- **brain-dump** -> Now-Items -> einer davon ist task-paralysis ->
  **break-down**
- **time-map** -> Range zeigt 2h -> **break-down** auf den ersten
  30-min-Block
- **body-double** -> der Mensch sagt "stuck" -> **break-down** auf
  Sub-Step
- **switch** -> Task-B-Onramp ist intimidating -> **break-down**

Wenn Cross-Over offensichtlich ist: einfach machen, nicht ankuendigen
("wechsle jetzt zu Modus X" - nein, einfach den naechsten Schritt
liefern).

## Anti-Patterns

- **Therapie-Sprache:** "Ich verstehe, dass das schwer ist..." - nein.
  Direkt zum Tool.
- **Listen-Litanei:** Alle 7 Modi erklaeren wenn nur einer relevant
  ist.
- **Generisch:** "Mach Pause" statt "Treppe 3x rauf+runter".
- **Permission-Asking:** "Soll ich dir helfen?" - nein, einfach den
  Modus liefern.
- **Coach-Drift:** Body-Double ist Praesenz, nicht Coaching. Halten.

## Common Mistakes

| Fehler | Fix |
|---|---|
| Beim break-down alle Steps auf einmal posten | Nur den ersten - der Mensch triggert den naechsten |
| Bei dopamine-menu generische Aktivitaeten | Auf Ort/Equipment/Situation des Menschen konkretisieren |
| Body-double mit Motivationssprueche aufladen | 1-Wort Antworten ("weiter") reichen |
| Brain-dump-Items in zu viele Kategorien | Strict Now/Later/Trash - keine Sub-Buckets |
| Time-map ohne Multiplier-Begruendung | Immer sagen *welche* Sub-Task die groesste Varianz hat |
