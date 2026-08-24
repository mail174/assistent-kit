---
name: push-tasks
description: Use when der Mensch geplante Aktionen aus der Projekt-Planung in die Aufgabenliste uebertragen will, "/push-tasks" schreibt, oder markierte Aktionen gepusht werden sollen.
---

# Push Tasks

> Uebertraegt Aktionen, die in der Projekt-Planung zum Push markiert sind,
> in die Aufgabenliste des Menschen.
>
> Braucht beides: eine Planungs-Quelle <wenn ein Projekt-Tool wie Notion
> angeschlossen ist> und eine Aufgabenliste <wenn Google Tasks oder
> vergleichbar angeschlossen ist>. Fehlt eines, sagen was fehlt und
> stoppen.

## Step 1: Markierte Aktionen abfragen

Aus der Planungs-Quelle alle Aktionen mit Status "Push" holen. Pro Aktion
extrahieren:

- ID des Eintrags
- Titel
- Faelligkeitsdatum (kann leer sein)
- Notizen
- Projekt-Zuordnung (fuer den Kontext in den Notizen)

## Step 2: In die Aufgabenliste pushen

Fuer jede Aktion eine Aufgabe anlegen:

- Mit Faelligkeitsdatum: in die Liste fuer terminierte Aufgaben.
- Ohne Faelligkeitsdatum: in die Backlog-Liste.
  (Die konkreten Listen-Namen oder -IDs stehen in context/projekte.md,
  beim ersten Lauf einmal festlegen und dort notieren.)

Felder: Titel wie in der Planung, Faelligkeit wenn vorhanden, Notizen
inklusive Projekt-Kontext.

## Step 3: Planungs-Quelle zurueck-updaten

Fuer jede gepushte Aktion im Planungs-Eintrag setzen:

- Status = "Pushed"
- Aufgaben-ID = ID aus der Create-Antwort

## Step 4: Report

```
X Aufgaben terminiert gepusht
Y Aufgaben ins Backlog gepusht
[Liste der Titel plus Ziel-Liste]
```

## Wichtig

- **Idempotenz:** ist bei einer Aktion die Aufgaben-ID schon gesetzt,
  NICHT nochmal pushen: ueberspringen und warnen.
- **Fehler:** bei einem einzelnen Fehler weitermachen, am Ende sammeln
  und berichten.
- **Nie loeschen:** nur Status und Aufgaben-ID aktualisieren, nichts
  entfernen.
