# Telegram-Formatierung: markdownv2 oder rohe Sternchen

## Immer format markdownv2, mit Hausstil

**Regel:** Jede Bot-Nachricht geht mit `format: "markdownv2"` raus. Der Default
des Nachrichten-Werkzeugs ist Klartext und zeigt `**fett**` als rohe Sternchen.
Hausstil: fett nur fuer Zahlen, Zusagen und offene Entscheidungen ·
Blockueberschriften als Zitatzeile (`>`) · Aufzaehlungen mit `•` von Hand, zweite
Ebene `◦` (Telegram kennt keine Listen) · Betraege, IDs und Codes in Monospace,
antippen kopiert sie · Links blank auf eigener Zeile.

**Warum:** Bei uns kamen monatelang Nachrichten mit sichtbaren Sternchen an
("Wozu die Sterne", 13.07.2026). Der Formatschalter war die ganze Zeit da, nur
ungenutzt; der Hausstil wurde am 21.08.2026 festgelegt.

**Werkzeug:** `vorlagen/bot-rolle.md` (Abschnitt Formatierung) haelt die Regel im
Systemprompt jedes Bots.

**Fertig wenn:** Eine Testnachricht mit `**fett**` kommt fett im Chat an, ohne
sichtbare Sternchen.

## Escaping nie von Hand

**Regel:** In markdownv2 muss JEDES Vorkommen von ``_ * [ ] ( ) ~ ` > # + - = | { } . !``
escaped sein, auch in Zahlen ("10.713") und URLs. Deshalb: Text komplett per
Skript escapen, Format-Marker danach einsetzen. Hand-Escaping ist verboten.

**Warum:** Ein einziges vergessenes Zeichen laesst den ganzen Aufruf mit
"Character '.' is reserved" scheitern, und die Nachricht kommt NIE an; der
Empfaenger sieht nur Funkstille. Bei uns passierte das wiederholt bei Betraegen
und Links, bis das Escaping in ein Skript wanderte (21.08.2026).

**Werkzeug:** `skripte/telegram-format.py` (stdin oder Datei rein, valides
markdownv2 raus).

**Fertig wenn:**
```
echo '**10.713 EUR** ok!' | python3 skripte/telegram-format.py
```
Ausgabe: `*10\.713 EUR* ok\!`
