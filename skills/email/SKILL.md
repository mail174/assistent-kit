---
name: email
description: Use when der Mensch die Inbox aufraeumen will, "/email" schreibt, oder eine Mail-Triage ueber die angeschlossenen Konten ansteht.
---

# Email: Inbox-Triage

> Nutzung: /email [--days N] [--account <konto>|all]
> Default: alle angeschlossenen Mail-Konten, letzte 30 Tage.
> Braucht mindestens ein angeschlossenes Mail-Konto <wenn Gmail oder
> vergleichbar angeschlossen ist>. Sonst sagen, was fehlt, und stoppen.

## Step 1: Routing-Regeln laden

context/mail-routing.md lesen. Fehlt die Datei: beim ersten Lauf mit
leeren Sektionen anlegen. Enthaelt:

- **Wichtige Absender**: immer behalten, oben in der Tabelle
- **Auto-Archiv-Muster**: Absender- und Betreff-Muster, die archiviert
  werden
- **Projekt-Zuordnung**: Absender zu Projekt (fuer die Tabelle)
- **Antwort-Ton**: Tonalitaet fuer Entwuerfe

## Step 2: Mails holen

Pro Konto parallel (eine Tool-Nachricht, mehrere Aufrufe): Inbox der
letzten 30 Tage, maximal 100 pro Konto. Bei `--account` nur dieses Konto,
bei `--days N` entsprechend kuerzer oder laenger.

Pro Mail merken: ID, Thread-ID, Absender, Betreff, Datum, Vorschau-Text,
Labels.

## Step 3: Klassifikation

Fuer jede Mail eine Empfehlung, in dieser Reihenfolge (erster Treffer
gewinnt):

1. Absender in den wichtigen Absendern: **Behalten** (mit
   Prioritaets-Marker)
2. Absender oder Betreff matcht Auto-Archiv: **Archivieren**
3. Vorschau enthaelt direkte Frage oder Aufforderung an den Menschen:
   **Antworten**
4. Absender noreply@ oder no-reply@, oder Betreff matcht
   Newsletter/Digest/Weekly/Update: **Archivieren**
5. Default: **Behalten**

Projekt-Kontext aus der Projekt-Zuordnung ableiten, Fallback: heuristisch
ueber context/projekte.md (Absender-Domain zu Projekt).

## Step 4: Uebersichtstabelle

Pro Konto eine eigene Sektion. Zeilen-Reihenfolge: Antworten, dann
Behalten (wichtig), dann Behalten, dann Archivieren.

```
## Konto <adresse>: 12 Mails

 # | Absender        | Betreff              | Kontext   | Empfehlung
 1 | ...             | ...                  | Projekt A | Antworten
 2 | ...             | ...                  |           | Behalten
 3 | ... <noreply@>  | Weekly Digest        |           | Archivieren
```

Wichtig: **globale ID-Vergabe** ueber alle Konten hinweg (1, 2, 3, ...),
der Mensch referenziert IDs ohne Konto-Praefix. ID intern auf (Konto,
Mail-ID, Thread-ID) mappen.

Am Ende ein kurzes Resuemee: Gesamt, davon Antworten / Behalten /
Archivieren.

## Step 5: Batch-Befehle vom Menschen

Fragen:
> Was soll passieren? Beispiel: "archiviere 2,4-7. antwort 1,3."
> Oder "archiviere alle Archiv-Empfehlungen". "fertig" zum Beenden.

Befehle parsen:

- "archiviere X[,Y-Z]": IDs zum Archivieren
- "antwort X[,Y]": IDs fuer Entwurf
- "archiviere alle Archiv-Empfehlungen": alle mit Empfehlung Archivieren
- "behalte alles" / "fertig" / leer: keine Aktion, Skill beendet
- Unklarer Befehl: nachfragen, nicht raten.

## Step 6: Aktionen ausfuehren

**Archivieren:** pro Konto als Batch, nur das Inbox-Label entfernen
(reversibel), nie loeschen.

**Antwort-Entwurf:** pro Mail einzeln einen Entwurf im selben Thread
anlegen: An = Absender der Original-Mail, Betreff mit "Re: "-Praefix
(falls noch nicht vorhanden).

**Entwurfstext:** basiert auf Betreff und Vorschau. Stil: knapp, in der
Sprache der Original-Mail, Foermlichkeit an den Absender angepasst. Ist
unklar, was zu antworten ist: Skelett-Entwurf mit Platzhalter
[KONTEXT FEHLT].

Bei Fehlern: weitermachen, am Ende sammeln.

## Step 7: Report

```
X Mails archiviert
Y Entwuerfe erstellt (im Mail-Konto unter Entwuerfe finalisieren)
Z Fehler: [Konto, Mail-ID, Fehler]
```

## Step 8: Routing-Regeln lernen (optional)

Wenn der Mensch ausdruecklich sagt:

- "alle von X immer archivieren": Eintrag in Auto-Archiv
- "X ist wichtig" / "X immer behalten": Eintrag in wichtige Absender
- "X gehoert zu Projekt Y": Eintrag in Projekt-Zuordnung

Vor dem Speichern bestaetigen ("Eintrag X in Auto-Archiv. Ok?"), erst
dann context/mail-routing.md per Edit ergaenzen.

## Wichtig

- **Nie loeschen**: nur das Inbox-Label entfernen, das ist reversibel.
- **Nie senden**: nur Entwuerfe anlegen, der Mensch finalisiert im
  Mail-Konto (Guardrail 1 der CLAUDE.md-Vorlage).
- **Idempotenz**: hat eine Mail das Inbox-Label nicht mehr, ueberspringen,
  nicht erneut archivieren.
- **Keine grossen Batch-Aktionen ohne Bestaetigung**: bei "archiviere
  alle" mit mehr als 20 Mails einmal die Anzahl zeigen und bestaetigen
  lassen.
- **ID-Eindeutigkeit**: IDs in der Tabelle sind global (1..N) ueber alle
  Konten.
