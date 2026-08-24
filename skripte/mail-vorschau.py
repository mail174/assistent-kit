#!/usr/bin/env python3
"""
mail-vorschau.py

Rendert einen Mail-Entwurf (Kopfzeile + HTML-Body) als PNG-Vorschaubild.
Zweck: die Guardrail "Mail-Entwuerfe nie als Rohtext, immer als gerendertes
Bild zeigen" technisch erzwingen. Der Agent ruft dieses Skript vor jedem
Versand auf, das PNG geht dann an den Menschen (z.B. per Telegram).

CLI:
  mail-vorschau.py --von A --an B [--cc C] --betreff T --html body.html [--out pfad.png]

Rendert per Headless-Chrome. Chrome kennt bei --screenshot keinen
"Full-Page"-Modus, es schneidet immer exakt auf --window-size zu. Deshalb
zwei Durchlaeufe, ganz ohne Zusatz-Bibliotheken (kein Pillow, kein
CDP-Client noetig):

  1. Durchlauf (--dump-dom): ein kleines Inline-Skript in der Seite selbst
     schreibt die tatsaechliche Kartenhoehe (scrollHeight) in <title>.
     Chrome fuehrt das Skript beim Dump aus, das Ergebnis wird per Regex
     aus dem dump-dom-Output gelesen.
  2. Durchlauf (--screenshot): --window-size=900,<gemessene Hoehe>, damit
     das Bild exakt zur Karte passt, kein abgeschnittener Text, keine
     unnoetige Leerflaeche.

Bewusst KEIN --force-device-scale-factor=2: in Kombination mit
--window-size schneidet Headless-Chrome dann den Inhalt auf die Haelfte
der angegebenen Hoehe ab (Layout-Viewport wird durch den Skalierungsfaktor
geteilt, das Ausgabebild bleibt aber bei der vollen Groesse, der Rest ist
leer). Getestet und reproduziert: der Footer fiel dabei zuverlaessig weg.
Einfache 1x-Aufloesung ist robust und fuer eine Freigabe-Vorschau
ausreichend scharf.
"""

import argparse
import glob
import html
import os
import re
import shutil
import subprocess
import sys
import tempfile

BROWSER_KANDIDATEN = ["chromium", "chromium-browser", "google-chrome"]
# Fallback: von einem Node-Tool (z.B. puppeteer) selbst nachinstallierter Chrome.
PUPPETEER_GLOB = os.path.expanduser("~/.cache/puppeteer/chrome/*/chrome-linux64/chrome")

BREITE = 900
# Headless-Chrome schneidet den Screenshot ab, wenn --window-size zu knapp an
# der tatsaechlichen Inhaltshoehe liegt (beobachtet: der untere Rand, z.B. der
# Footer, fehlt einfach, obwohl die Karte laut scrollHeight hineinpassen
# muesste). Ein fester Sicherheitspuffer auf die gemessene Hoehe behebt das
# zuverlaessig (empirisch ca. 90-100px Differenz noetig, unabhaengig von der
# absoluten Groesse). MIN_HOEHE faengt zusaetzlich sehr kurze Entwuerfe ab,
# bei denen ein zu kleines Fenster denselben Effekt zeigt.
HOEHEN_PUFFER = 150
MIN_HOEHE = 600
MAX_HOEHE = 20000
STANDARD_HOEHE = 1400  # Fallback, falls die Hoehenmessung fehlschlaegt


def browser_finden():
    for name in BROWSER_KANDIDATEN:
        pfad = shutil.which(name)
        if pfad:
            return pfad
    treffer = sorted(glob.glob(PUPPETEER_GLOB))
    if treffer:
        return treffer[-1]
    sys.exit(
        "Kein Browser gefunden (versucht: " + ", ".join(BROWSER_KANDIDATEN) +
        ", sowie ein lokal nachinstallierter Chrome unter ~/.cache/puppeteer). "
        "Bitte einen Chromium/Chrome installieren."
    )


def seite_bauen(von, an, cc, betreff, body_html):
    """Baut die selbststaendige HTML-Vorschauseite. Kopfzeilen-Felder werden
    escaped, der Mail-Body wird roh eingebettet (er ist der eigene Entwurf
    des Agenten, keine fremde Eingabe)."""
    zeilen = [("Von", von), ("An", an)]
    if cc:
        zeilen.append(("Cc", cc))
    zeilen.append(("Betreff", betreff))

    kopf_zeilen_html = "\n".join(
        '<div class="zeile"><div class="label">{0}</div>'
        '<div class="wert">{1}</div></div>'.format(
            html.escape(label), html.escape(wert)
        )
        for label, wert in zeilen
    )

    return """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Mail-Vorschau</title>
<style>
  * {{ box-sizing: border-box; }}
  html, body {{
    margin: 0; padding: 0;
    background: #eceff3;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 Helvetica, Arial, sans-serif;
  }}
  body {{ padding: 32px; }}
  .karte {{
    position: relative;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    overflow: hidden;
  }}
  .badge {{
    position: absolute;
    top: 20px; right: 24px;
    background: #d13438;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 6px 14px;
    border-radius: 999px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }}
  .kopf {{
    padding: 24px 100px 20px 28px;
    border-bottom: 1px solid #e3e6eb;
  }}
  .zeile {{
    display: grid;
    grid-template-columns: 90px 1fr;
    padding: 5px 0;
    font-size: 14px;
    line-height: 1.4;
  }}
  .label {{
    color: #6b7280;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    padding-top: 2px;
  }}
  .wert {{
    color: #1a1a1a;
    word-break: break-word;
  }}
  .rumpf {{
    padding: 28px;
    font-size: 15px;
    line-height: 1.55;
    color: #1a1a1a;
  }}
  .rumpf p {{ margin: 0 0 1em 0; }}
  .fuss {{
    padding: 14px 28px;
    border-top: 1px solid #e3e6eb;
    font-size: 12px;
    font-style: italic;
    color: #9ca3af;
  }}
</style>
</head>
<body>
  <div class="karte" id="karte" style="width: {breite}px;">
    <div class="badge">ENTWURF</div>
    <div class="kopf">
{kopf_zeilen}
    </div>
    <div class="rumpf">{body}</div>
    <div class="fuss">Vorschau, noch nichts versendet</div>
  </div>
  <script>
    document.title = "H:" + document.getElementById("karte").scrollHeight;
  </script>
</body>
</html>
""".format(
        breite=BREITE - 2 * 32,
        kopf_zeilen=kopf_zeilen_html,
        body=body_html,
    )


def hoehe_messen(browser, seiten_pfad):
    """1. Durchlauf: dump-dom laesst Chrome das Inline-Skript ausfuehren,
    das die Kartenhoehe in <title> ablegt. Gibt die gemessene Hoehe in px
    zurueck, oder den Standardwert, falls das Auslesen fehlschlaegt."""
    cmd = [
        browser, "--headless=new", "--no-sandbox", "--disable-gpu",
        "--hide-scrollbars",
        "--window-size={0},600".format(BREITE),
        "--dump-dom",
        "file://" + seiten_pfad,
    ]
    try:
        ergebnis = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30
        )
    except subprocess.TimeoutExpired:
        return STANDARD_HOEHE
    treffer = re.search(r"H:(\d+)", ergebnis.stdout)
    if not treffer:
        return STANDARD_HOEHE
    hoehe = int(treffer.group(1)) + 2 * 32 + HOEHEN_PUFFER  # Karte + Aussenabstand + Puffer
    return max(MIN_HOEHE, min(MAX_HOEHE, hoehe))


def screenshot_erzeugen(browser, seiten_pfad, hoehe, ausgabe_pfad):
    """2. Durchlauf: eigentlicher Screenshot in der gemessenen Groesse."""
    cmd = [
        browser, "--headless=new", "--no-sandbox", "--disable-gpu",
        "--hide-scrollbars",
        "--window-size={0},{1}".format(BREITE, hoehe),
        "--screenshot=" + ausgabe_pfad,
        "file://" + seiten_pfad,
    ]
    ergebnis = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if ergebnis.returncode != 0 or not os.path.exists(ausgabe_pfad):
        sys.exit(
            "Rendern fehlgeschlagen: " + (ergebnis.stderr.strip() or "unbekannter Fehler")
        )


def main():
    parser = argparse.ArgumentParser(
        description="Rendert einen Mail-Entwurf als PNG-Vorschau (Guardrail: nie Rohtext)."
    )
    parser.add_argument("--von", required=True)
    parser.add_argument("--an", required=True)
    parser.add_argument("--cc", default="")
    parser.add_argument("--betreff", required=True)
    parser.add_argument("--html", required=True, help="Pfad zur HTML-Datei mit dem Mail-Body")
    parser.add_argument("--out", default=None, help="Zielpfad fuer das PNG (Default: temp unter /tmp)")
    args = parser.parse_args()

    if not os.path.isfile(args.html):
        sys.exit("HTML-Datei nicht gefunden: " + args.html)
    with open(args.html, "r", encoding="utf-8") as f:
        body_html = f.read()

    browser = browser_finden()
    seite = seite_bauen(args.von, args.an, args.cc, args.betreff, body_html)

    if args.out:
        ausgabe_pfad = os.path.abspath(args.out)
    else:
        fd, ausgabe_pfad = tempfile.mkstemp(prefix="mail-vorschau-", suffix=".png", dir="/tmp")
        os.close(fd)

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".html", prefix="mail-vorschau-", dir="/tmp",
        encoding="utf-8", delete=False
    ) as f:
        f.write(seite)
        seiten_pfad = f.name

    try:
        hoehe = hoehe_messen(browser, seiten_pfad)
        screenshot_erzeugen(browser, seiten_pfad, hoehe, ausgabe_pfad)
    finally:
        os.remove(seiten_pfad)

    print(ausgabe_pfad)


if __name__ == "__main__":
    main()
