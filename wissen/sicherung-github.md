# Sicherung: das Repo ist das Gedaechtnis

## Privates Remote, bevor Personalisierung entsteht

**Regel:** Das Arbeitsverzeichnis des Assistenten ist zugleich sein Gedaechtnis:
Regeln, Kontext, Skripte, Gelerntes. Es bekommt ein PRIVATES GitHub-Repo als
Remote, und zwar bevor die Personalisierung beginnt. Was nur auf einer Maschine
liegt, existiert nicht.

**Warum:** Bei uns lief ein vergessener Zweitstand monatelang parallel und war
beim Wiederfinden Hunderte Commits und das komplette Gedaechtnis hinterher
(aufgeraeumt 13.07.2026). Ein Server kann jederzeit sterben oder gekuendigt
werden; das frisch Personalisierte darf nie verloren gehen.

**Werkzeug:** `skills/setup` richtet Repo und Remote in Phase 3 ein
(Device-Flow, kein Passwort-Gefummel).

**Fertig wenn:**
```
git -C /root/assistent remote -v
gh repo view --json visibility -q .visibility
```
Ausgabe: origin zeigt auf das eigene Repo, Sichtbarkeit `PRIVATE`.

## gitleaks vor dem ersten Push

**Regel:** Vor dem ersten Push laeuft gitleaks ueber das komplette Repo, danach
dauerhaft als pre-push-Hook. Beim Import alter Ordner zusaetzlich: eingebettete
`.git`-Ordner loeschen (werden sonst als leerer Verweis committet, Inhalt landet
nie auf GitHub) und Klartext-Schluessel ersetzen, ohne die Werte je auszugeben.

**Warum:** Alte Projektordner enthalten fast immer Schluessel im Klartext. Bei
uns scheiterte ein Archiv-Import im Juli 2026 zweimal am Push: sechs
Token-Funde plus eingebettete Repos. Ein einmal gepushter Schluessel gilt als
verbrannt, auch im privaten Repo.

**Werkzeug:** `skills/setup` installiert gitleaks und den Hook;
`vorlagen/env-muster` haelt Schluessel von vornherein ausserhalb des Repos.

**Fertig wenn:** `gitleaks detect --no-banner` im Repo endet mit
`no leaks found`.

## Taeglicher Auto-Push statt Vorsatz

**Regel:** Committen und Pushen laeuft als taeglicher Timer, nicht als Vorsatz am
Sitzungsende. Sessions enden abrupt (Absturz, Neustart, Speicher); die Sicherung
darf davon nicht abhaengen.

**Warum:** Bei uns entstand der monatelang veraltete Parallel-Stand (siehe oben)
genau dadurch, dass Pushes Handarbeit waren. Seit die Sicherung als Timer
laeuft, ist der schlimmste anzunehmende Verlust ein Tag.

**Werkzeug:** `vorlagen/nacht-neustart.timer` plus `.service` als Muster fuer das
eigene Timer-Paar (ExecStart auf ein Skript mit `git add <pfade> && git commit
&& git push` zeigen lassen); `skills/setup` legt es an.

**Fertig wenn:** `systemctl list-timers --all | grep sicherung` zeigt einen
NEXT-Zeitpunkt, und `git log origin/main -1 --format=%cr` ist juenger als zwei
Tage.

## git add immer mit Pfad

**Regel:** Nie `git add -A` oder `git add .` ohne Pfadangabe. `-A` greift seit
Git 2.0 auf den GESAMTEN Arbeitsbaum, auch aus einem Unterordner heraus. Im
Arbeitsverzeichnis eines Assistenten liegt praktisch immer Halbfertiges aus
anderen Aufgaben. Vor dem Push einmal gegenpruefen, wie viele Dateien der Commit
wirklich enthaelt.

**Warum:** Am 21.08.2026 zog ein Commit bei uns 68 fremde Dateien mit, darunter
offene Notizen, PDFs und ein eingebettetes fremdes Repo. Reparatur vor dem Push:
`git reset --soft HEAD~1 && git reset`, dann gezielt neu stagen; nach dem Push
hilft nur noch Historien-Umschreiben.

**Werkzeug:** `vorlagen/CLAUDE.md` (Arbeitsweise: "git add immer mit Pfad").

**Fertig wenn:** `git show --name-only --format="" HEAD | wc -l` entspricht der
Zahl der Dateien, die der Commit haben sollte.
