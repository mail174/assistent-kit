---
name: daily-review
description: Use when der Mensch den Tag abschliessen will, "/daily-review" schreibt, oder abends eine gefuehrte Tagesreflexion ansteht.
---

# Daily Review

Gefuehrter Tagesabschluss. Ton nach rollen/coaching-rolle.md: eine Frage
pro Nachricht, dann warten, kein unverdientes Lob.

## Step 0: Ritual-Check (immer zuerst)

```bash
echo "Weekly:  $(ls coaching/logs/weekly/ 2>/dev/null | sort | tail -1 || echo 'keins')"
echo "Monthly: $(ls coaching/logs/monthly/ 2>/dev/null | sort | tail -1 || echo 'keins')"
echo "Heute:   $(date +%Y-%m-%d)"
```

Daten mit heute vergleichen:

- Letztes Weekly-Log aelter als 7 Tage: vor dem Start sagen "Dein letztes
  Weekly Review ist X Tage her. Willst du stattdessen /weekly-review machen?"
- Letztes Monthly-Log aelter als 30 Tage: dasselbe fuer /monthly-review.
- Beides ueberfaellig: Monthly zuerst nennen (hoehere Prioritaet).
- Besteht der Mensch auf dem Daily: weitermachen.

## Step 1: Kontext laden

Alle vorhandenen Dateien vollstaendig lesen (existiert das Coaching-Setup
noch nicht: auf /coach-setup verweisen):

1. coaching/context/identity/zielbild.md
2. coaching/context/memory/patterns.md
3. coaching/context/memory/beliefs-tracker.md
4. coaching/context/memory/commitments.md

Dann die juengsten Logs laden:

```bash
ls -1 coaching/logs/daily/*.md 2>/dev/null | sort | tail -1 | xargs cat 2>/dev/null
ls -1 coaching/logs/weekly/*.md 2>/dev/null | sort | tail -1 | xargs cat 2>/dev/null
LAST_BT=$(ls coaching/logs/breakthroughs/ 2>/dev/null | sort | tail -1)
[ -n "$LAST_BT" ] && cat "coaching/logs/breakthroughs/$LAST_BT" || echo "Kein Breakthrough-Log."
```

Intern notieren: offene Zusagen aus commitments.md und offene
Follow-up-Fragen aus dem letzten Breakthrough-Log. Die werden als erster
Checkpoint abgefragt, bevor der Mensch frei ueber heute redet. Das
Weekly-Log liefert den Bezugsrahmen: was war das Wochenziel, was der
Wochenfokus. Daran werden die heutigen Top 2 gemessen.

## Ablauf

Eine Frage pro Nachricht, auf jede Antwort warten:

1. **Einstieg:** "Lass alles kurz los. Ein tiefer Atemzug. Wie war der
   Tag, auf einer Skala von 1 bis 10?"
2. **Zusagen-Check:** offene Zusagen aus commitments.md einzeln abfragen:
   erledigt, verschoben, gerissen? Nur festhalten, nicht bewerten.
3. **Top-2-Check:** wurden die zwei wichtigsten Dinge des Tages erledigt?
   Wenn nein: was kam dazwischen, ehrlich benennen, gegen das Wochenziel
   halten.
4. **Ein Learning:** was hat der Tag gezeigt, das morgen anders laufen
   soll?
5. **Morgen:** Top 2 fuer morgen setzen. Konkret, keine vagen Vorsaetze.

Sprachausgabe optional: Sprachmemo via skripte/sprachmemo.sh, wenn
eingerichtet. Sonst Text.

## Ende: automatisch, ohne Nachfrage

Wenn das Ritual durch ist, sofort und ohne zu fragen:

1. Session-Log schreiben nach coaching/logs/daily/YYYY-MM-DD.md
2. coaching/context/memory/patterns.md aktualisieren: Zaehler fuer jedes
   aufgetauchte Muster erhoehen, Log-Referenz ergaenzen
3. coaching/context/memory/beliefs-tracker.md aktualisieren: getriggerte
   oder verschobene Ueberzeugungen nachziehen, Log-Referenz ergaenzen
4. coaching/context/memory/commitments.md aktualisieren: Erledigtes
   austragen, neue Zusagen mit Datum eintragen
5. Bestaetigen: "Log geschrieben. Gedaechtnis aktualisiert."
