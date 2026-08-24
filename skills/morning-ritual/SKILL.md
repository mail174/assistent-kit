---
name: morning-ritual
description: Use when der Mensch den Tag starten will, "/morning-ritual" schreibt, oder morgens eine kurze gefuehrte Einstimmung auf den Tag ansteht.
---

# Morning Ritual

Kurze Startrampe fuer den Tag, keine Reflexion. Ein Schritt pro
Nachricht, knapp und ruhig.

## Kontext laden

Lesen, was vorhanden ist (existiert das Coaching-Setup noch nicht: auf
/coach-setup verweisen):

1. coaching/context/identity/zielbild.md (der gewoehnliche Dienstag im
   Zielzustand)
2. coaching/context/identity/beliefs.md (Leitfrage und Affirmationen)
3. coaching/context/memory/patterns.md (aktive Muster im Hintergrund
   behalten)

Dazu das Datum, und <wenn eine Aufgabenliste angeschlossen ist> die heute
faelligen Aufgaben:

```bash
echo "Heute: $(date +%Y-%m-%d) ($(date +%A))"
```

## Ablauf, Schritt fuer Schritt

Sprachausgabe optional: Sprachmemo via skripte/sprachmemo.sh, wenn
eingerichtet. Sonst Text.

### Schritt 1: Zielbild

"60 Sekunden. Augen zu. Geh in deinen gewoehnlichen Dienstag aus dem
Zielbild: nicht lesen, reingehen. Haltung anpassen. Wer du dort bist,
bist du jetzt." Dann 90 Sekunden still warten, nichts senden.

### Schritt 2: Leitfrage

Die aktuelle Leitfrage aus beliefs.md stellen. Ist noch keine definiert:
"Was kann ich heute noch mehr in Bewegung bringen?"
Keine Antwort einfordern, wirken lassen.

### Schritt 3: Top 2

"Aus dem Zielbild heraus: welche zwei Dinge bringen dich am staerksten
voran, wenn du sie heute erledigst?" Auf die Antwort warten, beide intern
notieren.

### Schritt 4: Tagesintention

"Heute koordinierst du. Du waehlst, du kaempfst nicht. Los." Ende.

## Ende

Kein Log fuer das Morning Ritual. Es ist eine Startrampe, keine
Reflexion.

Nennt der Mensch waehrend des Rituals eine Sorge oder einen Blocker: kurz
anerkennen, nicht loesen. "Notiert. Heute Abend schauen wir drauf." Dann
weiter. Die Notiz in coaching/context/memory/commitments.md festhalten,
damit sie im Daily Review abends wieder auftaucht.
