#!/usr/bin/env bash
# Naechtlicher Neustart der Bots, mit Uebergabe.
#
# Je Bot: erst den Uebergabebrief schreiben lassen, dann neu starten. Der Brief wird
# beim naechsten Start automatisch mitgegeben. Schlaegt das Schreiben fehl, wird
# trotzdem neu gestartet: ein hakendes Zusammenfassen darf den Betrieb nie blockieren.
#
# Dienste und Pointer stehen in waechter.conf (SERVICES). Der Pointer je Dienst ist
# $HOME/.assistent-session-<dienst>, geschrieben vom Hook skripte/session-track.sh.
set -uo pipefail
REPO="${ASSISTENT_ORDNER:-/root/assistent}"
CONF="${WAECHTER_CONF:-$REPO/skripte/waechter.conf}"
[ -f "$CONF" ] || { echo "keine waechter.conf, nichts zu tun" >&2; exit 0; }
# shellcheck disable=SC1090
. "$CONF"

for dienst in ${SERVICES:-}; do
  systemctl is-active --quiet "$dienst" || continue
  name=$(systemctl show -p Environment --value "$dienst" | tr ' ' '\n' | grep '^ASSISTENT_DIENST=' | cut -d= -f2-)
  name="${name:-haupt}"
  "$REPO/skripte/uebergabe-schreiben.sh" "$name" "$HOME/.assistent-session-$name"
  # Frisch starten darf nur, wer einen frischen Brief hat. Sonst bleibt die
  # Wiederaufnahme die Rueckfallebene, damit ein misslungenes Schreiben nicht
  # den ganzen Stand kostet. Den Marker liest vorlagen/assistent-bot-start.
  if [ -n "$(find "$REPO/uebergabe/${name}.md" -mmin -15 2>/dev/null)" ]; then
    touch "$HOME/.assistent-frisch-${name}"
  else
    echo "$(date -Iseconds) $name: kein frischer Brief, Neustart mit Wiederaufnahme" >&2
  fi
  systemctl restart "$dienst"
  sleep 45   # gestaffelt, sonst laufen mehrere Sitzungen gleichzeitig hoch
done
