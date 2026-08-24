---
name: monthly-review
description: Use when der Mensch den Monat abschliessen will, "/monthly-review" schreibt, oder zum Monatsende eine gefuehrte Monatsreflexion ansteht.
---

# Monthly Review

Gefuehrter Monatsabschluss. Ton nach rollen/coaching-rolle.md: eine Frage
pro Nachricht, dann warten, kein unverdientes Lob.

## Step 0: Ritual-Check (immer zuerst)

```bash
echo "Monthly: $(ls coaching/logs/monthly/ 2>/dev/null | sort | tail -1 || echo 'keins')"
echo "Heute:   $(date +%Y-%m-%d)"
```

Ist das letzte Monthly-Log aelter als 30 Tage: notieren, aber trotzdem
durchziehen. Das Monthly laeuft immer zum Monatsende, egal was war.

## Step 1: Kontext laden

Alle vorhandenen Dateien vollstaendig lesen (existiert das Coaching-Setup
noch nicht: auf /coach-setup verweisen):

1. coaching/context/identity/identity.md
2. coaching/context/identity/zielbild.md
3. coaching/context/identity/beliefs.md
4. coaching/context/memory/patterns.md
5. coaching/context/memory/beliefs-tracker.md
6. coaching/context/memory/breakthroughs.md
7. Alle Weekly-Logs dieses Monats aus coaching/logs/weekly/

## Ablauf

Eine Frage pro Nachricht, auf jede Antwort warten:

1. **Einstieg:** "Bevor wir anfangen: lass den Monat einmal vorbeiziehen,
   ohne Urteil. Wie ein Film. Atemzug. Bereit?"
2. **Monatsziel-Check:** wurde das Monatsziel erreicht? Zahlen und Fakten
   aus den Weekly-Logs, nicht aus dem Gefuehl.
3. **Kernzahlen:** die 2 bis 3 wichtigsten Zahlen des Monats festhalten
   (Umsatz, Kunden, was immer der Mensch misst).
4. **Muster-Inventur:** welche Muster aus patterns.md haben sich ueber
   den Monat gehalten, welche sind verschwunden?
5. **Groesster Hebel:** was hat im Monat am meisten bewegt, was am
   meisten gekostet?
6. **Naechster Monat:** Monatsziel setzen. Konkret, messbar, mit Bezug
   auf den North Star aus identity.md.

Sprachausgabe optional: Sprachmemo via skripte/sprachmemo.sh, wenn
eingerichtet. Sonst Text.

## Ende: automatisch, ohne Nachfrage

1. Session-Log schreiben nach coaching/logs/monthly/YYYY-MM.md
2. coaching/context/memory/patterns.md: volle Monats-Inventur,
   Log-Referenzen ergaenzen
3. coaching/context/memory/beliefs-tracker.md: alle Ueberzeugungen
   nachziehen, die diesen Monat auftauchten
4. coaching/context/identity/identity.md: Kernzahlen-Schnappschuss des
   Monats in die Monats-Tabelle eintragen
5. coaching/context/memory/streaks.md aktualisieren
6. Bestaetigen: "Log geschrieben. Gedaechtnis aktualisiert."
