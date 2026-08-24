# settings-muster.json: Hook-Verdrahtung fuer die Session-Wiederaufnahme

JSON kennt keine Kommentare, deshalb steht die Erklaerung hier.

`settings-muster.json` zeigt NUR den `hooks`-Block, den die
Session-Wiederaufnahme braucht: bei jedem Session-Start und bei jeder
Nachricht laeuft `skripte/session-track.sh` und schreibt die Session-ID des
Dienstes in eine Pointer-Datei (`/root/.assistent-session-<dienst>`). Das
Startskript (`vorlagen/assistent-bot-start`) nimmt beim naechsten Start genau
diese Session wieder auf. Ohne die Hooks verliert der Bot bei jedem Neustart
seinen kompletten Chat-Kontext.

## Einbauen: mergen, nie ueberschreiben

Ziel ist `~/.claude/settings.json`. Diese Datei enthaelt in der Regel schon
anderes (Berechtigungen, Env, weitere Hooks). Das Muster darf sie NIE
ersetzen, sondern wird eingefuegt:

- Hat die Datei noch keinen `hooks`-Block: den `hooks`-Block aus dem Muster
  komplett uebernehmen.
- Gibt es schon `hooks`, aber keine Eintraege fuer `SessionStart` oder
  `UserPromptSubmit`: die fehlenden Event-Eintraege aus dem Muster in den
  bestehenden `hooks`-Block einfuegen.
- Gibt es fuer eines der Events schon Eintraege: den session-track-Eintrag
  von Hand in das BESTEHENDE Array anhaengen. Ein stumpfer Merge (etwa
  `jq -s '.[0] * .[1]'`) ersetzt Arrays komplett und wirft vorhandene Hooks
  weg.

Nach der Aenderung pruefen, dass die Datei gueltiges JSON ist:

```bash
jq . ~/.claude/settings.json >/dev/null && echo ok
```

Wirksam wird die Verdrahtung erst mit der naechsten Session, fuer die Dienste
also nach `systemctl restart <dienst>`. Fertig wenn: nach einem Neustart
existiert `/root/.assistent-session-<dienst>` und enthaelt eine Session-ID.
