# Pruefen nach Launch: deployt heisst nicht funktioniert

## Nach jedem Launch selbst durchklicken

**Regel:** Nach jedem Deploy wird die Live-Seite selbst geprueft: Live-URL laden,
den echten Klickpfad durchspielen (nicht Komponenten isoliert ansehen),
Screenshots ansehen, Konsole auf Fehler pruefen. `state: ready` der Deploy-CLI
ist KEIN Beweis; die einzige Erfolgs-Definition ist HTTP 200 auf der Startseite
UND einer echten Route plus das erwartete Merkmal im Quelltext.

**Warum:** Am 19.06.2026 war bei uns ein Deploy aus dem falschen Verzeichnis laut
CLI erfolgreich "ready", die Live-Site gab aber auf ALLEN Routen 404 und war
mehrere Stunden offline, bis der Mensch es selbst bemerkte. Und ein
weiss-auf-weiss-Lesbarkeitsbug wurde erst gefunden, nachdem der Mensch ihn
zweimal per Screenshot nachreichen musste; der Live-Klickpfad haette ihn sofort
gezeigt.

**Werkzeug:** Chrome-DevTools-MCP (Standard-Tool, `wissen/tool-stack.md`);
mobile Ansicht per `emulate viewport 390x844,mobile,touch`, nie nur per
Fenstergroesse (headless clampt auf ~500px).

**Fertig wenn:**
```
curl -s -o /dev/null -w '%{http_code}\n' <live-url>/
curl -s <live-url>/<echte-route> | grep -c '<erwartetes-merkmal>'
```
Ausgabe: `200` und mindestens `1`; dazu liegen angesehene Screenshots des
Klickpfads vor.

## Grosse Launches: mehrere Subagents parallel

**Regel:** Bei groesseren Launches (Funnel mit mehreren Schritten, mehrere
Seiten) pruefen mehrere Subagents parallel: je einer pro Pfad und Geraeteklasse
(mobil und Desktop getrennt), jeder klickt seinen Weg komplett durch und liefert
Screenshots plus Konsolen-Befund.

**Warum:** Ein einzelner Durchlauf prueft den Happy Path auf einem Geraet.
Mehrstufige Seiten zeigen ihre Fehler in Zwischenzustaenden (Auswahl-Schritte,
Formular-Validierung, Danke-Seite), die man seriell aus Zeitdruck ueberspringt;
genau dort sassen bei uns die Fehler, die der Mensch fand.

**Werkzeug:** Chrome-DevTools-MCP je Subagent; getrennte Sitzungen fuer
getrennte Cookie-Zustaende.

**Fertig wenn:** Je Pfad und Geraeteklasse liegt ein Screenshot-Satz vor, alle
wurden angesehen, Konsole ohne Fehler.

## Bilder ansehen statt Dateinamen glauben

**Regel:** Vor jedem Verschieben, Umbenennen oder Einbau eines generierten
Bildes wird das Bild GEOEFFNET und der Inhalt visuell geprueft. Zuordnung nach
Zeitstempel oder Dateigroesse ist verboten.

**Warum:** Im Mai 2026 landeten bei uns zwei generierte Visuals unter dem jeweils
falschen Namen im Deploy, weil die Download-Reihenfolge nicht der
Erzeugungs-Reihenfolge entsprach. Der Fehler fiel erst nach dem Deploy auf und
kostete eine komplette Aufraeum-Runde; das Ansehen kostet fuenf Sekunden pro
Bild.

**Werkzeug:** Bild mit dem Read-Werkzeug oeffnen (zeigt den Inhalt), erst dann
`mv`/`cp`.

**Fertig wenn:** Jedes Bild wurde einmal geoeffnet und der Inhalt passt zum
Dateinamen und zur Einbaustelle.

## Day-1-Check vor jeder Uebergabe

**Regel:** Vor der Uebergabe eines neuen Tools oder Features einmal durch die
Brille "Was sieht welcher Nutzer am Tag 1?": (1) Bestand backfillen, existierende
Objekte muessen ab Tag 1 drin sein, nicht nur Neuzugaenge; (2) verknuepfte
Kernzahlen inline sichtbar, nicht nur der Link; (3) Lesesichtbarkeit pro Rolle
pruefen, interne Summen und Margen default nur fuer Admins; (4) Felder aus alten
Vorgaben vor UI-Uebernahme bestaetigen lassen; (5) jedes im Auftrag genannte
Tool in Minute 1 auf Zugang pruefen, nicht erst beim Bedarf.

**Warum:** Bei uns war im Juli 2026 ein System technisch fertig und reviewt, der
Mensch musste trotzdem vier Produkt-Luecken selbst finden, alle Varianten
desselben blinden Flecks: Tests pruefen Korrektheit, nicht Vollstaendigkeit aus
Nutzersicht. Ein genanntes Zweitmodell war zudem seit Stunden ohne gueltigen
Zugang, was erst beim Review auffiel.

**Werkzeug:** Diese fuenf Punkte als Checkliste; pro Rolle einloggen oder den
Blick durchspielen.

**Fertig wenn:** Alle fuenf Punkte sind je Rolle abgehakt, bevor die Uebergabe
gemeldet wird.

## Netlify-Drift: Git sagt nichts ueber Live

**Regel:** Bei CLI-deployten Sites (Deploys ohne Commit-Referenz) sind Git und
Live-Stand vollstaendig entkoppelt. Vor jeder Aussage "ist live" / "ist nicht
live": Deploy-Historie pruefen und am Live-Objekt gegenpruefen (Live-URL abrufen
und auf das konkrete Merkmal greppen), nie aus Commits schliessen.

**Warum:** Am 12.08.2026 meldeten wir "jetzt live" fuer eine Aenderung, die seit
Stunden live war: der CLI-Deploy lief Sekunden nach dem Commit, der spaetere
Push zog nur GitHub nach und aenderte am Live-Stand nichts. Der Mensch musste
widersprechen.

**Werkzeug:** `netlify api listSiteDeploys --data '{"site_id":"...","per_page":5}'`
(Chrome-DevTools-MCP oder curl fuer die Gegenprobe).

**Fertig wenn:** Die Aussage ueber den Live-Stand stuetzt sich auf
Deploy-Zeitstempel PLUS einen Treffer/Nicht-Treffer des Merkmals auf der
Live-URL.

## Stakeholder-Reviews als gehostete Seite, nicht als Mail-Schleife

**Regel:** Freigaben von mehreren Beteiligten laufen ueber eine gehostete
Review-Seite: alle Elemente auf einer Seite, je Element ein Feedback-Feld, ein
Formular; Einsendungen werden per CLI gepollt statt Postfaecher zu waelzen.

**Warum:** Mail-Schleifen erzeugen Versions-Drift und verlieren Feedback. Bei
uns ersetzte im Mai 2026 eine Review-Seite den Mail-Zirkus komplett: die
Freigabe stand Minuten spaeter im API-Output. Falle: der Hoster ignoriert
HTML-Formulare auf neuen Sites per Default, die Formular-Verarbeitung muss
einmal aktiviert werden.

**Werkzeug:** Netlify-Forms (`wissen/tool-stack.md`); Einsendungen via
`netlify api listSiteSubmissions`.

**Fertig wenn:** Eine Test-Einsendung erscheint im
`listSiteSubmissions`-Output.
