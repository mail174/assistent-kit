"""
Tests fuer telegram-format.py (markdownv2-Formatierer).

TDD: diese Tests zuerst schreiben, rot sehen, dann telegram-format.py
implementieren bis alles gruen ist.

Ausfuehren:
  python3 -m pytest skripte/test_telegram_format.py -q
  oder falls pytest fehlt:
  python3 -m unittest discover -s skripte -q
"""
import importlib.util
import pathlib
import subprocess
import sys
import unittest

MODULE_PATH = pathlib.Path(__file__).parent / "telegram-format.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("telegram_format", MODULE_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


tf = _load_module()


class TelegramFormatTests(unittest.TestCase):
    def test_zahl_mit_punkt(self):
        self.assertEqual(tf.format_text("Zahl 10.713 Euro"), "Zahl 10\\.713 Euro")

    def test_url_reserved_zeichen(self):
        self.assertEqual(
            tf.format_text("https://example.com/pfad-x?a=1"),
            "https://example\\.com/pfad\\-x?a\\=1",
        )

    def test_bold_marker(self):
        self.assertEqual(tf.format_text("**24 Leads**"), "*24 Leads*")

    def test_mono_bleibt_literal(self):
        text = "Betrag `1.234,56 EUR` gebucht"
        self.assertEqual(tf.format_text(text), "Betrag `1.234,56 EUR` gebucht")

    def test_quote_zeile(self):
        # Kanonische Form: ">" bleibt unescaped als Marker, gefolgt von
        # einem Leerzeichen und dem escapten Rest der Zeile.
        self.assertEqual(tf.format_text("> Wochenbericht"), "> Wochenbericht")

    def test_mixed_line(self):
        text = "**3 Bewerber** kosten 1.200 EUR: https://x.de/a_b"
        expected = "*3 Bewerber* kosten 1\\.200 EUR: https://x\\.de/a\\_b"
        self.assertEqual(tf.format_text(text), expected)

    def test_backslash_wird_verdoppelt(self):
        self.assertEqual(tf.format_text("C:\\pfad"), "C:\\\\pfad")

    def test_alle_reservierten_zeichen_ausserhalb_markern(self):
        reserved = "_*[]()~`>#+-=|{}.!"
        for ch in reserved:
            raw = f"a{ch}b"
            out = tf.format_text(raw)
            self.assertEqual(out, f"a\\{ch}b", f"Zeichen {ch!r} falsch escaped: {out!r}")

    def test_mono_escaped_nur_backslash_und_backtick(self):
        # Innerhalb von Mono werden nur \ und ` escaped, sonst nichts.
        text = "Pfad `C:\\temp\\a.txt` gespeichert"
        expected = "Pfad `C:\\\\temp\\\\a.txt` gespeichert"
        self.assertEqual(tf.format_text(text), expected)

    def test_mehrzeilig_quote_und_normal_gemischt(self):
        text = "Status:\n> Wochenbericht fertig.\nNaechster Schritt: senden."
        expected = (
            "Status:\n"
            "> Wochenbericht fertig\\.\n"
            "Naechster Schritt: senden\\."
        )
        self.assertEqual(tf.format_text(text), expected)

    def test_bullet_punkt_wird_normal_escaped(self):
        text = "• Punkt eins: 1.000 EUR"
        self.assertEqual(tf.format_text(text), "• Punkt eins: 1\\.000 EUR")

    def test_cli_liest_stdin(self):
        result = subprocess.run(
            [sys.executable, str(MODULE_PATH)],
            input="Zahl 10.713 und **fett**",
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertEqual(result.stdout, "Zahl 10\\.713 und *fett*")

    def test_cli_liest_datei(self):
        import tempfile

        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / "in.txt"
            f.write_text("**24 Leads** kosten 1.200 EUR", encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(MODULE_PATH), str(f)],
                capture_output=True,
                text=True,
                check=True,
            )
            self.assertEqual(result.stdout, "*24 Leads* kosten 1\\.200 EUR")


if __name__ == "__main__":
    unittest.main()
