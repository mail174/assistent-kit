#!/bin/bash
# Waechter: Selbstheilung fuer die Telegram-Bot-Dienste des Assistenten.
# Laeuft alle ~3 Minuten per systemd-Timer (vorlagen/waechter.timer).
#
# systemd mit Restart=always faengt Abstuerze ab. Der Waechter kuemmert sich
# um die Faelle "lebt, aber kaputt":
#   - Dienst down oder claude-Prozess fehlt          -> Neustart
#   - Telegram-Plugin-Kind tot (Bot taub)            -> Neustart
#   - Nachricht rein, keine Antwort raus (haengt)    -> Neustart
#   - Modell-Spend-Limit erreicht                    -> Betreiber pingen, KEIN Neustart
#   - Abgemeldet (Claude-Login abgelaufen)           -> Betreiber pingen, keine Neustarts
#   - RAM-Not                                        -> Betreiber pingen
# Jede korrigierende Aktion wird dem Betreiber per Telegram gemeldet.
#
# Konfiguration: waechter.conf im selben Ordner wie dieses Skript
# (Vorlage: vorlagen/waechter.conf-muster), ueberschreibbar per
# Umgebungsvariable WAECHTER_CONF=/pfad/zur/conf.
#
# --dry-run: kompletter Pruefdurchlauf, aber es wird nichts neu gestartet
# und keine Telegram-Meldung verschickt; stattdessen gibt es Log-Zeilen,
# was passieren WUERDE.
set -u

DRYRUN=0
[ "${1:-}" = "--dry-run" ] && DRYRUN=1

# --- Konfiguration laden -------------------------------------------------------
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
CONF="${WAECHTER_CONF:-$SCRIPT_DIR/waechter.conf}"

SERVICES=""
CHAT_ID=""
if [ -f "$CONF" ]; then
  # shellcheck source=/dev/null
  . "$CONF"
fi
if [ ! -f "$CONF" ] || [ -z "${SERVICES:-}" ] || [ -z "${CHAT_ID:-}" ]; then
  echo "Waechter: Konfiguration fehlt oder ist unvollstaendig ($CONF)."
  echo "Bitte die Vorlage vorlagen/waechter.conf-muster als waechter.conf neben dieses"
  echo "Skript kopieren und SERVICES sowie CHAT_ID ausfuellen."
  echo "Bis dahin tut der Waechter nichts (kein Fehler, der Timer laeuft weiter)."
  exit 0
fi

read -r -a SVC_LIST <<< "$SERVICES"
FIRST_SVC="${SVC_LIST[0]}"

LOG=/var/log/waechter.log
STATE=/run/waechter
mkdir -p "$STATE" 2>/dev/null || true

STUCK_IDLE=480       # Sekunden, die die Session-Datei still sein darf
STALE_MAX=10800      # Nachrichten aelter als ~3 h zaehlen nicht als "unbeantwortet"
RESTART_BRAKE=900    # nie denselben Dienst oefter als 1x pro 15 min neu starten

log(){
  local line
  line="$(date '+%F %T') $*"
  echo "$line" >> "$LOG" 2>/dev/null || true
  if [ "$DRYRUN" = "1" ]; then echo "$line"; fi
}

# Bot-Token fuer die Betreiber-Meldung: aus der .env im Kanal-Ordner des
# ERSTEN Dienstes in SERVICES. Der Ordner steht als TELEGRAM_STATE_DIR in
# dessen systemd-Unit. Der Token selbst wird nie ausgegeben.
bot_token(){
  local dir
  dir=$(systemctl show -p Environment --value "$FIRST_SVC" 2>/dev/null \
        | tr ' ' '\n' | sed -n 's/^TELEGRAM_STATE_DIR=//p' | head -1)
  [ -n "$dir" ] && [ -f "$dir/.env" ] || return 0
  grep -oE '^TELEGRAM_BOT_TOKEN=.*' "$dir/.env" 2>/dev/null \
    | cut -d= -f2- | tr -d '"'\''[:space:]'
}

notify(){
  local msg="$1" tok
  if [ "$DRYRUN" = "1" ]; then
    log "DRYRUN: wuerde dem Betreiber melden: $msg"
    return 0
  fi
  tok=$(bot_token)
  if [ -z "$tok" ]; then
    log "Meldung uebersprungen, kein Bot-Token gefunden ($FIRST_SVC): $msg"
    return 0
  fi
  curl -s -m 10 "https://api.telegram.org/bot${tok}/sendMessage" \
    --data-urlencode "chat_id=${CHAT_ID}" \
    --data-urlencode "text=Waechter: ${msg}" >/dev/null 2>&1
  return 0
}

fix(){ log "FIX: $1"; notify "$1"; }

# 0 = Aktion erlaubt (Zeitstempel wird gesetzt), 1 = noch in der Sperrzeit.
# Im Dry-Run wird kein Zeitstempel gesetzt, damit der Probelauf nichts verstellt.
throttle(){
  local name="$1" secs="$2" st
  st="$STATE/$name"
  if [ -f "$st" ] && [ $(( $(date +%s) - $(stat -c %Y "$st" 2>/dev/null || echo 0) )) -lt "$secs" ]; then
    return 1
  fi
  if [ "$DRYRUN" != "1" ]; then touch "$st" 2>/dev/null || true; fi
  return 0
}

# Neustart-Bremse: nie denselben Dienst oefter als einmal pro 15 Minuten neu
# starten. Hintergrund: eine uebereifrige Erstversion des Waechters hat
# insgesamt 148 Mal neu gestartet, 24 Mal an einem einzigen Tag, weil sie
# Antworten nur in einer Form erkannte (nur das reply-Tool, nicht die direkten
# Bot-API-Aufrufe) und deshalb beantwortete Nachrichten fuer unbeantwortet
# hielt. Zwei Lehren daraus: ALLE Antwortformen erkennen (siehe Muster in
# is_stuck) UND eine harte Bremse pro Dienst.
restart_service(){
  local svc="$1" grund="$2"
  if ! throttle "restart-$svc" "$RESTART_BRAKE"; then
    log "Bremse: $svc wurde vor weniger als 15 min neu gestartet, ueberspringe ($grund)"
    return 0
  fi
  if [ "$DRYRUN" = "1" ]; then
    log "DRYRUN: wuerde $svc neu starten ($grund)"
    return 0
  fi
  systemctl restart "$svc" && fix "$svc: $grund, neu gestartet"
  return 0
}

uptime_secs(){
  local ts now
  ts=$(systemctl show -p ActiveEnterTimestamp --value "$1" 2>/dev/null)
  now=$(date +%s)
  [ -z "$ts" ] && { echo 0; return; }
  echo $(( now - $(date -d "$ts" +%s 2>/dev/null || echo "$now") ))
}

# Alle PIDs im cgroup des Dienstes, eine pro Zeile.
cgroup_pids(){
  local cg
  cg=$(systemctl show -p ControlGroup --value "$1" 2>/dev/null)
  [ -n "$cg" ] || return 0
  cat "/sys/fs/cgroup${cg}/cgroup.procs" 2>/dev/null
  return 0
}

# Laeuft im Dienst ueberhaupt ein claude-Prozess? Der Wrapper (script/Start-
# skript) kann leben, waehrend claude selbst laengst weg ist.
has_claude(){
  local p
  while read -r p; do
    [ -n "$p" ] || continue
    tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null | grep -q 'claude' && return 0
  done < <(cgroup_pids "$1")
  return 1
}

# Lebt das Telegram-Plugin-Kind des Dienstes? Bei einem MCP-Disconnect stirbt
# nur der Plugin-Prozess: claude laeuft weiter, empfaengt aber nichts mehr und
# hat kein reply-Tool. Der Bot ist taub, ohne dass irgendetwas "down" aussieht.
has_tg_plugin(){
  local p
  while read -r p; do
    [ -n "$p" ] || continue
    tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null \
      | grep -q 'claude-plugins-official/telegram' && return 0
  done < <(cgroup_pids "$1")
  return 1
}

# --- Liveness: Nachricht rein, keine Antwort raus ------------------------------
# Die Ausfaelle, die alle Checks oben ueberleben (modaler Dialog, Warten auf
# einen toten Hintergrund-Agenten, haengender Resume-Prompt), sehen von aussen
# identisch aus: es kam etwas rein und es ging nichts raus. Genau das wird hier
# gemessen: nicht ob der Prozess lebt, sondern ob er noch antwortet.

# Schreibt "STATE_DIR SESSION_ID" des Telegram-Plugin-Kindes, oder nichts.
tg_plugin_env(){
  local p dir sid
  while read -r p; do
    [ -n "$p" ] || continue
    [ -r "/proc/$p/cmdline" ] || continue
    tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null \
      | grep -q 'claude-plugins-official/telegram' || continue
    dir=$(tr '\0' '\n' < "/proc/$p/environ" 2>/dev/null | sed -n 's/^TELEGRAM_STATE_DIR=//p' | head -1)
    sid=$(tr '\0' '\n' < "/proc/$p/environ" 2>/dev/null | sed -n 's/^CLAUDE_CODE_SESSION_ID=//p' | head -1)
    [ -n "$dir" ] && [ -n "$sid" ] && { echo "$dir $sid"; return 0; }
  done < <(cgroup_pids "$1")
  return 1
}

# Zeitstempel der letzten Zeile, die MUSTER enthaelt, als Epoch. Liest nur das
# Ende der Datei, die Transkripte werden dreistellig MB gross.
last_ts(){
  local file="$1" muster="$2" iso
  iso=$(tail -c 3000000 "$file" 2>/dev/null | grep -aE "$muster" | tail -1 \
        | grep -oE '"timestamp":"[^"]+"' | tail -1 | cut -d'"' -f4)
  [ -z "$iso" ] && { echo 0; return; }
  date -d "$iso" +%s 2>/dev/null || echo 0
}

# 0 = steckt fest. Gibt den Grund auf stdout aus.
is_stuck(){
  local svc="$1" env dir sid jsonl now idle inb rep inbox_ts
  env=$(tg_plugin_env "$svc") || return 1
  dir=${env%% *}; sid=${env##* }
  jsonl=$(find "${HOME:-/root}/.claude/projects" -maxdepth 2 -name "$sid.jsonl" 2>/dev/null | head -1)
  [ -n "$jsonl" ] && [ -f "$jsonl" ] || return 1

  now=$(date +%s)
  idle=$(( now - $(stat -c %Y "$jsonl") ))
  # Der Agent schreibt bei jeder Aktion in die Session-Datei. Wer schreibt,
  # arbeitet, und wird nicht abgewuergt, egal wie lange der Auftrag laeuft.
  [ "$idle" -lt "$STUCK_IDLE" ] && return 1

  inb=$(last_ts "$jsonl" 'channel source=\\"plugin:telegram')
  # Als Antwort zaehlt beides: das reply-Tool UND ein direkter Aufruf der
  # Bot-API per curl. Ohne den zweiten Teil gilt jede per Bot-API beantwortete
  # Nachricht als unbeantwortet und der Waechter startet immer wieder neu
  # (siehe Vorfall an der Neustart-Bremse oben).
  rep=$(last_ts "$jsonl" 'telegram__reply|api\.telegram\.org/bot[^"]*(sendMessage|sendVoice|sendPhoto|sendDocument)')
  # Uralte Nachrichten sind kein Beleg fuer einen haengenden Agenten. Ohne
  # diese Schranke haelt ein einziger nie beantworteter Eintrag den
  # Neustart-Zyklus unbegrenzt am Laufen.
  if [ "$inb" -gt 0 ] && [ $(( now - inb )) -gt "$STALE_MAX" ]; then
    return 1
  fi
  if [ "$inb" -gt 0 ] && [ "$inb" -gt "$rep" ]; then
    echo "Nachricht von $(date -d "@$inb" '+%H:%M') unbeantwortet, Session seit $((idle/60)) min still"
    return 0
  fi

  # Zweiter Fang: Anhang liegt im Eingang, wurde aber nie in die Session
  # aufgenommen. Trifft den Fall, in dem der Agent die Nachricht gar nicht
  # erst liest, bei Sprachmemos der Normalfall.
  if [ -d "$dir/inbox" ]; then
    inbox_ts=$(find "$dir/inbox" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | cut -d. -f1)
    if [ -n "${inbox_ts:-}" ] && [ "$inbox_ts" -gt "$(stat -c %Y "$jsonl")" ] \
       && [ $(( now - inbox_ts )) -gt "$STUCK_IDLE" ] \
       && [ $(( now - inbox_ts )) -le "$STALE_MAX" ]; then
      echo "Anhang von $(date -d "@$inbox_ts" '+%H:%M') nie verarbeitet, Session seit $((idle/60)) min still"
      return 0
    fi
  fi
  return 1
}

# --- 1. Abgemeldet? Gilt kontoweit, nicht pro Bot. Neustarts helfen dann nicht,
# sie werfen nur Sessions weg: der frische Prozess bootet direkt ins
# "Not logged in". Also Betreiber pingen und alle Neustart-Zweige stilllegen.
# Quelle ist bewusst die Credentials-Datei, nicht der Bildschirm: ein resumtes
# Transkript zeigt alte "Please run /login"-Zeilen ewig weiter und wuerde die
# Selbstheilung dauerhaft stilllegen.
CREDS="${HOME:-/root}/.claude/.credentials.json"
LOGGED_OUT=0
if [ ! -s "$CREDS" ]; then
  LOGGED_OUT=1
else
  exp=$(sed -n 's/.*"expiresAt"[[:space:]]*:[[:space:]]*\([0-9]\{10,\}\).*/\1/p' "$CREDS" | head -1)
  [ -n "$exp" ] && [ $(( exp / 1000 )) -lt "$(date +%s)" ] && LOGGED_OUT=1
fi
if [ "$LOGGED_OUT" = "1" ]; then
  if throttle "loggedout" 3600; then
    notify "Claude Code ist abgemeldet, die Bots antworten nicht. Auf dem Server 'claude' starten und /login ausfuehren. Bis dahin keine Auto-Neustarts."
    log "ALERT: abgemeldet (claude /login noetig)"
  fi
fi

# --- 2. Pro Dienst: lebt und antwortet er? ---
for svc in "${SVC_LIST[@]}"; do
  if [ "$(systemctl is-active "$svc" 2>/dev/null)" != "active" ]; then
    restart_service "$svc" "Dienst war down"
    continue
  fi
  up=$(uptime_secs "$svc")

  # Wrapper lebt, claude tot?
  if [ "$up" -gt 120 ] && ! has_claude "$svc"; then
    restart_service "$svc" "claude-Prozess fehlte"
    continue
  fi

  # Telegram-Plugin-Kind tot? (Bot lebt, ist aber taub). Erst beim zweiten Mal in
  # Folge neu starten: ein kurzer MCP-Aussetzer, bei dem sich das Plugin selbst
  # wieder verbindet, sieht in diesem Moment genauso aus wie ein Totalausfall, und
  # ein Neustart reisst laufende Arbeit mit.
  tgm="$STATE/plugin-weg-$svc"
  if [ "$LOGGED_OUT" = "0" ] && [ "$up" -gt 240 ] && ! has_tg_plugin "$svc"; then
    if [ ! -f "$tgm" ]; then
      touch "$tgm"
      log "$svc: Telegram-Plugin fehlt, warte einen Zyklus"
    else
      rm -f "$tgm"
      restart_service "$svc" "Telegram-Plugin zweimal in Folge tot (Bot taub)"
      continue
    fi
  else
    rm -f "$tgm"
  fi

  # Lebt, angemeldet, und antwortet trotzdem nicht? Neustart. Der Chat-Kontext
  # ueberlebt das nur, wenn session-track-Hook und Resume-Zweig im Startskript
  # eingerichtet sind (wissen/selbstheilung.md, "Neustart darf den Chat-Kontext
  # nicht kosten"); ohne die beiden startet der Bot frisch und ohne Gedaechtnis.
  if [ "$LOGGED_OUT" = "0" ] && [ "$up" -gt 300 ]; then
    if grund=$(is_stuck "$svc"); then
      restart_service "$svc" "antwortete nicht mehr ($grund)"
      continue
    fi
  fi

  # Spend-Limit im Log? Max 1x pro Stunde pingen, KEIN Neustart: das ist ein
  # Abrechnungsproblem, ein frischer Prozess laeuft in dieselbe Wand.
  # Konvention aus vorlagen/<dienst>.service: das Startskript loggt
  # nach /root/.<dienst>.log.
  lf="/root/.$svc.log"
  if [ -f "$lf" ] && tail -c 6000 "$lf" 2>/dev/null | tr -d '\000' | grep -aiqE 'spend limit|usage limit'; then
    if throttle "spend-$svc" 3600; then
      notify "$svc hat ein Modell-Spend-Limit erreicht. Ein Neustart hilft hier nicht: anderes Modell waehlen oder Limit/Guthaben pruefen."
      log "ALERT: $svc spend-limit"
    fi
  fi
done

# --- 3. Amok-Suchprozesse: Suchkinder der Bot-Dienste, die den RAM fressen ---
# Eine ausser Kontrolle geratene Suche (rg/ugrep/grep ueber einen Riesen-Baum)
# frisst Gigabytes, bis der OOM-Killer wahllos zuschlaegt. Hier stirbt nur das
# Suchkind, nie der Dienst (dazu passt OOMPolicy=continue in der Unit-Vorlage).
# Die Zeichenklassen im Muster (r[g] statt rg) verhindern den Selbsttreffer,
# siehe "pkill trifft sich selbst" in wissen/selbstheilung.md.
AMOK_MIN_AGE=300                                   # juengere Suchen in Ruhe lassen
MEM_TOTAL_KB=$(awk '/MemTotal/{print $2}' /proc/meminfo)
AMOK_RSS_KB=$(( MEM_TOTAL_KB / 5 ))                # ~20 % des Gesamt-RAM
svc_pids=$(for svc in "${SVC_LIST[@]}"; do cgroup_pids "$svc"; done)
# shellcheck disable=SC2009  # pgrep liefert weder etimes noch rss, deshalb ps+grep
while read -r pid etimes rss args; do
  [ -n "${pid:-}" ] || continue
  echo "$svc_pids" | grep -qx "$pid" || continue   # nur Kinder der Bot-Dienste
  [ "$etimes" -gt "$AMOK_MIN_AGE" ] || continue
  [ "$rss" -gt "$AMOK_RSS_KB" ] || continue
  throttle "amok-$pid" 600 || continue
  if [ "$DRYRUN" = "1" ]; then
    log "DRYRUN: wuerde Amok-Suchprozess killen (pid $pid, $((rss/1024))MB, $((etimes/60))min): ${args:0:60}"
  else
    kill -9 "$pid" 2>/dev/null
    fix "Amok-Suchprozess gekillt (pid $pid, $((rss/1024))MB, $((etimes/60))min): ${args:0:60}"
  fi
done < <(ps -eo pid=,etimes=,rss=,args= | grep -E '(^| )(r[g]|ugre[p]|gre[p]) ')

# --- 4. Globale RAM-Not ---
avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
if [ "${avail:-9999}" -lt 400 ]; then
  if throttle "lowmem" 1800; then
    notify "Wenig RAM frei (${avail}MB), bitte beobachten."
    log "ALERT: wenig RAM ${avail}MB"
  fi
fi

log "Durchlauf ok (frei=${avail:-?}MB)"
exit 0
