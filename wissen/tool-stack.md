# Tool-Stack: der Katalog aus dem Produktiv-Betrieb

Stufen: **[Standard]** wird immer mit eingerichtet · **[Empfohlen]** lohnt sich
fuer die meisten · **[Vertikal]** nur fuer das jeweilige Geschaeft ·
**[Fortgeschritten]** eigenes Modul, erst wenn der Rest laeuft.

## Anschluss-Prinzip: nur Gewaehltes, und danach Neustart

**Regel:** Tools werden einzeln angeboten ("Das nutzt der Autor. Es bringt dir X.
Willst du es?") und nur Gewaehltes angeschlossen. Schluessel-basierte Tools
laufen direkt im Telegram-Chat, OAuth-basierte ueber VS Code
(`wissen/zugaenge.md`). Nach JEDEM Anschluss: Session-Neustart, neue MCP-Server
laden erst beim Start.

**Warum:** Ein frisch angeschlossenes Tool, das in der laufenden Session nicht
auftaucht, sieht aus wie ein kaputtes Setup und kostet Fehlersuche; tatsaechlich
fehlt nur der Neustart. Und jeder ungenutzte Server kostet dauerhaft
Arbeitsspeicher: bei uns drueckten ueberfluessige Server die Bots wiederholt ans
Speicherlimit (23.07.2026).

**Werkzeug:** `skills/setup` fuehrt den Katalog und den Neustart.

**Fertig wenn:** Nach dem Neustart beantwortet das neue Tool einen
Probe-Aufruf (z. B. eine Suche oder ein Listen-Abruf).

## Sehen und Pruefen [Standard]

- **Chrome-DevTools-MCP + headless Chromium.** Der Agent sieht Webseiten
  wirklich: Screenshots, Klickpfade, Konsole, Netzwerk, Lighthouse. Grundlage
  fuer `wissen/pruefen-nach-launch.md` und jeden Funnel-Bau. Kein Konto noetig.
  Fallen: Screenshots per headless-Chrome ueber die Shell haengen reproduzierbar,
  immer den MCP nehmen (bei uns 3 Fehlversuche ohne je ein Bild). Headless
  clampt die Layout-Breite auf ~500px: schmalere Fenster schneiden rechts ab,
  statt umzubrechen; echtes Mobile nur per `emulate viewport 390x844,mobile,touch`
  (Achtung: der emulate-Aufruf laedt die Seite neu). Als root startet Chrome nur
  mit `--no-sandbox`-Wrapper.

## Kommunikation

- **Gmail per MCP [Empfohlen].** Suchen, lesen, entwerfen, Labels; MEHRERE
  Konten als getrennte MCP-Instanzen (der Autor faehrt vier). OAuth via VS Code.
  Senden nur nach `wissen/mail-freigabe.md`.
- **Google Kalender [Empfohlen].** Termine lesen und anlegen. OAuth via VS Code.
  Falle: IMMER alle Kalender abfragen, nicht nur den primaeren; bei uns wurde am
  24.08.2026 einem Dritten ein "freies" Fenster vorgeschlagen, das in einem
  Zweitkalender belegt war.
- **Google Tasks [Empfohlen].** Aufgaben, die das Gespraech ueberleben. OAuth
  via VS Code. Regel: Erledigtes auf erledigt setzen, nie loeschen, sonst stirbt
  die Historie.
- **Google Drive/Sheets [Empfohlen].** Dateien und Tabellen. OAuth via VS Code.
  Falle: das Sheets-MCP schreibt nur WERTE; Formatierung (Farben, Zahlenformat,
  Spaltenbreiten) geht nur ueber die Sheets-API direkt.
- **Resend [Empfohlen].** Transaktions- und Funnel-Mails per API. Schluessel im
  Chat. Fallen: Domain-Verifizierung gilt PRO Konto, und meist ist nur die
  `send.`-Subdomain verifiziert, nicht die Apex. "Domain ist verified" nie
  glauben: vor jedem Deploy ein Test-Send mit der exakten Absender-Adresse
  (403 = falsches Konto oder falsche Domain; bei uns kostete genau das 2026
  zwei Debug-Runden).
- **WhatsApp-Bruecke [Fortgeschritten].** Lokale Bruecke, der Agent liest und
  schreibt WhatsApp. Eigenes Modul. Fallen: Antworten kommen mal als
  Event-Stream, mal als reines JSON, beides behandeln, sonst wirkt ein
  erfolgreicher Versand wie ein Fehlschlag; vor dem Senden die Zielnummer
  bestaetigen lassen (Kontaktsuche liefert bei haeufigen Vornamen mehrere
  Treffer). Senden nur mit Go je Nachricht.

## Web und Funnel bauen

- **Netlify [Empfohlen].** Hosting mit CLI und MCP, GitHub-Anbindung; der Agent
  deployt und verwaltet Seiten selbst. Schluessel im Chat. Fallen: die CLI sucht
  die Site-Verknuepfung auch in ELTERN-Ordnern, ein Deploy aus dem falschen
  Verzeichnis geht auf die falsche Site (bei uns mehrfach, einmal mit Stunden
  Ausfall einer Live-Site am 19.06.2026); deshalb IMMER `--site <id>` anhaengen
  und Build+Deploy in einer Subshell mit absolutem `cd`. `state: ready` heisst
  nicht, dass die Site funktioniert: nach jedem Prod-Deploy die Live-URL curlen
  (200 auf einer echten Route ist die einzige Erfolgs-Definition). Bei
  CLI-Deploys sagt Git NICHTS ueber den Live-Stand, erst die Deploy-Historie
  pruefen (`wissen/pruefen-nach-launch.md`).
- **Firecrawl [Empfohlen].** Scrapen, Crawlen, Websuche fuer Recherche.
  Schluessel im Chat. Fallen: der `site:`-Operator liefert 0 Treffer, Plattform
  als normales Suchwort anhaengen und Ergebnis-URLs filtern; bei Recherche ueber
  viele Orte maximal 5 bis 7 pro Subagent, sonst Idle-Timeout.
- **Apify [Empfohlen].** Scraper-Bibliothek, zahlt nach Verbrauch: Maps,
  LinkedIn, Instagram und mehr. Schluessel im Chat. Falle: gelieferte
  Medien-URLs sind signiert und laufen schnell ab, sofort herunterladen.

## Daten

- **Supabase [Empfohlen].** Postgres mit MCP, AI-native. Ausdrueckliche
  Empfehlung STATT Airtable; der Autor nutzt Airtable nur aus Vor-KI-Zeiten.
  OAuth via VS Code. Fallen (beide scheitern lautlos, gefunden 21.08.2026 im
  Review): Zeilen-Sicherheit (RLS) wirkt pro Zeile, nicht pro Spalte, wer seine
  Zeile aendern darf, darf auch seine Rolle aendern, Spaltenrechte setzen; und
  ein von RLS geblocktes UPDATE liefert KEINEN Fehler, im Client immer
  `.select()` anhaengen und ein leeres Ergebnis als Fehler werten.
- **Airtable (falls vorhanden) [Vertikal].** Schluessel im Chat. Falle: Listen
  ohne Sortierung liefern aelteste zuerst; ab 100 Datensaetzen fehlen die
  neuesten, wenn nicht alle Seiten geblaettert werden. Immer absteigend
  sortieren und bis zum Ende paginieren.

## Projekte und Notizen

- **Notion [Empfohlen].** Projekt-Stand, Status-Updates, geteilte Dokumente per
  MCP. OAuth via VS Code. Regel: Status als neue Log-Eintraege anhaengen, nie
  bestehende Seiten ueberschreiben; Inhalte anderer sind schwer wiederherstellbar.

## Meetings

- **Granola [Empfohlen].** Transkripte und Notizen per MCP. OAuth via VS Code.
  Falle: IMMER das Voll-Transkript laden, nie nur die KI-Zusammenfassung, die
  verschleift Zahlen und Zusagen (bei uns nannte eine Zusammenfassung einen um
  50 Euro falschen Preis); bei Delegation an Subagents die
  Voll-Transkript-Pflicht explizit in den Auftrag schreiben.

## Zweitmeinung

- **Codex [Empfohlen].** Zweites Modell zum Gegenpruefen bei kniffligen
  Entscheidungen und Code-Reviews. Schluessel bzw. eigenes Konto. Falle:
  `codex exec` ohne Terminal haengt ewig beim Lesen von stdin, immer
  `< /dev/null` anhaengen (bei uns hing der erste Hintergrund-Lauf komplett).

## Coding-Referenz

- **context7 [Empfohlen].** Aktuelle Library-Doku fuer den Agenten beim Bauen;
  verhindert veraltete API-Aufrufe aus dem Trainingsstand. MCP, kein Konto
  noetig.

## CRM (Kategorie: EINE Option waehlen)

- **Attio oder Close per MCP [Vertikal].** OAuth via VS Code. Oder: das eigene
  CRM auf Supabase (volle Kontrolle, keine Lizenz, siehe Daten-Kategorie samt
  RLS-Fallen).

## Outreach und Anreicherung [Vertikal]

- **Prospeo.** B2B-Kontaktdaten (Personen, Firmen, Mail-Adressen). Schluessel im
  Chat.
- **Apify-Actors** fuer Maps/LinkedIn (siehe Apify oben).

## Domains

- **DNS per API [Empfohlen]** (z. B. Namecheap). Schluessel im Chat. Fallen:
  Browser-Logins der Registrare blocken Agents per Captcha, kein Umweg suchen,
  immer die API. Die Alles-Setzen-Funktion ERSETZT den kompletten Record-Satz:
  erst alle Records lesen, Aenderung anwenden, alles zurueckschreiben, sonst
  sind Mail-Records weg. Host-Namen sind relativ, die Domain wird automatisch
  angehaengt (`send.domain.de` als Host ergibt `send.send.domain.de`; genau so
  lagen bei uns Mail-Records tot).

## Bruecke zu allem anderen

- **Zapier-MCP [Fortgeschritten].** Tausende Apps ohne eigenen Anschluss.
  OAuth via VS Code. Fuer alles, was keinen eigenen MCP hat.

## Ads [Vertikal, nur fuer Werbetreibende]

- **Meta-Ads-CLI.** Kampagnen, Spend, Insights vom Chat aus. Schluessel im
  Chat. Fallen: globale Flags (Konto-ID, Output-Format) gehoeren VOR das
  Subkommando, dahinter laufen Abfragen still leer durch; Budgets sind in Cents
  (5000 = 50 Euro); CTR heisst IMMER Link-Klick-CTR, die Gesamt-CTR zaehlt
  Likes und Profilaufrufe mit, liegt beim Doppelten und hat bei uns am
  11.08.2026 eine Bewertung komplett umgekehrt.
