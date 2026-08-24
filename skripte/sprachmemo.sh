#!/usr/bin/env bash
# Text -> Sprachsynthese -> Telegram-Voice-Note.
#
#   ./sprachmemo.sh memo.txt --kanal mein-kanal --chat 123456789
#   echo "Text" | ./sprachmemo.sh - --kanal mein-kanal --chat 123456789
#   ./sprachmemo.sh memo.txt --kanal mein-kanal --chat 123456789 --keep out.ogg
#   ./sprachmemo.sh memo.txt --no-send   # nur rendern, nicht senden
set -euo pipefail

usage() {
  echo "Nutzung: sprachmemo.sh <datei|-> --kanal <kanal> --chat <chat-id> [--keep <pfad>] [--no-send]" >&2
  exit 1
}

SRC="${1:-}"
[ -n "$SRC" ] || usage
shift || true

KANAL=""; CHAT=""; KEEP=""; SEND=1
while [ $# -gt 0 ]; do
  case "$1" in
    --kanal) KANAL="${2:?--kanal braucht einen Namen}"; shift 2;;
    --chat) CHAT="${2:?--chat braucht eine Chat-ID}"; shift 2;;
    --keep) KEEP="${2:?--keep braucht einen Pfad}"; shift 2;;
    --no-send) SEND=0; shift;;
    *) echo "unbekannte Option: $1" >&2; exit 1;;
  esac
done

if [ "$SEND" = "1" ] && { [ -z "$KANAL" ] || [ -z "$CHAT" ]; }; then
  echo "Fehler: zum Senden werden --kanal und --chat benoetigt (oder --no-send verwenden)." >&2
  usage
fi

TEXT=$([ "$SRC" = "-" ] && cat || cat "$SRC")
[ -n "${TEXT// }" ] || { echo "leerer Text" >&2; exit 1; }

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
WAV="$TMP/memo.wav"; OGG="$TMP/memo.ogg"

# --- TTS: austauschbar ----------------------------------------------------
# Bevorzugt Gemini (Cloud, natuerliche Stimme, braucht GEMINI_API_KEY), sonst
# piper als lokaler Fallback (offline, kostenlos, kein Kontingent). Andere
# TTS-Engines lassen sich hier einhaengen, das Ergebnis muss eine WAV-Datei
# unter $WAV sein.
if [ -n "${GEMINI_API_KEY:-}" ]; then
  # Mehrere Schluessel durchprobieren: GEMINI_API_KEY, dann GEMINI_API_KEY_2, _3, ...
  # ACHTUNG: Das hilft nur, wenn die Schluessel aus VERSCHIEDENEN Google-Cloud-
  # Projekten stammen. Kontingente haengen laut Doku am Projekt, nicht am
  # Schluessel, ein zweiter Schluessel im selben Projekt bringt kein Kontingent.
  KEYS="$GEMINI_API_KEY"
  for i in 2 3 4; do
    v=$(eval "printf '%s' \"\${GEMINI_API_KEY_$i:-}\"")
    [ -n "$v" ] && KEYS="$KEYS $v"
  done
  export KEYS
  TEXT="$TEXT" WAV="$WAV" python3 - <<'PY' || true
import base64, json, os, struct, sys, time, urllib.request
keys = os.environ.get("KEYS", os.environ["GEMINI_API_KEY"]).split()
text = os.environ["TEXT"].strip()
body = {"contents": [{"parts": [{"text": text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
          "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Charon"}}}}}
basis = ("https://generativelanguage.googleapis.com/v1beta/models/"
         "gemini-2.5-flash-preview-tts:generateContent?key=")
key_i = 0
url = basis + keys[key_i]
for attempt in range(4):
    try:
        req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json"})
        r = json.load(urllib.request.urlopen(req, timeout=300))
        p = r["candidates"][0]["content"]["parts"][0]["inlineData"]
        pcm = base64.b64decode(p["data"])
        mime = p.get("mimeType", "")
        rate = int(mime.split("rate=")[1].split(";")[0]) if "rate=" in mime else 24000
        with open(os.environ["WAV"], "wb") as f:
            f.write(b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " +
                    struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16) +
                    b"data" + struct.pack("<I", len(pcm)) + pcm)
        u = r.get("usageMetadata", {})
        print(f"vertont: {len(text)} Zeichen, {u.get('candidatesTokenCount','?')} Audio-Token", file=sys.stderr)
        break
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            err = json.load(e).get("error", {})
            for d in err.get("details", []):
                for v in d.get("violations", []):
                    if "PerDay" in (v.get("quotaId") or ""):
                        detail = f" Tageskontingent erschoepft ({v.get('quotaValue')} Requests/Tag, Free Tier)."
        except Exception:
            pass
        print(f"  Versuch {attempt+1}: HTTP {e.code}{detail}", file=sys.stderr)
        # Tageslimit: jeder weitere Versuch verbrennt nur Kontingent, sofort raus.
        if detail:
            # Kontingent leer: naechsten Schluessel probieren, sonst aufgeben.
            if key_i + 1 < len(keys):
                key_i += 1
                url = basis + keys[key_i]
                print(f"  Kontingent erschoepft, wechsle auf Schluessel {key_i + 1}", file=sys.stderr)
                continue
            sys.exit("TTS fehlgeschlagen: Tageskontingent erschoepft auf allen "
                     f"{len(keys)} Schluessel(n), Reset um Mitternacht US-Pacific (~09:00 Berlin).")
        if attempt == 3: sys.exit("TTS fehlgeschlagen")
        time.sleep(12)
PY
fi

if [ ! -s "$WAV" ]; then
  PIPER_STIMME="${PIPER_STIMME:-/root/.local/share/piper-voices/de_DE-thorsten-medium.onnx}"
  if command -v piper >/dev/null && [ -f "$PIPER_STIMME" ]; then
    echo "  nutze lokale Stimme (piper)" >&2
    printf '%s' "$TEXT" | piper -m "$PIPER_STIMME" -f "$WAV" 2>/dev/null
  fi
fi

[ -s "$WAV" ] || { echo "kein TTS verfuegbar: GEMINI_API_KEY setzen oder piper installieren" >&2; exit 1; }
# --- Ende TTS --------------------------------------------------------------

# Telegram akzeptiert Voice-Notes nur als OGG/Opus
ffmpeg -y -i "$WAV" -c:a libopus -b:a 48k "$OGG" -loglevel error
DUR=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$OGG" | cut -d. -f1)
echo "Laenge: ${DUR}s"

[ -n "$KEEP" ] && cp "$OGG" "$KEEP" && echo "gesichert: $KEEP"

if [ "$SEND" = "1" ]; then
  ENV_DATEI="/root/.claude/channels/${KANAL}/.env"
  [ -f "$ENV_DATEI" ] || { echo "Kanal-Env nicht gefunden: $ENV_DATEI" >&2; exit 1; }
  # Der Chat folgt dem Bot-Token: das Memo immer ueber den Bot senden, in
  # dessen Chat das Gespraech gerade laeuft.
  # shellcheck disable=SC1090
  source "$ENV_DATEI"
  : "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN fehlt in $ENV_DATEI}"
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVoice" \
    -F "chat_id=${CHAT}" -F "voice=@$OGG" -F "duration=$DUR" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('als Voice-Note gesendet' if d.get('ok') and 'voice' in d.get('result',{})
      else 'FEHLER: '+str(d.get('description'))[:120])"
fi
