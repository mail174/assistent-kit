#!/usr/bin/env bash
# Vor dem naechtlichen Neustart: die laufende Sitzung ihren eigenen Uebergabebrief
# schreiben lassen.
#
# Warum die Sitzung selbst und nicht eine Zusammenfassung von aussen: sie kennt Dinge,
# die in keinem System stehen. Warum eine Entscheidung so fiel, welcher Faden offen ist,
# was gerade beim Gegenueber liegt. Die Datenbank kennt nur das Ergebnis.
#
# Zwei Ebenen:
#   uebergabe/<bot>.md        eine Seite, wird bei JEDEM Start mitgegeben
#   uebergabe/log/<datum>.md  Tagesarchiv, wird NICHT mitgegeben, nur bei Bedarf gelesen
#
# Der Neustart haengt nie an diesem Schritt. Schlaegt er fehl, wird trotzdem gestartet
# und der Betreiber bekommt eine Meldung.
set -uo pipefail

BOT="${1:?Nutzung: uebergabe-schreiben.sh <bot> <session-pointer>}"
POINTER="${2:?Pointer-Datei fehlt}"
REPO="${ASSISTENT_ORDNER:-/root/assistent}"
BRIEF="$REPO/uebergabe/${BOT}.md"
HEUTE=$(date +%F)
LOGD="$REPO/uebergabe/log/${BOT}-${HEUTE}.md"
CONF="${WAECHTER_CONF:-$REPO/skripte/waechter.conf}"

mkdir -p "$REPO/uebergabe/log"

melde() {
  local tok chat
  [ -f "$CONF" ] || return 0
  # shellcheck disable=SC1090
  . "$CONF"
  chat="${CHAT_ID:-}"; [ -z "$chat" ] && return 0
  local dir; dir=$(systemctl show -p Environment --value "${SERVICES%% *}" 2>/dev/null | tr ' ' '\n' | grep '^TELEGRAM_STATE_DIR=' | cut -d= -f2-)
  [ -z "$dir" ] && return 0
  tok=$(grep -m1 '^TELEGRAM_BOT_TOKEN=' "$dir/.env" 2>/dev/null | cut -d= -f2- | tr -d '"'"'"'[:space:]')
  [ -z "$tok" ] && return 0
  curl -s -m 15 "https://api.telegram.org/bot${tok}/sendMessage" \
    --data-urlencode "chat_id=${chat}" --data-urlencode "text=$1" >/dev/null 2>&1
}

SID=$(tr -d '[:space:]' < "$POINTER" 2>/dev/null || true)
if [ -z "$SID" ] || ! find "$HOME/.claude/projects" -name "$SID.jsonl" -print -quit 2>/dev/null | grep -q .; then
  melde "Uebergabe $BOT: keine laufende Sitzung gefunden, Neustart laeuft trotzdem."
  exit 0
fi

AUFTRAG="Schreibe jetzt deinen Uebergabebrief fuer die naechste Sitzung. Du wirst gleich neu gestartet.

Schreibe ZWEI Dateien ueber das Write-Werkzeug, ohne Rueckfragen:

1. $BRIEF
   Hoechstens eine Seite. Wird bei jedem Start der naechsten Sitzung mitgegeben, jedes
   Wort kostet dort Kontext. Schreibe sie KOMPLETT NEU, haenge nichts an.
   Nur was NICHT in den angebundenen Systemen steht, denn das kann die naechste Sitzung
   selbst abfragen. Also: laufende Faeden, getroffene Entscheidungen mit Begruendung,
   offene Rueckfragen an den Menschen, was gerade beim Gegenueber liegt, was halb fertig
   ist. Was heute abgeschlossen wurde, faellt raus.

2. $LOGD
   Tagesarchiv, ausfuehrlicher, wird NICHT mitgegeben. Was heute passiert ist, welche
   Entscheidungen fielen und warum, welche Zahlen dahinterstehen, was schiefging.

Danach antworte NUR mit: uebergabe geschrieben"

cd "$REPO"
timeout 600 script -qfec "claude --resume $SID -p $(printf '%q' "$AUFTRAG") --permission-mode acceptEdits" /dev/null >/dev/null 2>&1

if [ -f "$BRIEF" ] && [ "$(find "$BRIEF" -mmin -15 2>/dev/null)" ]; then
  echo "$(date -Iseconds) $BOT: Brief geschrieben ($(wc -c < "$BRIEF") Bytes)" >> /var/log/uebergabe.log
else
  melde "Uebergabe $BOT: Brief wurde nicht geschrieben, Neustart laeuft trotzdem. Die naechste Sitzung startet ohne frischen Stand."
  echo "$(date -Iseconds) $BOT: FEHLGESCHLAGEN" >> /var/log/uebergabe.log
fi
exit 0
