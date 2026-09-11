---
name: analytics
description: "Use when ein Funnel auswertbar werden soll oder die Auswertung Fragen aufwirft: 'Funnel im Dashboard anzeigen', 'Store ans Backend', 'Versionen und Archiv', 'Demo-Daten', 'Quellenauswertung', 'warum zeigt das Dashboard keine Daten'. Verbindet den Event-Store eines Funnel-Repos mit einer Auswertungsseite hinter /admin/tracking und erklaert Versionen, Manifest, Danke-Seite, Quellen und Demo-Regel."
---

# funnel-tracking:analytics

Die Events liegen im Store des Funnel-Repos (Tabelle `funnel_events`). Dieser
Skill baut kein Dashboard in jedes Funnel-Repo, sondern haengt den Store an
**eine** zentrale Auswertungsseite.

## Voraussetzung: eine Backend-Seite hinter /admin/tracking

Dieser Skill setzt voraus, dass es eine passwortgeschuetzte Seite gibt, die
die Stores aller Funnels liest. Gibt es sie noch nicht, ist sie der erste
Schritt: eine Route `/admin/tracking/<projekt>/<funnel>` hinter dem Login,
egal in welchem Stack.

Sie muss nichts weiter koennen als das hier:

| Teil | Aufgabe |
|---|---|
| Konfiguration je Projekt | Name, Liste der Funnels mit Label, optional Demo-Funnels |
| Verbindung je Projekt | Runtime-String des Stores als eigene Env-Variable, **read-only**, nie der Owner-String, nie im Code |
| Abfrage | aggregiert `funnel_events` fuer ein Zeitfenster, eine Abfrage je Karte |
| Route | eine Seite je Funnel, Zeitfenster und Quellen-Filter als Query-Parameter |

Mehr braucht es nicht. Ein neues Funnel-Repo bekommt **kein** eigenes
Dashboard, nur einen Eintrag in dieser Konfiguration.

## Neues Repo anbinden

1. Store: Tabelle `funnel_events` in der Datenbank der Funnel-Site
   (Migration aus dem ersten Rollout uebernehmen, dazu die Grant-Migration
   fuer die Runtime-Rolle).
2. Env auf der Backend-Site: Runtime-String der Funnel-Datenbank als
   `FUNNEL_DB_URL_<PROJEKT>`, Scope nur Functions/Server. Rolle read-only,
   dazu INSERT nur fuer die Changelog-Rows. Werte nie ausgeben.
3. Konfiguration der Abfrage: ein Objekt je Projekt mit den Spaltennamen,
   der Herkunft der UTM-Werte (eigene Spalten oder aus `metadata`) und den
   Event-Typen (entry, step, answer, lead, dq, thankyou).
4. Konfiguration der Anzeige: Projekt mit Funnel-Labels, damit jeder
   konfigurierte Funnel immer erscheint, auch mit Nullen. Ein Funnel, der
   erst bei den ersten Events auftaucht, sieht aus wie ein Fehler.
5. Navigation um das Projekt ergaenzen.
6. Tests, lokal ansehen, dann Deploy der Backend-Site aus deren Ordner.

## Was die Seite je Funnel zeigt

- KPIs: Sessions, Einstiege, Leads, Danke-Seite, disqualifiziert, CR, Dauer
  als Median und Mittelwert.
- Drop-off je Schritt nach dem Modell "erreicht", nicht "gesehen".
- CR-Verlauf mit Markern aus dem Changelog.
- Antwortverteilung je Frage.
- Aenderungen: die Changelog-Rows im Zeitfenster als Liste.
- Vorher/Nachher je Deploy.
- **Versionen:** jeder Changelog-Deploy schneidet eine Version. Auswahl
  "Aktuell, alle Daten im Zeitraum", "seit letztem Deploy", Archiv je
  Version, "vor dem ersten Deploy". Versionen mit gleichem Katalog-Hash
  tragen den Hinweis "Fragen unveraendert".
- **Fragen folgen dem Stand:** Reihenfolge und Fragetexte kommen aus dem
  `funnel_manifest` der Version (`funnel-tracking:changelog` stempelt es),
  Antwort-Werte werden auf Labels abgebildet, neue Fragen erscheinen sofort,
  beobachtete Schritte ohne Katalog-Eintrag stehen markiert am Ende. Die
  Danke-Seite ist immer der letzte Schritt (`__thankyou__`).
- **Quellen:** Filter ueber die ganze Seite
  (`?dim=source|medium|campaign|content&src=&touch=first|last`), Karte
  "Quellen" mit Chart und Tabelle (Sessions, Leads, CR, Danke-Seite, "kommt
  im Schnitt bis Frage n"), Multi-Touch-Modelle First, Last und linear auf
  Lead-Ebene.
- **Demo-Daten** nur fuer ausdruecklich als Demo markierte Funnels, nur
  solange der Funnel ueber die gesamte Zeit keine echten Events hat, nie im
  Vergleichsfenster, nie im Store, immer mit Banner und Kennzeichnung.
  Sobald echte Sessions kommen, verschwinden sie von selbst.

## Fallen

- Changelog- und Manifest-Rows (`session_id = "__changelog__"`) vor jeder
  Aggregation abtrennen, sonst entstehen Phantom-Schritte und falsche
  Session-Zahlen.
- Timestamps je Quelle unterschiedlich: manche Treiber liefern ein
  Datums-Objekt, REST-Schnittstellen einen String mit `+00:00`. Alles ueber
  eine Normalisierung schicken, bevor sortiert wird.
- Listen-Schnittstellen kappen stillschweigend (Airtable bei 100 Rows,
  PostgREST bei 1000): immer paginieren, gekappte Fenster kennzeichnen.
- Der Event-Sink verwirft Aufrufe aus dem eigenen Land des Betreibers
  (Header `x-country`), damit eigene Tests die Zahlen nicht faelschen. Ein
  Test von dort erzeugt deshalb keine Events.

## Grenzen

Deploy der Backend-Site nur aus deren Ordner und nur nach Pruefung, auf
welche Site die CLI gerade zeigt. Keine Demo-Daten ohne sichtbare
Kennzeichnung: eine Zahl, die wie echt aussieht und es nicht ist, ist
schlimmer als gar keine Zahl. Keine Secrets ausgeben.
