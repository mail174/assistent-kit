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

# Kurze Meldung in den Chat. Token kommt aus dem Zustandsordner des ersten Dienstes,
# Chat-Id aus der waechter.conf. Fehlt eins von beidem, bleibt es still.
melden() {
  local tok chat dir
  chat="${CHAT_ID:-}"; [ -z "$chat" ] && return 0
  dir=$(systemctl show -p Environment --value "${SERVICES%% *}" 2>/dev/null | tr ' ' '\n' | grep '^TELEGRAM_STATE_DIR=' | cut -d= -f2-)
  [ -z "$dir" ] && return 0
  tok=$(grep -m1 '^TELEGRAM_BOT_TOKEN=' "$dir/.env" 2>/dev/null | cut -d= -f2- | tr -d '"'"'"'[:space:]')
  [ -z "$tok" ] && return 0
  curl -s -m 15 "https://api.telegram.org/bot${tok}/sendMessage" \
    --data-urlencode "chat_id=${chat}" --data-urlencode "text=$1" >/dev/null 2>&1
}

for dienst in ${SERVICES:-}; do
  systemctl is-active --quiet "$dienst" || continue
  name=$(systemctl show -p Environment --value "$dienst" | tr ' ' '\n' | grep '^ASSISTENT_DIENST=' | cut -d= -f2-)
  name="${name:-haupt}"
  "$REPO/skripte/uebergabe-schreiben.sh" "$name" "$HOME/.assistent-session-$name"
  # Frisch starten darf nur, wer einen frischen Brief hat. Sonst bleibt die
  # Wiederaufnahme die Rueckfallebene, damit ein misslungenes Schreiben nicht
  # den ganzen Stand kostet. Den Marker liest vorlagen/assistent-bot-start.
  frisch=0
  if [ -n "$(find "$REPO/uebergabe/${name}.md" -mmin -15 2>/dev/null)" ]; then
    touch "$HOME/.assistent-frisch-${name}"
    frisch=1
  else
    echo "$(date -Iseconds) $name: kein frischer Brief, Neustart mit Wiederaufnahme" >&2
  fi
  systemctl restart "$dienst"
  sleep 45   # gestaffelt, sonst laufen mehrere Sitzungen gleichzeitig hoch

  # Rueckmeldung nach dem Neustart: laeuft der Bot wieder, und hat der Brief den
  # Start getragen? Den Frisch-Marker holt das Startskript ab, sein Verschwinden
  # ist der Beleg dafuer.
  if ! systemctl is-active --quiet "$dienst"; then
    zustand="laeuft NICHT, bitte nachsehen"
  elif [ "$frisch" = "1" ] && [ ! -f "$HOME/.assistent-frisch-${name}" ]; then
    zustand="frisch gestartet mit Brief"
  elif [ "$frisch" = "1" ]; then
    zustand="laeuft, hat den Brief aber nicht abgeholt, vermutlich Wiederaufnahme"
    rm -f "$HOME/.assistent-frisch-${name}"
  else
    zustand="laeuft, mit Wiederaufnahme, kein frischer Brief"
  fi
  echo "$(date -Iseconds) $name: $zustand" >&2
  melden "Neustart $name: $zustand"
done
