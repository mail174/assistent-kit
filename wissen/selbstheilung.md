# Selbstheilung: der Bot laeuft, heisst nicht, der Bot antwortet

## Die vier stummen Ausfaelle, in fester Reihenfolge pruefen

**Regel:** Ein Dienst mit `active (running)` kann trotzdem taub sein. Bei stummem
Bot in dieser Reihenfolge pruefen (vom Billigsten zum Teuersten):

1. **Modell-Limit:** `grep -ic 'spend limit' <bot-log>`. Treffer = Monatslimit
   des Modells erreicht. KEIN Neustart, der hilft nicht (Abrechnungsthema,
   Betreiber entscheidet). Das Limit ist modellspezifisch; Gegenmittel ist das
   festgenagelte Modell im Startskript.
2. **Plugin-Kind tot:** Fehlt der Telegram-Plugin-Prozess in der cgroup des
   Dienstes, ist das Nachrichten-Werkzeug weg und der Bot schreibt ins Leere;
   jede in der Zeit "beantwortete" Nachricht wurde NIE gesendet. Fix: Neustart.
3. **Modaler Dialog:** Der Bot haengt in einer Auswahlfrage oder im Plan-Modus,
   die headless niemand beantworten kann. Nachrichten stauen sich unverarbeitet.
   Dauerfix: die Bot-Rolle verbietet modale Dialoge.
4. **Toter Hintergrund-Agent:** Im Log steht `Waiting for ... background agent`
   mit hochzaehlender Dauer. Die Hauptschleife blockiert unbegrenzt. Fix:
   Neustart; der Kontext bleibt nur mit eingerichteter Session-Wiederaufnahme
   (siehe "Neustart darf den Chat-Kontext nicht kosten" unten).

Der Waechter prueft das alle drei Minuten automatisch und meldet jede Aktion per
Telegram.

**Warum:** Alle vier sind bei uns real passiert: 23.07.2026 das Modell-Limit
(Neustarts brachten nichts, der Prozess war gesund), mehrfach im Juli der
Plugin-Abriss (Bots stundenlang stumm, Dienst gruen), 03.08.2026 stand ein Bot
eine Stunde in einem Auswahl-Dialog, 05.08.2026 wartete einer unbegrenzt auf
einen gestorbenen Hintergrund-Agenten.

**Werkzeug:** `skripte/waechter.sh` mit `vorlagen/waechter.service`,
`vorlagen/waechter.timer`, `vorlagen/waechter.conf-muster`;
`vorlagen/bot-rolle.md` (Regel 1 verbietet modale Dialoge).

**Fertig wenn:** `skripte/waechter.sh --dry-run` laeuft durch und meldet je
Dienst den Zustand, ohne Fehler.

## Der Waechter braucht selbst eine Bremse

**Regel:** Ein Waechter, der zu oft eingreift, ist die Stoerung, gegen die er
schuetzen soll. Drei Sicherungen: alle Antwortwege als Lebenszeichen erkennen
(Text, Reaktion, Voice-Note), Nachrichten aelter als ein paar Stunden
ignorieren, und nie denselben Dienst oefter als einmal pro Viertelstunde neu
starten.

**Warum:** Die erste Fassung bei uns erkannte Antworten nur in einer einzigen
Form und startete die Dienste 148 Mal ohne Anlass neu, 24 Mal an einem einzigen
Tag. Jeder Neustart kostet Kontext und kann laufende Arbeit abbrechen.

**Werkzeug:** `skripte/waechter.sh` (Neustart-Bremse und Alters-Filter sind
eingebaut).

**Fertig wenn:** `systemctl show -p NRestarts --value assistent-bot` bleibt ueber
Tage im niedrigen einstelligen Bereich.

## Neustart darf den Chat-Kontext nicht kosten

**Regel:** Jeder Neustart (Nacht-Timer, Wochen-Neustart, Waechter) beendet die
laufende Claude-Session. Ohne Vorsorge beginnt der Bot danach mit leerem
Gedaechtnis, und der Mensch redet jeden Morgen mit einem Fremden. Deshalb
gehoert zu jedem Bot-Dienst die Session-Wiederaufnahme: ein Hook merkt sich bei
jedem Session-Start und jeder Nachricht die Session-ID in einer Pointer-Datei
(`/root/.assistent-session-<dienst>`), das Startskript nimmt beim naechsten
Start genau diese Session wieder auf. Schlaegt die Wiederaufnahme fehl, startet
der Bot frisch und schreibt den Grund ins Log, statt zu haengen. Das gilt auch
fuer den woechentlichen Reihum-Neustart aller Bots gegen Speicher-Bloat
(`vorlagen/wochen-neustart.service` + `.timer`, sonntags 04:00, gestaffelt ueber
`skripte/wochen-neustart.sh`).

**Warum:** Ein Neustart-Timer sieht von aussen immer gesund aus; dass der Bot
dabei jedes Mal den kompletten Gespraechsstand verlor, fiel bei uns erst an
Rueckfragen wie "wovon redest du?" auf. Der Verlust ist unsichtbar, bis der
Mensch ihn bemerkt.

**Werkzeug:** `skripte/session-track.sh` (der Hook),
`vorlagen/settings-muster.json` (Hook-Verdrahtung fuer ~/.claude/settings.json,
Erklaerung und Merge-Regeln in `vorlagen/settings-muster.md`) und der
Resume-Zweig in `vorlagen/assistent-bot-start`; `ASSISTENT_DIENST` setzt
`vorlagen/assistent-bot.service`.

**Fertig wenn:** Die Pointer-Datei `/root/.assistent-session-<dienst>` existiert
und enthaelt eine Session-ID, und nach `systemctl restart assistent-bot`
beantwortet der Bot eine Frage mit Bezug auf den Chat-Verlauf davor.

## Timer-Abnahme: enabled ist nicht gestartet

**Regel:** `systemctl enable` ohne `--now` legt nur den Symlink an; der Timer
feuert bis zum naechsten Reboot nie. Nach jedem Anlegen: `enable --now`, dann
`systemctl list-timers <name> --all` lesen. Ein Strich bei NEXT heisst: der Timer
ist tot, egal was `is-enabled` sagt.

**Warum:** Am 22.08.2026 stellte sich bei uns heraus, dass der
Nacht-Neustart-Timer seit einem Monat enabled war und nie gelaufen ist. Zwei Bots
liefen wochenlang ohne den vorsorglichen Neustart; keine oberflaechliche
Pruefung hatte es bemerkt.

**Werkzeug:** `vorlagen/waechter.timer` und `vorlagen/nacht-neustart.timer`.

**Fertig wenn:** `systemctl list-timers 'assistent-*' --all` zeigt bei JEDEM
Timer einen NEXT-Zeitpunkt, keinen Strich. Gegenprobe:
`journalctl -u <dienst> -n 5`; "No entries" heisst nie gelaufen.

## pkill trifft sich selbst

**Regel:** `pkill -f` und `pgrep -f` durchsuchen ALLE Kommandozeilen, auch die
des eigenen Befehls. Steht das Suchmuster im Befehl selbst, killt pkill zuerst
die eigene Shell: Exit-Code ohne Wirkung, kein Zielprozess beendet. Immer eine
Zeichenklasse ins Muster setzen: `pkill -f 'assistent-bo[t]'`.

**Warum:** Am 05.08.2026 scheiterten bei uns vier Aufraeumversuche gegen rund 95
haengende Chrome-Prozesse still an genau diesem Selbsttreffer. Die Last stieg auf
128, und ein Hintergrund-Agent eines Bots starb dabei.

**Werkzeug:** `skripte/waechter.sh` nutzt durchgehend das
Zeichenklassen-Muster.

**Fertig wenn:** `pgrep -cf 'assistent-bo[t]'` liefert die Zahl der echten
Prozesse; derselbe Aufruf ohne Zeichenklasse liefert eins mehr (der eigene
Befehl zaehlt mit): das ist der Beweis, warum die Klasse noetig ist.

## Headless braucht ein Pseudo-Terminal

**Regel:** Claude Code als Dienst startet ueber `script -qfec "..." <log>`.
Ohne PTY faellt er in den Nicht-Interaktiv-Modus und stirbt oder haengt am
ersten Dialog. Als root ist der Berechtigungs-Skip-Schalter blockiert; Autonomie
kommt stattdessen aus einer breiten Allowlist plus `--permission-mode
acceptEdits`.

**Warum:** Beim ersten Server-Setup bei uns (13.07.2026) starb der Dienst ohne
PTY sofort mit "Input must be provided"; spaeter hingen Sitzungen an
Update-Dialogen, die niemand sehen konnte.

**Werkzeug:** `vorlagen/assistent-bot.service` (ExecStart mit `script -qfec`).

**Fertig wenn:** `grep 'script -qfec' /etc/systemd/system/assistent-bot.service`
trifft und der Dienst uebersteht einen Neustart mit antwortendem Bot.

## Resume-Dialog-Haenger nach Neustarts

**Regel:** Beim Wiederaufnehmen grosser oder alter Sessions zeigt Claude Code
einen interaktiven "Resume from summary?"-Dialog. Headless drueckt niemand
Enter: der Dienst haengt ewig, sieht aber gesund aus. Beide Schwellen in der
Env-Datei effektiv unendlich setzen:
```
CLAUDE_CODE_RESUME_TOKEN_THRESHOLD=1000000000
CLAUDE_CODE_RESUME_THRESHOLD_MINUTES=1000000000
```

**Warum:** Bei uns waren Dienste nach Neustarts laut systemd `active (running)`
und trotzdem tot; der Prozess wartete am Dialog. Tueckisch: es passiert erst,
wenn die Session gross genug ist, also nie beim ersten Test.

**Werkzeug:** `vorlagen/env-muster` als Ablageort (Datei wird per
EnvironmentFile von `vorlagen/assistent-bot.service` geladen).

**Fertig wenn:**
```
tr '\0' '\n' < /proc/$(systemctl show -p MainPID --value assistent-bot)/environ | grep -c CLAUDE_CODE_RESUME
```
Ausgabe: `2` (Werte selbst nie ausgeben).
