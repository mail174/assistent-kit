#!/usr/bin/env python3
"""Erzwingt Lebenszeichen im Telegram-Chat, statt sie der Disziplin zu ueberlassen.

Laeuft als PreToolUse-Hook vor jedem Werkzeugaufruf und macht zwei Dinge:

  nach 2 Minuten Stille   Erinnerung in meinen eigenen Kontext ("melde dich jetzt"),
                          damit ein inhaltlicher Zwischenstand kommt und kein Baustein
  nach 5 Minuten Stille   der Hook schickt selbst eine Zeile in den Chat, falls ich
                          haenge oder die Erinnerung ignoriere

Der Zeitpunkt der letzten Nachricht kommt aus dem Hook selbst: jeder Aufruf des
Telegram-reply-Werkzeugs setzt die Uhr zurueck. Ausserhalb eines Bot-Dienstes
(kein TELEGRAM_STATE_DIR) tut der Hook nichts, damit Terminal- und VS-Code-Sitzungen
unberuehrt bleiben.

Hintergrund: Die Regel "melde dich, bevor der Mensch nachfragt" stand bei uns lange
nur in der Rollendatei und wurde trotzdem regelmaessig gebrochen. Eine Regel als Text
ist beratend, ein Hook ist Mechanik. Siehe wissen/telegram.md.
"""
import json
import os
import subprocess
import sys
import time

STILLE_ERINNERUNG = 120
STILLE_NOTRUF = 300


def zustandsdatei(dir_):
    return "/run/lebenszeichen-%s.json" % os.path.basename(dir_.rstrip("/"))


def lies(pfad):
    try:
        with open(pfad) as f:
            return json.load(f)
    except Exception:
        return {}


def schreib(pfad, zustand):
    try:
        with open(pfad, "w") as f:
            json.dump(zustand, f)
    except Exception:
        pass


def notruf(state_dir, chat_id, minuten):
    """Kurze Zeile ueber die Bot-API, im Hintergrund, ohne den Werkzeugaufruf zu bremsen."""
    tok = ""
    try:
        with open(os.path.join(state_dir, ".env")) as f:
            for zeile in f:
                if zeile.startswith("TELEGRAM_BOT_TOKEN="):
                    tok = zeile.split("=", 1)[1].strip().strip("\"'")
                    break
    except Exception:
        return
    if not tok or not chat_id:
        return
    text = ("Ich bin noch dran, seit %d Minuten ohne Zwischenmeldung. "
            "Das hier schickt der Lebenszeichen-Hook, nicht ich." % minuten)
    subprocess.Popen(
        ["curl", "-s", "-m", "10", "https://api.telegram.org/bot%s/sendMessage" % tok,
         "--data-urlencode", "chat_id=%s" % chat_id, "--data-urlencode", "text=%s" % text],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    state_dir = os.environ.get("TELEGRAM_STATE_DIR", "")
    if not state_dir:
        return

    try:
        eingabe = json.load(sys.stdin)
    except Exception:
        return
    werkzeug = eingabe.get("tool_name", "")
    jetzt = time.time()
    pfad = zustandsdatei(state_dir)
    zustand = lies(pfad)

    # Eine gesendete Nachricht stellt die Uhr zurueck.
    if werkzeug.endswith("__reply"):
        chat = str(eingabe.get("tool_input", {}).get("chat_id", "") or zustand.get("chat_id", ""))
        schreib(pfad, {"zuletzt": jetzt, "chat_id": chat, "erinnert": 0, "notruf": 0})
        return

    zuletzt = zustand.get("zuletzt", 0)
    if not zuletzt:
        return
    still = jetzt - zuletzt

    if still >= STILLE_NOTRUF and jetzt - zustand.get("notruf", 0) >= STILLE_NOTRUF:
        zustand["notruf"] = jetzt
        zustand["erinnert"] = jetzt
        schreib(pfad, zustand)
        notruf(state_dir, zustand.get("chat_id", ""), int(still // 60))
        hinweis = ("Seit %d Minuten keine Nachricht im Chat. Der Hook hat gerade selbst ein "
                   "Lebenszeichen geschickt. Melde jetzt in einer Zeile per reply, woran du bist "
                   "und wann es etwas zu sehen gibt." % (still // 60))
    elif still >= STILLE_ERINNERUNG and jetzt - zustand.get("erinnert", 0) >= STILLE_ERINNERUNG:
        zustand["erinnert"] = jetzt
        schreib(pfad, zustand)
        hinweis = ("Seit %d Sekunden nichts im Chat gemeldet. Schick jetzt eine kurze Zeile per "
                   "reply, woran du gerade arbeitest, bevor du weitermachst." % int(still))
    else:
        return

    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": hinweis,
    }}))


if __name__ == "__main__":
    main()
