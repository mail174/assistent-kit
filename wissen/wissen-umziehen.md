# Wissen umziehen: was der neue Assistent ueber dich wissen muss

## Der Server-Claude weiss nichts aus der App

**Regel:** Ein frischer Claude auf dem Server kennt den Menschen NICHT, auch
beim selben Abo und Konto. Konten teilen die Anmeldung, nicht das Gedaechtnis.
Alles, was der Assistent wissen soll, muss aktiv umgezogen werden; nichts kommt
von allein mit.

**Warum:** Beim Live-Setup am 24.08.2026 erwarteten Teilnehmer, der Server-Claude
kenne sie aus ihren App-Gespraechen. Die Enttaeuschung im ersten Gespraech
("der weiss ja gar nichts") ist vermeidbar, wenn der Umzug als eigener Schritt
eingeplant ist.

**Werkzeug:** `vorlagen/steckbrief-prompt.md` (der Standard-Weg, naechster
Block).

**Fertig wenn:** Die CLAUDE.md an der eigenen Repo-Wurzel beantwortet die Frage
"wer ist der Mensch, was macht er, woran arbeitet er gerade" ohne Rueckfrage.

## Standard-Weg: der Steckbrief

**Regel:** Die Personalisierung beginnt mit dem Steckbrief-Import: der Mensch
schickt den fertigen Prompt aus dem Kit an seinen bisherigen Assistenten
(ChatGPT, Claude-App oder aehnliches), der ihn schon laenger kennt. Die Antwort
wird dem Concierge uebergeben, der daraus CLAUDE.md und Gedaechtnis vorbefuellt
und im Kennenlern-Gespraech NUR noch fragt, was fehlt.

**Warum:** Der bisherige Assistent hat das Wissen schon strukturiert im Zugriff;
zehn Minuten Steckbrief ersetzen ein einstuendiges Interview und vergessen dabei
weniger. Der Prompt verbietet Erfinden und laesst Unbekanntes leer, damit keine
plausiblen Falschangaben ins Gedaechtnis wandern.

**Werkzeug:** `vorlagen/steckbrief-prompt.md` (Wortlaut zum Kopieren, mit fester
Markdown-Vorlage).

**Fertig wenn:** `grep -c '<' /root/assistent/CLAUDE.md` gibt `0` aus (keine
Platzhalter mehr), und die Abschnitte Person/Projekte/Arbeitsweise sind
gefuellt.

## Tiefen-Modul: der volle Chat-Export

**Regel:** Der komplette Verlaufs-Export ist ein spaeteres Modul, nicht Teil des
Setups. Ablauf: Export anfordern (ChatGPT: Einstellungen, Datenkontrollen,
Daten exportieren · Claude: Einstellungen, Privatsphaere, Daten exportieren;
Link kommt per Mail), Archiv nach `import/` entpacken, dann einen ENGEN
Destillier-Auftrag geben: nur was dauerhaft gilt (Arbeitsweise, datierte
Entscheidungen, feste Zahlen und Kennungen, Geschaefts-Erklaerungen), Status und
Tagesgeschaeft ignorieren, offene Fragen als Liste, nichts erfinden. Danach die
Liste offener Fragen durchgehen und die entstandenen Dateien einmal lesen.

**Warum:** In Exporten steht viel Halbgares: verworfene Ideen, veraltete Preise,
lautes Nachdenken. Was ungeprueft ins Gedaechtnis wandert, behandelt der
Assistent spaeter als Tatsache. Der Pruefschritt ist der Teil, den man nicht
ueberspringen darf.

**Werkzeug:** `vorlagen/steckbrief-prompt.md` deckt den Standardfall ab; der
Destillier-Auftrag steht oben im Wortlaut-Geruest.

**Fertig wenn:** `ls /root/assistent/import/` zeigt die entpackten Exporte, und
nach dem Destillieren existieren neue `context/`- und Gedaechtnis-Dateien plus
eine Liste offener Fragen.

## Rohdaten danach loeschen

**Regel:** Der `import/`-Ordner hat seinen Zweck erfuellt, sobald die
destillierten Dateien stehen. Er wird geloescht und dauerhaft aus dem Repo
ausgeschlossen: vollstaendige Gespraechsverlaeufe gehoeren nicht auf einen
Server und NIE in ein Repo.

**Warum:** Exporte enthalten alles, auch Privates, Verworfenes und Daten
Dritter. Ein spaeterer Push oder ein kompromittierter Server wuerde den
kompletten Gespraechsverlauf offenlegen; das destillierte Wissen ist laengst im
Repo.

**Werkzeug:** `.gitignore` im eigenen Repo (`import/` eintragen); Loeschung nach
ausdruecklichem Ja des Menschen (Guardrail 3 in `vorlagen/CLAUDE.md`).

**Fertig wenn:**
```
test -d /root/assistent/import && echo NOCH-DA || echo GELOESCHT
grep -c 'import/' /root/assistent/.gitignore
```
Ausgabe: `GELOESCHT` und mindestens `1`.
