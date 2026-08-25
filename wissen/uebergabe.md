# Uebergabe zwischen Sitzungen

## Regel

Bevor ein Bot neu startet, schreibt die laufende Sitzung ihren eigenen Uebergabebrief:
eine Seite, die beim naechsten Start mitgegeben wird. Dazu ein Tagesarchiv, das nur bei
Bedarf gelesen wird.

## Warum

Ein Bot laeuft als Dauersitzung. Zwei Dinge gehen sonst verloren.

Erstens: was nie in ein System geschrieben wurde. Warum eine Entscheidung so fiel, welche
Rueckfrage noch offen ist, was gerade beim Gegenueber liegt. Die Datenbank kennt nur das
Ergebnis, nicht die Begruendung.

Zweitens: Kontext, wenn das Transkript zu gross wird. Ein Neustart nimmt zwar dieselbe
Sitzung wieder auf, aber ein Transkript von mehreren Megabyte macht jeden Start traege.
Der Brief ist die kompakte Alternative.

Eine Zusammenfassung von aussen kann das nicht leisten: sie muesste den Stand aus den
Systemen rekonstruieren und wuesste genau das nicht, was fehlt. Deshalb schreibt die
Sitzung selbst, kurz bevor sie endet.

## Werkzeug

- `skripte/uebergabe-schreiben.sh <bot> <pointer>` spricht die laufende Sitzung an und
  laesst sie beide Dateien schreiben
- `skripte/nacht-neustart.sh` ruft das je Bot auf und startet danach neu, gestaffelt
- `vorlagen/assistent-bot-start` haengt `uebergabe/<dienst>.md` beim Start an
- `vorlagen/nacht-neustart.service` und `.timer` fahren das taeglich

## Die vier Regeln, an denen es sonst kippt

1. **Zwei Ebenen.** `uebergabe/<bot>.md` ist eine Seite und wird immer mitgegeben.
   `uebergabe/log/<bot>-<datum>.md` ist ausfuehrlich und wird nie mitgegeben.
2. **Neu schreiben, nicht anhaengen.** Erledigtes verschwindet. Ein Brief, der nur waechst,
   frisst bei jedem Start mehr Kontext, als er spart.
3. **Nur, was nicht im System steht.** Zahlen, Status und Fristen holt sich die naechste
   Sitzung selbst. Der Brief haelt Entscheidungen, Begruendungen und laufende Faeden.
4. **Der Neustart haengt nie am Brief.** Schreiben, Frische pruefen, neu starten. Scheitert
   das Schreiben, wird trotzdem gestartet und der Mensch bekommt eine Meldung.

## Fertig wenn

`ls -la uebergabe/` zeigt eine Datei je Bot mit dem heutigen Datum, und
`systemctl list-timers` fuehrt den Nacht-Neustart mit einem Zeitpunkt in der NEXT-Spalte.
