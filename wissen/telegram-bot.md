# Telegram-Bot: Einrichtung ohne die bekannten Loecher

## Ein Zustandsordner je Bot, ueberall derselbe

**Regel:** Jeder Bot bekommt ein eigenes `TELEGRAM_STATE_DIR` unter
`/root/.claude/channels/<name>`. Dienst-Unit, Startskript und der Ordner, in dem
der Token abgelegt wurde, muessen auf EXAKT denselben Pfad zeigen. Der
Standard-Ordner ohne Namenszusatz darf nicht existieren, sonst greift jede
beliebige Claude-Session darauf zu.

**Warum:** Zwei Vorfaelle. Erstens die Kapern-Falle: Telegram erlaubt nur einen
Update-Abholer je Token. Wer zuletzt startet, gewinnt; der andere Bot lebt weiter,
empfaengt aber nichts. Bei uns legte so jede neue Session den Haupt-Bot still,
bis jeder Bot seinen eigenen Ordner bekam (dokumentiert 10.08.2026). Zweitens der
Setup-Call am 24.08.2026: bei einem Teilnehmer zeigten Dienst-Unit und
Token-Ablage auf unterschiedliche Ordner. Der Dienst lief, der Bot blieb stumm,
weil er den Token nie fand.

**Werkzeug:** `vorlagen/assistent-bot.service` und `vorlagen/assistent-bot-start`
markieren die Stelle mit ACHTUNG-Kommentaren.

**Fertig wenn:**
```
D=$(systemctl show -p Environment assistent-bot | tr ' ' '\n' | grep -o 'TELEGRAM_STATE_DIR=.*' | cut -d= -f2)
echo "$D"; test -s "$D/.env" && echo TOKEN-DA
```
Ausgabe: der Ordnerpfad und `TOKEN-DA`. Endgueltige Abnahme ist immer eine echte
zugestellte Nachricht, nie nur `systemctl is-active` (bei uns war am 19.08.2026
alles gruen, waehrend der Kanal gar nicht lief).

## Modell im Startskript festnageln, mit vollem Effort

**Regel:** Das Modell wird im Startskript hart gesetzt, Standard fuer
Telegram-Bots: `--model opus --effort max` (aenderbar, wenn der Mensch anderes
wuenscht). Nie das Modell der wiederaufgenommenen Session erben lassen.

**Warum:** Am 23.07.2026 war ein Bot bei uns scheinbar tot. Der Prozess lief,
intern kam auf jede Nachricht nur die Meldung, das Monatslimit des Modells sei
erreicht. Die Session war still auf ein Ausweich-Modell gefallen, dessen Limit
erschoepft war; das Limit ist modellspezifisch, ein Neustart haette nichts
gebracht.

**Werkzeug:** `vorlagen/assistent-bot-start` (Zeile mit `EXTRA=`).

**Fertig wenn:** `grep -- '--model' /usr/local/bin/assistent-bot-start` zeigt die
Zeile mit `--model opus --effort max`.

## /start-Pflicht: ein Bot kann keinen Chat eroeffnen

**Regel:** Ein neuer Bot kann niemandem zuerst schreiben. Der Mensch schickt als
ersten Schritt `/start` an @botname; erst danach existiert der Chat. IDs aus einem
anderen Bot helfen nicht, Chats gelten pro Bot.

**Warum:** Am 19.08.2026 war bei uns ein frischer Bot korrekt oben (Dienst aktiv,
Token validiert), trotzdem scheiterte jede Begruessung mit
`400 Bad Request: chat not found`. Das sieht nach kaputtem Setup aus, ist aber
Telegram-Policy.

**Werkzeug:** `skills/setup` fuehrt den /start-Schritt vor dem ersten Sendeversuch.

**Fertig wenn:** Nach `/start` beantwortet der Bot eine Testnachricht im selben
Chat.

## BotFather: Erwartungen vorher setzen

**Regel:** Der Username ist EIN Wort, endet zwingend auf `bot`, und beliebte Namen
sind vergeben. Vor dem BotFather-Dialog zwei bis drei Kandidaten zurechtlegen.

**Warum:** Im Setup-Call am 24.08.2026 brauchte ein Teilnehmer vier Fehlversuche
fuer einen Wunschnamen. Ohne Vorwarnung ist das der erste Frustmoment des Setups.

**Werkzeug:** `skills/setup` nennt die Regeln vor dem BotFather-Schritt.

**Fertig wenn:**
```
. "$D/.env" && curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | jq -r .result.username
```
Ausgabe: der gewuenschte Username (Token dabei nie ausgeben).

## Nach dem Token-Hinterlegen: Kanal-Neustart

**Regel:** Nachdem der Token hinterlegt ist, wird die laufende Claude-Session
beendet (`/exit`) und neu mit `--channels` gestartet bzw. der Dienst gestartet.
Der Kanal laedt nur beim Start. Dass der Token im Chatverlauf steht, ist beim
Setup unvermeidbar: weiterarbeiten, spaeter rotieren, keine Sicherheitsdebatte
mitten im Setup.

**Warum:** Das war am 24.08.2026 die haeufigste Verwirrung im Setup-Call: Token
gesetzt, nichts passiert, weil die alte Session ohne Kanal weiterlief.

**Werkzeug:** `vorlagen/assistent-bot-start` (der Dienstweg macht den Neustart zum
Normalfall: `systemctl restart assistent-bot`).

**Fertig wenn:** Eine Nachricht an den Bot wird beantwortet.

## Erst Pairing, dann Allowlist

**Regel:** Beim Setup laeuft der Zugang ueber Pairing, danach steht jede erlaubte
Person in der Allowlist (`access.json` im Zustandsordner). Gruppen muessen
ausdruecklich freigeschaltet werden.

**Warum:** Ohne Allowlist kann jeder Fremde, der den Bot findet, den Agenten samt
Serverzugriff benutzen. Und nicht freigeschaltete Gruppen verwirft das Plugin
still, ohne Logzeile: bei uns kam eine Gruppen-Nachricht deshalb nie an, die
Fehlersuche lief zunaechst in die falsche Richtung.

**Werkzeug:** `skills/setup`; Ablage ist `access.json` im jeweiligen
Zustandsordner.

**Fertig wenn:** `jq . "$D/access.json"` zeigt die eigene Telegram-ID als erlaubt,
und eine Testnachricht von einem fremden Konto bleibt unbeantwortet.
