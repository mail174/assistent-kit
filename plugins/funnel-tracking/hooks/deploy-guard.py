#!/usr/bin/env python3
# CHANGELOG-PFLICHT: Claude-Code-Hook (PreToolUse, Bash). Blockt `netlify deploy` mit Prod-Flag,
# wenn cwd oder ein `cd <pfad>` im Kommando in einem Repo mit funnel-changelog-Marker liegt.
# Exit 2 = blocken, stderr geht als Hinweis an den Agenten. Jeder eigene Fehler = Exit 0,
# der Hook darf nie aus Versehen blocken. Vorlage aus dem Skill funnel-tracking.
import json
import os
import re
import sys

MARKER = "<!-- funnel-changelog"
# Nur an Befehlsposition: Zeilenanfang oder nach ; & | ( ` { und optionalen Env-Zuweisungen.
# Prosa wie "Rohes netlify deploy --prod" in einer Commit-Message soll nicht ausloesen.
DEPLOY = re.compile(
    r"(?:^|[;&|(`{]|\n)\s*(?:env\s+)?(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*"
    r"(?:npx\s+netlify(?:-cli)?|netlify|ntl)\s+deploy\b"
)
PROD = re.compile(r"(?:^|\s)(?:-p|--prod|--prod-if-unlocked)(?:\s|=|$|[);&|])")
CD = re.compile(r"(?:^|[\s;&|(])cd\s+(\"[^\"]+\"|'[^']+'|[^\s;&|)]+)")


def marked(directory):
    d = os.path.normpath(directory)
    for _ in range(5):
        path = os.path.join(d, "CHANGELOG.md")
        try:
            with open(path, encoding="utf-8") as fh:
                if MARKER in fh.read(4000):
                    return path
        except OSError:
            pass
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    return None


def main():
    try:
        data = json.load(sys.stdin)
        if data.get("tool_name") not in (None, "Bash"):
            return 0
        cmd = (data.get("tool_input") or {}).get("command") or ""
        if not DEPLOY.search(cmd) or not PROD.search(cmd):
            return 0
        cwd = data.get("cwd") or os.getcwd()
        dirs = [cwd]
        for m in CD.finditer(cmd):
            p = os.path.expanduser(m.group(1).strip("\"'"))
            dirs.append(p if os.path.isabs(p) else os.path.join(cwd, p))
        for d in dirs:
            hit = marked(d)
            if hit:
                sys.stderr.write(
                    "CHANGELOG-PFLICHT: %s gehoert zu einem Funnel-Repo. Prod-Deploy nur ueber "
                    "`npm run deploy` aus dem Repo-Ordner, nie ueber `netlify deploy --prod`. "
                    "Erst Eintrag oben in CHANGELOG.md, dann `npm run deploy`. Regeln: AGENTS.md im Repo.\n" % hit
                )
                return 2
        return 0
    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
