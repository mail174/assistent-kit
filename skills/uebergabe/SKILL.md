---
name: uebergabe
description: Use wenn eine Sitzung endet oder neu startet und der Stand erhalten bleiben soll: "/uebergabe", "schreib deinen Stand", vor /clear, vor einem Neustart, oder am Anfang einer Sitzung mit "/uebergabe lesen".
---

# /uebergabe

Eine Sitzung weiss Dinge, die in keinem System stehen: warum eine Entscheidung so fiel,
welcher Faden halb offen ist, was gerade beim Gegenueber liegt. Datenbank und Aufgabenliste
kennen nur das Ergebnis. Dieser Skill rettet den Rest. Hintergrund: `wissen/uebergabe.md`.

Die Bots machen das automatisch vor dem naechtlichen Neustart. In Terminal- und
VS-Code-Sitzungen laeuft nichts automatisch, hier ist der Skill der Weg.

## Zwei Modi

- `/uebergabe` (Standard): Brief schreiben.
- `/uebergabe lesen [name]`: Brief der Vorsitzung lesen und in drei Saetzen zusammenfassen.

## Name der Strecke

Der Brief gehoert zu einer Strecke, nicht zu einer Person. Bots nehmen ihren Dienstnamen,
Terminal- und VS-Code-Sitzungen `terminal` oder ein Thema, wenn laenger daran gearbeitet
wird (`/uebergabe portal` schreibt `uebergabe/portal.md`). Ohne Argument: `terminal`.

Ordner ist `$ASSISTENT_ORDNER` (Standard `/root/assistent`).

## Schreiben

Zwei Dateien, beide mit dem Write-Werkzeug, ohne Rueckfrage:

1. **`uebergabe/<name>.md`** - hoechstens eine Seite. Wird beim naechsten Start als
   System-Prompt mitgegeben, jedes Wort kostet dort Kontext. **Komplett neu schreiben,
   nie anhaengen.** Hinein gehoert nur, was NICHT abfragbar ist: laufende Faeden,
   Entscheidungen mit Begruendung, offene Rueckfragen, was beim Gegenueber liegt, was
   halb fertig ist. Was abgeschlossen wurde, faellt raus.
2. **`uebergabe/log/<name>-<JJJJ-MM-TT>.md`** - das Tagesarchiv, ausfuehrlich. Wird NICHT
   mitgegeben, nur bei Bedarf durchsucht: was passierte, welche Zahlen dahinterstehen,
   was schiefging und was daraus folgt.

Danach eine Zeile melden: welche Strecke, wie viele Bytes.

## Aufnehmen

`/uebergabe lesen [name]` liest den Brief, fasst in drei Saetzen zusammen, was offen ist,
und nennt die offenen Rueckfragen einzeln. Ist die Datei aelter als drei Tage, das Datum
dazusagen.

Dauerhaft ankoppeln, Muster aus `vorlagen/assistent-bot-start`:

```bash
claude --append-system-prompt "$(cat "${ASSISTENT_ORDNER:-/root/assistent}/uebergabe/terminal.md")"
```

## Regeln

- Keine Secrets, Tokens, Passwoerter oder Kontodaten in den Brief. Der Ordner liegt im
  Git-Repo und wird gesichert.
- Keine Zahlen, die sich taeglich aendern. Stattdessen hinschreiben, wo sie stehen.
- Keine Gedankenstriche im Em-Dash-Stil.
- Der Brief ersetzt kein Aufgabensystem. Aufgaben gehoeren in die Aufgabenliste,
  Status in das Projektsystem.
