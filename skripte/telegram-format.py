#!/usr/bin/env python3
"""
telegram-format.py: markdownv2-Formatierer fuer Telegram.

Telegram verlangt in markdownv2, dass JEDES Vorkommen der reservierten
Zeichen  _ * [ ] ( ) ~ ` > # + - = | { } . !  mit einem Backslash escaped
wird, auch in Zahlen ("12.345") und URLs. Ein vergessenes Zeichen laesst
den API-Call mit "Character '.' is reserved" scheitern. Hand-Escaping ist
deshalb verboten, dieses Skript macht es zuverlaessig.

Eingabe: einfacher Marker-Text (stdin oder Datei-Argument)
Ausgabe: valides markdownv2 (stdout)

Marker:
  **fett**   -> *fett* (Inhalt wird escaped)
  `mono`     -> `mono` (Inhalt bleibt literal, nur \\ und ` werden escaped)
  "> " am Zeilenanfang -> Zitatzeile: ">" bleibt unescaped als Marker,
                          gefolgt von einem Leerzeichen und dem escapten
                          Rest der Zeile (kanonische Form)
  alles andere -> alle reservierten Zeichen werden escaped

Nutzung:
  python3 telegram-format.py < text.txt
  python3 telegram-format.py text.txt
"""
import re
import sys

RESERVED = set("_*[]()~`>#+-=|{}.!")

MONO_RE = re.compile(r"`([^`]*)`")
BOLD_RE = re.compile(r"\*\*(.*?)\*\*")


def escape_plain(text):
    """Escaped alle reservierten Zeichen (inkl. Backslash) fuer normalen Text."""
    out = []
    for ch in text:
        if ch == "\\" or ch in RESERVED:
            out.append("\\")
        out.append(ch)
    return "".join(out)


def escape_mono(text):
    """Innerhalb von Mono-Spans werden nur Backslash und Backtick escaped."""
    out = []
    for ch in text:
        if ch in ("\\", "`"):
            out.append("\\")
        out.append(ch)
    return "".join(out)


def process_bold(text):
    """Ersetzt **bold** durch *bold* und escaped den Rest normal."""
    out = []
    idx = 0
    for m in BOLD_RE.finditer(text):
        out.append(escape_plain(text[idx : m.start()]))
        out.append("*" + escape_plain(m.group(1)) + "*")
        idx = m.end()
    out.append(escape_plain(text[idx:]))
    return "".join(out)


def process_inline(text):
    """Trennt Mono-Spans ab, verarbeitet den Rest ueber process_bold."""
    out = []
    idx = 0
    for m in MONO_RE.finditer(text):
        out.append(process_bold(text[idx : m.start()]))
        out.append("`" + escape_mono(m.group(1)) + "`")
        idx = m.end()
    out.append(process_bold(text[idx:]))
    return "".join(out)


def format_line(line):
    if line.startswith("> "):
        rest = line[2:]
        return "> " + process_inline(rest)
    return process_inline(line)


def format_text(text):
    lines = text.split("\n")
    return "\n".join(format_line(line) for line in lines)


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()
    sys.stdout.write(format_text(raw))


if __name__ == "__main__":
    main()
