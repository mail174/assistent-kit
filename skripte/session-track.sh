#!/bin/bash
# Merkt sich die Session-ID der Bot-Dienste, damit das Startskript nach einem
# Neustart dieselbe Session wiederaufnehmen kann (der Chat-Kontext bleibt).
# Wird als SessionStart- und UserPromptSubmit-Hook aufgerufen (Verdrahtung:
# vorlagen/settings-muster.json) und tut nichts, wenn ASSISTENT_DIENST nicht
# gesetzt ist, also in jeder normalen interaktiven Sitzung.
#
# ASSISTENT_DIENST  Kurzname des Dienstes (z. B. "haupt"), kommt aus der
#                   systemd-Unit. Pointer-Datei: $HOME/.assistent-session-<name>
# ASSISTENT_ORDNER  Arbeitsordner der Bot-Sessions (Default: /root/assistent).
#                   Nur Sessions aus diesem Ordner werden gemerkt.
#
# Schutz vor verschachtelten Sessions: startet ein Bot aus seinem Bash-Werkzeug
# selbst ein `claude -p ...`, erbt das Kind ASSISTENT_DIENST und wuerde den
# Pointer mit seiner eigenen Session-ID ueberschreiben. Deshalb: stehen in der
# Prozess-Ahnenkette zwei oder mehr claude-Prozesse, nichts schreiben.
[ -z "${ASSISTENT_DIENST:-}" ] && exit 0
ORDNER="${ASSISTENT_ORDNER:-/root/assistent}"
claudes=0
p=$$
for _ in $(seq 1 15); do
  p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
  if [ -z "$p" ] || [ "$p" -le 1 ]; then break; fi
  argv0=$(tr '\0' '\n' < "/proc/$p/cmdline" 2>/dev/null | head -1)
  [ "$(basename "$argv0" 2>/dev/null)" = "claude" ] && claudes=$((claudes+1))
done
[ "$claudes" -ge 2 ] && exit 0
sid=$(jq -r --arg ordner "$ORDNER" 'select(.cwd == $ordner) | .session_id // empty' 2>/dev/null)
[ -n "$sid" ] && printf '%s\n' "$sid" > "${HOME:-/root}/.assistent-session-$ASSISTENT_DIENST"
exit 0
