# Lernschleife: nach drei Monaten besser als am ersten Tag

## Jede Korrektur wird eine Datei

**Regel:** Sagt der Mensch, dass etwas anders laufen soll, wird daraus sofort
eine Gedaechtnis-Datei in der Vier-Teile-Grammatik: Regel in einem Satz, der
Vorfall mit Datum, das Werkzeug, der Pruefbefehl. Nicht irgendwann, sofort; und
der Wortlaut wird dem Menschen einmal vorgeschlagen.

**Warum:** Was nur im Kopf der Session lebt, stirbt mit ihr. Und was nur
dokumentiert ist, wird gelesen, wenn zufaellig daran gedacht wird; was erzwungen
wird (Regel im Systemprompt, Werkzeug, Pruefbefehl), wird angewendet. Bei uns
wurde eine Regel am 11.08.2026 taeglich uebergangen, solange sie nur im
Gedaechtnis stand; erst als sie in die Bot-Rolle wanderte, hielt sie.

**Werkzeug:** `wissen/GRAMMATIK.md` als Format; Ablage im eigenen
Gedaechtnis-Ordner des Repos.

**Fertig wenn:** Die neue Datei existiert, `grep -l '20[0-9][0-9]' <datei>`
trifft (Vorfall mit Datum), und die Aenderung ist committet.

## Selbst bemerkte Fehler zaehlen genauso

**Regel:** Die Lernschleife startet nicht nur bei Korrektur durch den Menschen.
Faellt dem Agenten selbst auf, dass eine Annahme falsch war, ein Werkzeug still
unvollstaendig antwortet oder ein Weg zweimal in dieselbe Sperre lief: Datei
ungefragt schreiben und in einer Zeile melden. Grenze: ein einmaliger Aussetzer
ist keine Regel; geschrieben wird nur, was beim naechsten Mal wieder zuschlagen
wuerde.

**Warum:** Der Mensch sieht nur einen Bruchteil der Fehler. Woran man merkt,
dass die Schleife wirkt: dieselbe Korrektur kommt nicht zweimal, und ein Teil
der Regeln stammt aus Fehlern, die der Mensch nie gesehen hat.

**Werkzeug:** `vorlagen/CLAUDE.md` (Abschnitt "Lernen") verankert das im
Systemkontext jedes Starts.

**Fertig wenn:** Das Gedaechtnis enthaelt mindestens eine Datei, deren Vorfall
keine menschliche Korrektur war (Stichprobe beim Wochenrueckblick).

## Zweimal gebrochen heisst Guardrail

**Regel:** Eine Regel, die trotz Gedaechtnis-Datei erneut gerissen wird, wandert
nach oben in die Guardrails der CLAUDE.md, mit Pruefbefehl, nicht in eine zweite
Gedaechtnis-Datei. Guardrails werden bei jedem Start geladen; das Gedaechtnis
nur bei Beruehrung des Themas.

**Warum:** Bei uns stand die Gedankenstrich-Regel im Gedaechtnis und wurde am
14.08.2026 trotzdem in einer Mail an den Steuerberater gerissen. Erst als
Guardrail mit Pruefbefehl (`grep` vor dem Rausgeben) hielt sie. Eine zweite
Datei zum selben Thema haette nur die Ablage verdoppelt, nicht die Wirkung.

**Werkzeug:** `vorlagen/CLAUDE.md` (Guardrails-Abschnitt, "gelten immer, vor
allem anderen").

**Fertig wenn:** Die Regel steht nummeriert in den Guardrails der eigenen
CLAUDE.md (`grep -n '<stichwort>' CLAUDE.md` trifft im Guardrails-Block).

## Falsches loeschen, nichts speichern was altert

**Regel:** Eine widerlegte Regel wird geloescht, nicht abgeschwaecht: sie
richtet mehr Schaden an als keine Regel. Nicht gespeichert wird: Status und
Tageszahlen (werden abgefragt, nicht gemerkt), Doppel (bestehende Datei
schaerfen statt zweite anlegen), und alles, was ohnehin im Code steht.

**Warum:** Ein Gedaechtnis voller veralteter Fakten produziert falsche
Antworten mit vollem Selbstvertrauen, und der Mensch merkt es erst, wenn eine
Entscheidung darauf gebaut hat. Bei uns gilt deshalb: nichts ins Gedaechtnis,
was in einer Woche falsch sein kann.

**Werkzeug:** `vorlagen/CLAUDE.md` (Abschnitt "Lernen": Falsches loeschen,
nichts speichern was altert).

**Fertig wenn:** Stichprobe ueber das Gedaechtnis:
`grep -rln 'Stand:\|Status' <gedaechtnis-ordner>/ | wc -l` gibt `0` aus; jede
Datei traegt Regel plus datierten Vorfall, keinen Zustand.
