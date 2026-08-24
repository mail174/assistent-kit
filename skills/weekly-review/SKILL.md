---
name: weekly-review
description: Use when der Mensch die Woche abschliessen will, "/weekly-review" schreibt, oder am Wochenende eine gefuehrte Wochenreflexion ansteht.
---

# Weekly Review

Gefuehrter Wochenabschluss. Ton nach rollen/coaching-rolle.md: eine Frage
pro Nachricht, dann warten, kein unverdientes Lob.

## Step 0: Ritual-Check (immer zuerst)

```bash
echo "Weekly:  $(ls coaching/logs/weekly/ 2>/dev/null | sort | tail -1 || echo 'keins')"
echo "Monthly: $(ls coaching/logs/monthly/ 2>/dev/null | sort | tail -1 || echo 'keins')"
echo "Heute:   $(date +%Y-%m-%d)"
```

- Letztes Monthly-Log aelter als 30 Tage: vor dem Start sagen "Dein
  letztes Monthly Review ist X Tage her. Willst du stattdessen
  /monthly-review machen?"
- Besteht der Mensch auf dem Weekly: weitermachen.

## Step 1: Kontext laden

Alle vorhandenen Dateien vollstaendig lesen (existiert das Coaching-Setup
noch nicht: auf /coach-setup verweisen):

1. coaching/context/identity/identity.md
2. coaching/context/identity/zielbild.md
3. coaching/context/identity/beliefs.md
4. coaching/context/memory/patterns.md
5. coaching/context/memory/beliefs-tracker.md
6. Die letzten 7 Daily-Logs aus coaching/logs/daily/ (neueste zuerst)

Dann das juengste Monthly-Log fuer den Zielabgleich:

```bash
LAST_MONTHLY=$(ls coaching/logs/monthly/ 2>/dev/null | sort | tail -1)
[ -n "$LAST_MONTHLY" ] && cat "coaching/logs/monthly/$LAST_MONTHLY" || echo "Kein Monthly-Log. Monatsziele noch nicht gesetzt."
```

Aus dem Monthly-Log wissen: was war das Monatsziel, zahlt der Wochenplan
darauf ein? Fehlt es: notieren, weitermachen, im Review offen ansprechen.

## Ablauf

Eine Frage pro Nachricht, auf jede Antwort warten:

1. **Einstieg:** "Bevor wir bewerten: lass die Woche einmal vorbeiziehen,
   ohne Urteil. Wie ein Film, der an dir vorbeilaeuft. Atemzug. Bereit?"
2. **Wochenziel-Check:** wurde das Wochenziel erreicht? Ja oder nein, mit
   dem ehrlichen Grund. Nur festhalten, nicht bewerten.
3. **Top-2-Quote:** an wie vielen Tagen wurden die Top 2 erledigt? Zahl
   aus den Daily-Logs, nicht aus dem Gefuehl.
4. **Muster:** welches Muster aus patterns.md hat sich diese Woche wieder
   gezeigt? Unbequem ansprechen, freundlich und direkt.
5. **Ein Gewinn, ein Verlust:** was hat die Woche gebracht, was gekostet?
6. **Naechste Woche:** Wochenziel und Fokus fuer die kommende Woche
   setzen. Konkret, mit Bezug auf das Monatsziel.

Sprachausgabe optional: Sprachmemo via skripte/sprachmemo.sh, wenn
eingerichtet. Sonst Text.

## Ende: automatisch, ohne Nachfrage

1. Session-Log schreiben nach coaching/logs/weekly/YYYY-WXX.md
2. coaching/context/memory/patterns.md: ueber die Woche bestaetigte
   Muster hochzaehlen, Log-Referenz ergaenzen
3. coaching/context/memory/beliefs-tracker.md: aufgetauchte
   Ueberzeugungen nachziehen, Log-Referenz ergaenzen
4. coaching/context/memory/commitments.md aktualisieren
5. coaching/context/memory/streaks.md: Top-2-Quote der Woche eintragen
6. Bestaetigen: "Log geschrieben. Gedaechtnis aktualisiert."
