# Zugaenge: drei Wege zum Server, klare Rangfolge

## Die Hierarchie: VS Code, Telegram, Handy-Notfall

**Regel:** VS Code (Remote-SSH plus Claude-Code-Extension) ist der STANDARD fuer
jede Arbeit mit Claude Code auf dem Server, immer wenn man am Rechner sitzt.
Telegram ist der Kanal fuer unterwegs und das Alltaegliche. Die SSH-App auf dem
Handy ist NUR das Notfall-Backup, kein Arbeitsweg.

**Warum:** Festgelegt am 24.08.2026 nach dem ersten Live-Setup mit einer Gruppe:
die Arbeit im nackten Browser-Terminal produzierte dort die meisten Fehler,
kaputt kopierte Links, gescheiterte Tastenkuerzel, Verwechslung von Server und
eigenem Rechner. Mit VS Code sieht man Dateien, Verlauf und Diffs; das Terminal
ist die Ausnahme, nicht der Alltag.

**Werkzeug:** `vorlagen/CLAUDE.md` (Abschnitt Arbeitsteilung); `skills/setup`
erzeugt die SSH-Verbindungs-Config in Phase 2.

**Fertig wenn:** VS Code oeffnet ein Remote-Fenster auf dem Server und
`hostname` im integrierten Terminal zeigt den Servernamen.

## VS-Code-Remote einrichten, einmal und gefuehrt

**Regel:** VS Code verbindet sich per Remote-SSH direkt auf den Server;
eingerichtet wird das einmal, gefuehrt vom Assistenten. Ablauf:

1. **Mensch:** VS Code installieren (code.visualstudio.com), darin die
   Extension "Remote - SSH" installieren.
2. **Agent:** erzeugt den Eintrag fuer die `~/.ssh/config` auf dem Rechner des
   Menschen (Host-Alias, `HostName` = Server-IP, `User root`) und sagt
   woertlich, wo er einzufuegen ist. Bei Passwort-Login fragt VS Code beim
   Verbinden danach; besser: der Agent legt einen SSH-Schluessel an und
   diktiert dem Menschen den einen Kopierbefehl.
3. **Mensch:** unten links auf das gruene Remote-Symbol, "Connect to Host",
   den Alias waehlen, Ordner `/root/assistent` oeffnen.
4. **Mensch:** im Remote-Fenster die Claude-Code-Extension installieren. Sie
   muss im REMOTE installiert sein, nicht nur lokal; das ist die bekannte
   Stolperstelle.

**Warum:** Ab hier laeuft das restliche Setup im komfortablen Interface statt im
nackten Terminal, und Browser-Logins (Google und andere) laufen einfach durch,
weil VS Code localhost-Ports automatisch auf den Server weiterleitet.

**Werkzeug:** keines noetig, reine Anleitung; der Agent fuehrt Schritt 2.

**Fertig wenn:** Im VS-Code-Fenster steht unten links `SSH: <alias>`, und die
Claude-Extension beantwortet im Chat auf dem Server eine Testfrage nach dem
`hostname` mit dem Servernamen.

## OAuth-Anschluesse laufen ueber VS Code

**Regel:** Browser-Logins fuer Tool-Anschluesse (Google, Notion und andere
OAuth-Dienste) werden aus der VS-Code-Remote-Session gemacht. Deren
localhost-Weiterleitung leitet den Rueckweg des Logins automatisch auf den
Server; der Link oeffnet sich im eigenen Browser und funktioniert einfach.

**Warum:** Am 24.08.2026 zerbrachen Anmelde-Links beim Kopieren aus dem
Browser-Terminal an Zeilenumbruechen ("ungueltiger redirect-Parameter", mehrere
Teilnehmer). Mit VS Code existiert dieser Kopierschritt nicht mehr.

**Werkzeug:** Die VS-Code-Verbindung aus dem Block oben; Schluessel-basierte
Tools brauchen keinen Browser und laufen direkt im Chat
(`wissen/tool-stack.md`).

**Fertig wenn:** Ein OAuth-Anschluss laeuft komplett durch, ohne dass eine URL
von Hand kopiert werden muss.

## Der Notzugang in zwei Schritten, auswendig

**Regel:** Der Notfallweg vom Handy ist genau zwei Schritte: SSH-App oeffnen und
verbinden, dann `claude` eintippen. Diese zwei Schritte werden beim Setup einmal
durchgespielt und als Merksatz notiert, nicht erst im Ernstfall recherchiert.

**Warum:** Als bei uns am 23.07.2026 alle Bots gleichzeitig stumm waren
(Speicher-Krise), war die SSH-App der einzige verbliebene Weg zum Server. Ein
Notzugang, den man erst einrichten muss, wenn man ihn braucht, ist keiner.

**Werkzeug:** `skills/setup` richtet den Handy-Zugang am Ende von Phase 4 ein;
`wissen/selbstheilung.md` ist das, was man im Notfall dort ausfuehrt.

**Fertig wenn:** Verbindung aus der Handy-App steht, `hostname` zeigt den
Server, `claude` startet und antwortet.
