---
name: prime
description: Use when der Mensch die Arbeits-Session startet, "/prime" schreibt, oder morgens ein kompaktes Lagebild aus Zahlen, Terminen und Aufgaben will.
---

# Prime

Morgen-Boot: Ziel, Zahlen, Termine, Aufgaben, Hinweise, Top-2-Frage.
Lagebild in unter einer Minute, dann arbeiten.

## Step 1: Kontext lesen

CLAUDE.md und context/projekte.md sind bereits automatisch geladen, NICHT
erneut lesen. Zusaetzlich lesen, was existiert:

- context/strategie.md (Ziel und aktuelle Prioritaeten)
- coaching/context/identity/identity.md (wenn Coaching eingerichtet ist)

## Step 2: Zahlen, Termine, Aufgaben holen (parallel)

Alles parallel starten, jeder Block nur wenn die Quelle angeschlossen ist.
Liefert eine Quelle nichts: einmal wiederholen, dann "n/a" eintragen. Der
Boot wird NIE blockiert.

**a) Zahlen von gestern** <wenn Datenquellen fuer Kennzahlen eingerichtet
sind, etwa ein Skript unter skripte/ oder eine Datenbank>: pro Projekt die
Kernzahlen von gestern ziehen (Ausgaben, Einnahmen, Ergebnis oder was der
Mensch misst).

**b) Termine heute** <wenn Kalender angeschlossen>: IMMER alle Kalender
abfragen, nicht nur den ersten. Erst die Kalenderliste holen, dann pro
Kalender die heutigen Termine, alles chronologisch mergen. Termine aus
Nebenkalendern kurz taggen. Nichts wegfiltern.

**c) Aufgaben** <wenn Aufgabenliste angeschlossen>: alle offenen Aufgaben
ziehen und in zwei Gruppen teilen:
- Heute faellig: nur Titel
- Ueberfaellig: Titel plus Datum TT.MM, aufsteigend

**d) Mail-Notfall-Scan** <wenn Mail angeschlossen>: alle Konten parallel
auf ungelesene Mails der letzten 2 Tage pruefen. Dann HART filtern, es
zaehlt nur, was wirklich drueckt:

- Behoerden, Steuer, Mahnung, Frist
- Partner- oder Kunden-Eskalation, Kuendigung, Beschwerde
- Geld oder Infrastruktur kaputt: Zahlung fehlgeschlagen, Konto gesperrt,
  Dienst down

Newsletter, Benachrichtigungen, Tool-Mails, Normales: ignorieren. Kein
Triage, keine Bodies, keine Zaehlung ungelesener Mails. Treffer (maximal 3)
landen mit Warnzeichen, Absender und Betreff in [HINWEISE]. Kein Treffer:
nichts anzeigen.

## Step 3: Hinweise aus Logs und Gedaechtnis (kuratiert)

Juengstes Daily- und Weekly-Log lokalisieren und lesen:

```bash
ls -1 coaching/logs/daily/*.md 2>/dev/null | sort | tail -1
ls -1 coaching/logs/weekly/*.md 2>/dev/null | sort | tail -1
```

Dann kuratieren, kein mechanischer Dump:

- Maximal 3 Punkte: nur was fuer HEUTE relevant ist (offene Zusagen,
  Fristen, unerledigte Top 2, die noch zaehlen)
- Maximal 2 eigene Erinnerungen aus dem Gedaechtnis (wartende Antworten,
  faellige Zahlungen, zugesagte Follow-ups)
- Ist nichts davon heute relevant: die Sektion komplett weglassen. Alte
  Log-Daten nicht kuenstlich aufwaermen.

## Step 4: Boot-Meldung

```
[ SYSTEM BOOT ]
================================================

  [ZIEL]
  {das aktuelle Ziel aus context/strategie.md, ein Absatz, woertlich}

  [ZAHLEN, gestern {Datum}]  <nur wenn Datenquellen eingerichtet>
  {pro Projekt eine Zeile, Summenzeile darunter}

  [TERMINE, {Datum}]  <nur wenn Kalender angeschlossen>
  {alle heutigen Termine, eine Zeile pro Termin mit Uhrzeit, sonst "Frei."}

  [AUFGABEN]  <nur wenn Aufgabenliste angeschlossen>
  Heute:        {faellige Aufgaben, sonst "Keine."}
  Ueberfaellig: {ueberfaellige mit TT.MM, sonst "Keine."}

  [HINWEISE]
  {nur wenn Step 3 oder der Mail-Scan etwas fand: Warn-Mails zuerst, dann
  Log-Punkte, maximal 5 gesamt. Sonst ganze Sektion weglassen.}

================================================
```

Direkt darunter, als einzige Frage:

**Was sind deine Top 2 fuer heute?**

Ton: ruhig, direkt, kein Geplauder. Keine Fokus-Vorschlaege, keine
weiteren Fragen.

## Step 5: Integritaets-Check (nach der Antwort)

Wenn der Mensch seine Top 2 nennt, EINMAL pruefen gegen:

1. **Zahlen:** adressieren sie, wo gerade Geld verdient wird oder verloren
   geht?
2. **Zielpfad:** bringen sie messbar naeher an das Ziel aus
   context/strategie.md?
3. **Ausweich-Muster:** vage ("mal schauen"), heute nicht abschliessbar,
   Neues statt bestehendem System, Beschaeftigungstherapie statt Hebel.

- Verdacht auf Ausweichen: einmal direkt und konkret benennen, zum Beispiel
  "Das klingt nach Ausweichen: {Projekt} verliert gerade {x} pro Tag, warum
  ist das nicht drin?" Danach die Entscheidung akzeptieren, keine
  Endlosdiskussion.
- Top 2 solide: in einem Satz bestaetigen und mit Nummer 1 anfangen.

Genau EIN Check. Nie mehr als einer.
