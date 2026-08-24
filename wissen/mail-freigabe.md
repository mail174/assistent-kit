# Mail-Freigabe: nichts geht raus ohne Go

## Nie direkt senden

**Regel:** Keine Mail an Dritte verlaesst das System ohne ausdrueckliche,
aktionsbezogene Freigabe. "Schreib X eine Mail, dass ..." ist IMMER ein
Entwurfs-Auftrag, nie eine Sende-Freigabe. Auch Zeitdruck ist keine Ausnahme:
Entwurf zeigen, der Mensch sendet notfalls in Sekunden selbst.

**Warum:** Am 14.07.2026 wurde bei uns eine zeitkritische Bitte ("kurze Mail,
dass ich im Call warte") als Sende-Freigabe gelesen und die Mail ging direkt
raus. Mails sind extern sichtbar, nicht rueckholbar und koennen Beziehungen
kosten; das Wording will der Mensch selbst kontrollieren.

**Werkzeug:** `vorlagen/CLAUDE.md` (Guardrail 1).

**Fertig wenn:** `grep -n 'nie direkt senden' CLAUDE.md` an der eigenen
Repo-Wurzel trifft, und im Verlauf steht vor jedem Versand ein ausdrueckliches Go.

## Entwurf als gerendertes Bild, nie als Rohtext

**Regel:** Jeder Entwurf, der zur Freigabe vorgelegt wird, geht als PNG in den
Chat: Kopfzeile Von/An/Cc/Betreff, ENTWURF-Badge, Body inklusive Signatur, so
wie der Empfaenger die Mail sehen wird. Auch unter Zeitdruck, auch bei
Dreizeilern: das Rendern kostet unter einer Minute.

**Warum:** Am 21.08.2026 wurde die Regel bei uns unter Zeitdruck gerissen, ein
Termin begann in zwei Minuten und der Entwurf ging als Rohtext raus, obwohl die
Regel im Gedaechtnis stand. Rohtext verschweigt, wie die Mail wirklich aussieht:
Signatur, Abstaende, Absender. Freigegeben wird, was man sieht.

**Werkzeug:** `skripte/mail-vorschau.py` (rendert Kopfzeile, Badge und Body per
headless Chrome als passgenaues PNG).

**Fertig wenn:**
```
python3 skripte/mail-vorschau.py --von a@b.de --an c@d.de --betreff Test --html body.html --out /tmp/entwurf.png
file /tmp/entwurf.png
```
Ausgabe: `PNG image data`; das Bild zeigt Kopfzeile und ENTWURF-Badge.

## Signatur nur aus der kanonischen Datei

**Regel:** Die Signatur wird nie selbst gebaut, auch nicht als Platzhalter, auch
nicht "passend zum Design". Sie kommt wortgleich und mit den echten Farben aus
EINER kanonischen Datei im eigenen Repo (z. B. `context/signatur.md`). HTML-Form:
nur `div`, `br` und Inline-Styles, nie `<table>`.

**Warum:** Am 21.08.2026 stand in einem Entwurf bei uns eine frei erfundene
Signatur, die zum Bild passte; der Mensch sah es sofort: falsche Akzentfarbe,
falsche Struktur, fehlendes Markenelement. Eine Marke hat genau eine Signatur.

**Werkzeug:** `skripte/mail-vorschau.py` rendert den Body samt Signatur; die
kanonische Datei legt das Setup im eigenen Repo an.

**Fertig wenn:** Der Signatur-Block im Entwurfs-HTML ist zeichengleich mit der
kanonischen Datei (`diff <(Block aus Entwurf) <(Block aus Datei)` leer).

## Keine Gedankenstriche in Texten an Dritte

**Regel:** Kein Langstrich als Gedankenstrich in Mails, Nachrichten oder
Dokumenten, die bei Dritten landen. Stattdessen Punkt, Komma, Doppelpunkt oder
zwei Saetze. Vor dem Rausgeben pruefen.

**Warum:** Der Langstrich ist das bekannteste Erkennungszeichen fuer
maschinengeschriebenen Text und wirkt unauthentisch. Bei uns stand die Regel nur
im Gedaechtnis und wurde am 14.08.2026 trotzdem in einer Mail an einen
externen Empfaenger gerissen; seitdem ist sie Guardrail mit Pruefbefehl.

**Werkzeug:** `vorlagen/CLAUDE.md` (Guardrail 7).

**Fertig wenn:** `grep -cP '\x{2014}|\x{2013}' entwurf.html` gibt `0` aus
(die beiden Codes stehen fuer Lang- und Halbstrich).
