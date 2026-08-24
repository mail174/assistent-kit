# Automatik: was von allein laeuft, und was fragt

## Erinnerung heisst Timer, nie Vorsatz

**Regel:** Erinnerungen und Wiederkehrendes werden IMMER echte systemd-Timer auf
dem Server, nie Vorsaetze im Chatverlauf. Der Agent bestaetigt mit Uhrzeit; ein
Versprechen ohne Timer gilt als nicht eingerichtet.

**Warum:** Ein Vorsatz im Chat ueberlebt weder Neustart noch Sitzungswechsel und
haengt davon ab, dass zufaellig jemand daran denkt. Am 24.08.2026 wurde die
Regel deshalb fest in die Vorlagen uebernommen: erst mit dem Zeitgeber ist eine
Erinnerung ein Systemzustand statt einer Absicht.

**Werkzeug:** `vorlagen/bot-rolle.md` (Regel 6) und `vorlagen/CLAUDE.md`
(Arbeitsweise); als Bauplan je Aufgabe das Paar
`vorlagen/nacht-neustart.service` + `vorlagen/nacht-neustart.timer`.

**Fertig wenn:** `systemctl list-timers --all | grep <aufgabe>` zeigt den Timer
mit NEXT-Zeitpunkt, und die Bestaetigung im Chat nennt dieselbe Uhrzeit.

## enable --now, dann NEXT lesen

**Regel:** Jeder neue Timer wird mit `systemctl enable --now` gestartet, nie nur
mit `enable`. Abnahme ist ausschliesslich `systemctl list-timers <name> --all`:
steht bei NEXT ein Strich, feuert der Timer nicht, egal was `is-enabled` sagt.

**Warum:** Am 22.08.2026 war bei uns ein Timer einen Monat lang ordentlich
enabled und ist nie gelaufen: `enable` ohne `--now` legt nur den Symlink fuer
den naechsten Boot an. Weil alles korrekt aussah, fiel es bei keiner
oberflaechlichen Pruefung auf.

**Werkzeug:** `vorlagen/waechter.timer` und `vorlagen/nacht-neustart.timer`
(beide werden vom Setup mit `enable --now` aktiviert).

**Fertig wenn:** `systemctl list-timers 'assistent-*' --all` zeigt ueberall
NEXT-Zeitpunkte; `journalctl -u <dienst> -n 3` zeigt echte Laeufe, nicht
"No entries".

## Der Morgenreport als erste eigene Automation

**Regel:** Die erste Automation nach dem Setup ist der Morgenreport: feste
Uhrzeit, Rueckblick auf gestern, Plan fuer heute, als Telegram-Nachricht ohne
dass jemand fragt. Sobald der Kalender angeschlossen ist, kommt die
Terminuebersicht automatisch dazu (der Report kuendigt das an).

**Warum:** Am Morgenreport lernt der Mensch das Timer-Prinzip am ersten
nuetzlichen Beispiel (so eingefuehrt im Setup vom 24.08.2026). Bei uns hat sich
das Muster taeglich frueh / taeglich abends / nachts Neustart seit Monaten
bewaehrt.

**Werkzeug:** Timer-Paar nach dem Muster `vorlagen/nacht-neustart.service` +
`.timer`; der Report selbst ist ein Claude-Aufruf mit fester Aufgabe.

**Fertig wenn:** Der Report kommt zur eingestellten Uhrzeit als
Telegram-Nachricht an; `journalctl -u assistent-morgenreport -n 1` zeigt den
letzten Lauf.

## Die Grenze: Vorschlagen statt Senden

**Regel:** Automatik ist nur so viel wert wie ihre Grenze. Alles, was Geld
bewegt oder Dritte erreicht (Mails, Mahnungen, Nachrichten nach draussen,
Buchungen), schlaegt vor und wartet auf ein Wort. Alles andere laeuft durch.
Kein Timer-Lauf ruft selbst eine Sende-Funktion an Dritte auf.

**Warum:** Ein Lauf, der eigenstaendig Mahnungen verschickt, spart zwei Minuten
und riskiert eine Kundenbeziehung. Ein Lauf, der morgens eine Zeile mit Betrag
und Vorschlag schickt und auf ein Wort wartet, spart dieselben zwei Minuten ohne
das Risiko. Deckungsgleich mit der Mail-Regel (`wissen/mail-freigabe.md`), die
bei uns am 14.07.2026 aus genau so einem Vorfall entstand.

**Werkzeug:** `vorlagen/CLAUDE.md` (Guardrails 1 und 2).

**Fertig wenn:** `grep -rl 'send' <eigener-timer-skript-ordner>` liefert keinen
Treffer, der ohne Freigabe an Dritte sendet; jeder Geld- oder Dritten-Lauf endet
mit einer Vorschlags-Nachricht, nicht mit einem Versand.
