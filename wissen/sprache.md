# Sprache: Sprachnachricht rein, Sprachmemo raus

## Eingehende Sprachnachrichten immer lokal transkribieren

**Regel:** Sprachnachrichten werden lokal mit faster-whisper transkribiert
(`skripte/transcribe.py`), nie ueber einen Cloud-Dienst. Kein API-Schluessel,
kein Kontingent, keine Kosten.

**Warum:** Am 05.08.2026 fielen bei uns zwei Cloud-Wege am selben Tag aus: das
Gratis-Kontingent erlaubt rund 10 Anfragen pro Tag, danach kommt HTTP 429 bis zum
Reset. Zwei Sprachnachrichten blieben stundenlang ungehoert, eine enthielt eine
Anweisung, die dadurch liegen blieb. Zusaetzlich halluzinierte der Cloud-Dienst
bei Themen-Hinweisen im Prompt Inhalte, die nie gesagt wurden. Lokal gibt es
beides nicht. Achtung: die Transkription verhoert sich zuverlaessig bei
Eigennamen; Projektnamen gegen die bekannten Begriffe pruefen, nicht woertlich
nehmen.

**Werkzeug:** `skripte/transcribe.py <audiodatei>` (Modellwahl per `--model`).

**Fertig wenn:** `python3 skripte/transcribe.py test.ogg` gibt den gesprochenen
Text aus, ohne dass ein API-Schluessel gesetzt ist.

## Memos als echte Voice-Note, nie als Datei

**Regel:** Ausgehende Sprachmemos gehen als echte Telegram-Sprachnachricht raus
(sendVoice, OGG mit Opus-Codec), nicht als Datei-Anhang. Das normale
Nachrichten-Werkzeug verschickt Dateien als Dokument, das reicht nicht.

**Warum:** Am 28.07.2026 kam das Memo bei uns als Datei-Anhang an statt als
abspielbare Sprachnachricht mit Wellenform; der Mensch hat es sofort moniert.
Falsches Containerformat (kein OGG/Opus) behandelt Telegram ebenfalls als Datei.

**Werkzeug:** `skripte/sprachmemo.sh` (Text rein, Voice-Note raus, prueft das
Ergebnis auf `result.voice`).

**Fertig wenn:** Die API-Antwort des Versands enthaelt `result.voice` (nicht
`document`), im Chat erscheint eine abspielbare Note.

## Der Chat folgt dem Bot-Token, nicht der Empfaenger-ID

**Regel:** Jeder Bot hat mit demselben Menschen einen EIGENEN Chat. Welcher Chat
ein Memo erreicht, bestimmt der Token, mit dem gesendet wird, nicht die
Empfaenger-ID. Vor jedem Memo pruefen, aus welchem Bot die Anfrage kam, und den
Kanal explizit setzen.

**Warum:** Am 05.08.2026 bat der Mensch im Chat von Bot A um ein Memo, es tauchte
im Chat von Bot B auf: das Skript hatte den Token eines anderen Kanals fest
verdrahtet. Von aussen sieht das aus wie eine verlorene Antwort.

**Werkzeug:** `skripte/sprachmemo.sh` erzwingt das: `--kanal <name>` ist
Pflichtparameter, kein Default. Regel 5 in `vorlagen/bot-rolle.md` sichert es im
Systemprompt ab.

**Fertig wenn:** Das Memo erscheint im selben Chat wie die Anfrage.

## Sprachsynthese braucht eine Fallback-Kette

**Regel:** Sprachsynthese nie auf einen einzigen Cloud-Dienst bauen. Kette:
Cloud-TTS primaer (Gratis-Kontingent ca. 10 Vertonungen/Tag, Reset Mitternacht
US-Pacific), lokale Stimme (piper) als kontingentfreie Ebene. Ist trotzdem alles
tot: Inhalt als Text schicken und den Grund nennen, nicht schweigen.

**Warum:** Am 18.08.2026 waren bei uns zwei Cloud-Wege gleichzeitig tot und das
Sprachmemo fiel komplett aus; am 21.08.2026 war das Tageslimit erneut erreicht.
Erst die lokale Stimme machte Memos unabhaengig vom Kontingent: sie klingt
schlichter, aber eine schlichte Stimme schlaegt gar keine.

**Werkzeug:** `skripte/sprachmemo.sh` (TTS-Block mit eingebautem piper-Fallback,
mehrere Schluessel nur aus VERSCHIEDENEN Cloud-Projekten sinnvoll, Kontingente
haengen am Projekt).

**Fertig wenn:** `echo "Test" | ./skripte/sprachmemo.sh - --no-send` erzeugt auch
ohne gesetzten `GEMINI_API_KEY` eine Audiodatei (Meldung "nutze lokale Stimme").
