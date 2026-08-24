---
name: project
description: Use when der Mensch vollen Kontext zu einem Projekt laden will ("/project <name>") oder ein neues Projekt anlegen will ("/project new <name>").
---

# Project: vollen Kontext laden ODER neues Projekt anlegen

> **Nutzung:**
> - `/project <name>`: Kontext zu existierendem Projekt laden
> - `/project new <name> [phase]`: neues Projekt anlegen
>
> Laedt: aktuellen Status, offene Aufgaben, Projekt-Datei, letztes
> Call-Log, Kennzahlen (wenn konfiguriert).

## Modus erkennen

Ist das erste Argument nach `/project` exakt `new`: Modus "Neues Projekt
anlegen" (Abschnitt unten). Sonst: Kontext laden, ab Step 1.

## Step 1: Projekt identifizieren

`<name>` (case-insensitive, auch unscharf) gegen die Projektliste in
context/projekte.md mappen. Dort stehen pro Projekt: Name, Kuerzel und
Aliasse, Pfad zur Projekt-Datei (projects/<projekt>/<projekt>.md), und
falls vorhanden die Kennzahlen-Quelle und die ID in der Live-Quelle
<wenn ein Projekt-Tool wie Notion angeschlossen ist>.

Matcht `<name>` nicht eindeutig: Liste der verfuegbaren Projekte zeigen
und um Klaerung bitten.

## Step 2: Aktuellen Status laden

<wenn ein Projekt-Tool angeschlossen ist> die Projekt-Seite aus der
Live-Quelle holen: Status, Phase, naechste Aktion, letztes Update. Dazu
die letzten 3 Status-Eintraege des Projekts (nach Datum absteigend), pro
Eintrag: Datum, Typ, Kernzahlen, Engpass, naechste Aktion.

Ohne Projekt-Tool: den obersten Status-Block aus der Projekt-Datei nehmen
und das Datum dazu nennen, damit klar ist, wie frisch der Stand ist.

Keine Eintraege vorhanden: "Status-Log: keine Eintraege" zeigen, kein
Abbruch.

## Step 3: Offene Aufgaben laden

<wenn Aufgabenliste angeschlossen> alle offenen Aufgaben ziehen und auf
das Projekt filtern (Projektname, Kuerzel, Partnernamen in Titel und
Notizen). Nach Faelligkeit aufsteigend sortieren, maximal 10 zeigen.

Findet sich eine Aufgabe nur im Projekt-Tool oder nur in der
Aufgabenliste: als Abweichung benennen, fehlende Gegenstuecke nachtragen,
erledigte synchronisieren. Ergebnis als Einzeiler vor dem Output.

## Step 4: Projekt-Datei (Deep Context)

projects/<projekt>/<projekt>.md vollstaendig lesen, falls vorhanden.
Sonst ueberspringen.

## Step 5: Letztes Call-Log

```bash
ls -t projects/<projekt>/call-logs/*.md 2>/dev/null | head -1
```

Neueste Datei lesen, die ersten 5 Kernpunkte extrahieren.

## Step 6: Kennzahlen (projekt-spezifisch)

Steht in context/projekte.md eine Kennzahlen-Quelle fuer das Projekt
(Skript unter skripte/, Datenbank, Tabelle): ausfuehren und die Zahlen
fuer heute, gestern, 7 Tage und 30 Tage ziehen. Sonst:
"Kennzahlen: nicht konfiguriert".

## Step 7: Output (strukturiert)

```
[Projekt-Name]
-----------------------------------------
Status: {Status}  |  Phase: {Phase}  |  Letztes Update: {Datum}
Naechste Aktion: {Aktion}

Status-Log (letzte 3 Eintraege)
  [TT.MM.] [Typ] {Titel}
    Zahlen:  {eine Zeile}
    Engpass: {eine Zeile, wenn vorhanden}
    Next:    {wenn vorhanden}

Offene Aufgaben (maximal 10)
  [Status] {Aufgabe}, faellig {Datum}

Letztes Call-Log: {Dateiname}
  Kern: {erste 3 Punkte}

Kennzahlen
  Heute / Gestern / 7d / 30d: {Zahlen oder "nicht konfiguriert"}

Deep Context: {Pfad zur Projekt-Datei}
```

Ton: ruhige Autoritaet, kein Geplauder.

---

# MODUS: Neues Projekt anlegen

> Triggert bei: `/project new <name> [phase]`
> Phase: Idee / Test / Skalierung / Pflege. Default: Idee.

## Step 1: Doppelanlage verhindern

Steht der Projektname schon in context/projekte.md (case-insensitive):
abbrechen und auf das bestehende Projekt verweisen, nichts neu anlegen.

## Step 2: Anlegen

1. Ordner und Projekt-Datei anlegen: projects/<slug>/<slug>.md mit
   Grundgeruest (Was, Partner, Wirtschaftlichkeit, Pfade) plus einem
   ersten Status-Block mit Datum.
2. Eintrag in context/projekte.md ergaenzen: Name, Kuerzel und Aliasse,
   Pfad, Phase. Per Edit an die bestehende Tabelle anfuegen, nichts
   umformatieren.
3. <wenn ein Projekt-Tool angeschlossen ist> dort ebenfalls eine
   Projekt-Seite anlegen (Status aktiv, gewaehlte Phase) und deren ID in
   context/projekte.md eintragen.

## Step 3: Bestaetigen

```
Projekt "{name}" angelegt
   Datei:  projects/<slug>/<slug>.md
   Phase:  {phase}
   Aufruf: /project {slug}

Naechste Schritte:
  1. Projekt-Datei mit Setup, Partnern und Zielen fuellen
  2. Erste Aufgabe mit Datum anlegen
```

## Wichtig

- Die Projekt-Datei bleibt beim Anlegen ein Geruest, Deep Context waechst
  mit dem Projekt.
- Kein Auto-Push in Phasen: der Mensch entscheidet, wann es von Idee auf
  Test geht.
