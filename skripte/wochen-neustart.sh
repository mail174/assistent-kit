#!/bin/bash
# Woechentlicher Reihum-Neustart aller Bot-Dienste, gegen langsam wachsenden
# Speicher und driftende Prozesse. Liest SERVICES aus waechter.conf (dieselbe
# Konfiguration wie der Waechter) und startet die Dienste gestaffelt neu:
# 45 Sekunden Abstand, damit nicht alle MCP-Flotten gleichzeitig booten.
# Der Chat-Kontext ueberlebt das nur mit eingerichteter Session-Wiederaufnahme
# (wissen/selbstheilung.md, "Neustart darf den Chat-Kontext nicht kosten").
set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
CONF="${WAECHTER_CONF:-$SCRIPT_DIR/waechter.conf}"

SERVICES=""
if [ -f "$CONF" ]; then
  # shellcheck source=/dev/null
  . "$CONF"
fi
if [ -z "${SERVICES:-}" ]; then
  echo "wochen-neustart: keine SERVICES in $CONF gefunden, nichts zu tun."
  exit 0
fi

for svc in $SERVICES; do
  systemctl restart "$svc"
  sleep 45
done
echo "$(date '+%F %T') Wochen-Neustart fertig ($SERVICES)" >> /var/log/waechter.log 2>/dev/null || true
exit 0
