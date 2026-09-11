---
name: rollout
description: "Use when ein neuer oder bestehender Funnel komplett aufs Tracking gehoben werden soll: '/funnel-tracking', 'neuer Funnel, richte das Tracking ein', 'Funnel durchgehen', 'Tracking einbauen', 'was ist da schon drin'. Einstieg des Plugins funnel-tracking: Inventur, Bericht mit Status quo und Vorschlag, Rueckfragen, dann die Skills changelog, tracking, meta-pixel und analytics in dieser Reihenfolge."
---

# funnel-tracking:rollout

Ein Funnel, der deployt wird, ohne dass man spaeter sagen kann, was sich wann
geaendert hat, produziert Zahlen, die niemand deuten kann. Die Conversion
faellt um einen Punkt, und keiner weiss, ob das an der neuen Headline lag, an
der neuen Frage oder am Wetter.

Dieses Plugin sorgt fuer vier Dinge:

1. Jedes Funnel-Repo fuehrt ein Changelog, das kein Agent umgehen kann.
2. Die Events landen cookie-frei und mit Herkunft im Store.
3. Meta Pixel und Conversions API feuern sauber und ohne Doppelzaehlung.
4. Alles ist auf einer Seite auswertbar, mit Vorher/Nachher je Aenderung.

Es ist auf Netlify-Repos zugeschnitten (Deploy ueber die CLI, Datenbank der
Site als Store). Andere Hoster brauchen einen anderen Deploy-Wrapper, der
Rest traegt.

## Reihenfolge

1. **Inventur** (unten), nichts schreiben.
2. **Status quo und Vorschlag** vorlegen, dann warten.
3. **Nachfragen**, was danach noch offen ist.
4. `funnel-tracking:changelog`: Changelog-Pflicht, Deploy-Wrapper, Sperren,
   Manifest. Ohne diesen Schritt kein Deploy.
5. `funnel-tracking:tracking`: First-Party-Events, Touch-Historie, UTM,
   Danke-Seite, Felder im Lead-Ziel.
6. `funnel-tracking:meta-pixel`: Pixel und CAPI mit Consent-Schalter,
   Prueflauf, Live-Check.
7. `funnel-tracking:analytics`: Store an die Auswertungsseite, Funnel-Labels,
   Demo-Regel, Quellen.
8. **Abnahme und Deploy** nach ausdruecklichem Go des Menschen, dann
   Nacharbeit.

Jeder Skill ist auch allein aufrufbar, wenn nur ein Teil fehlt.

## 1. Inventur, bevor irgendetwas geschrieben wird

Im Repo-Ordner, nie aus einem uebergeordneten Arbeitsverzeichnis:

- Stack und Build (`package.json`, `netlify.toml`, Publish-Verzeichnis).
- Deploy-Weg: CLI oder git-connected. `netlify api getSite` zeigt bei
  CLI-Repos `build_settings.repo_url = null`. Abgedeckt ist der CLI-Weg.
- Site: `netlify status` lesen, `Current project` muss das Repo sein. Ohne
  eigene `.netlify/state.json` erbt der Repo-Ordner die des uebergeordneten
  Verzeichnisses und deployt in die falsche Site. Site-ID, Name und Prod-URL
  notieren.
- Store: wohin schreibt der Event-Sink (`q.ts` oder Aequivalent), welche
  Tabelle, welche Spalten. Hausstandard ist die Datenbank der Site selbst
  (`netlify db status`, Migrations unter `netlify/database/migrations/`,
  Runtime ueber `NETLIFY_DB_URL` plus Grant-Migration). Ein externer Anbieter
  ist eine zusaetzliche Abhaengigkeit, die still verschwinden kann: genau das
  ist einmal passiert, mitten im Betrieb.
- Funnels: welche `funnel_name`-Werte existieren (Tracking-Libs lesen),
  welche Routen, ob Landingpages unter `/lp/` liegen (ohne globalen Header
  und Footer, Impressum und Datenschutz trotzdem im Footer).
- Meta: wo der Pixel laedt, ob `META_PIXEL_ID` und `META_CAPI_TOKEN` gesetzt
  sind (nur Namen pruefen, nie Werte ausgeben).
- Dashboards: welche Seiten aggregieren die Events. Jede davon muss
  Changelog- und Manifest-Rows ausfiltern.

## 2. Status quo und Vorschlag

Die Inventur wird nicht still verarbeitet, sondern vorgelegt. Ein Bericht,
zwei Teile, danach wird gewartet. Wer sofort baut, baut an dem vorbei, was
schon da ist, und begruendet nichts.

**Teil 1, Status quo.** Je Bereich eine Zeile: was gefunden wurde, und ob es
den Standard erfuellt.

| Bereich | Gefunden | Bewertung |
|---|---|---|
| Changelog und Deploy-Weg | `CHANGELOG.md` vorhanden? Marker? Wie wird deployt? | fehlt / teilweise / erfuellt |
| Store | Tabelle, Spalten, Anbieter | |
| First-Party-Events | welche Events feuern heute, mit welchen Feldern | |
| Herkunft | nur `utm_source`, volle Touch-Historie, oder nichts | |
| Meta Pixel und CAPI | wo geladen, feuert es im Bundle, gibt es CAPI, gibt es `event_id` | |
| Consent | welcher Banner, wie liest der Code ihn | |
| Auswertung | welche Seite aggregiert heute, filtert sie Changelog-Rows | |

**Teil 2, Vorschlag.** Je Luecke eine Zeile: was geaendert wird, warum
(die Begruendung kommt aus dem Standard, nicht aus Geschmack), und was es
kostet. Reihenfolge nach Wirkung, nicht nach Aufwand. Dazu ausdruecklich:

- **Was bewusst bleibt.** Gewachsene Loesungen, die ihren Zweck erfuellen,
  werden nicht ersetzt, nur weil die Vorlage anders aussieht. Das gehoert in
  den Bericht, sonst wirkt es wie ein Versehen.
- **Risiken.** Jede Aenderung an einem laufenden Funnel kann Zahlen brechen.
  Was die Historie unvergleichbar macht (umbenannte Events, geaenderte
  `step_label`), wird vorher genannt, nicht nachher erklaert.
- **Offene Punkte**, die nur der Mensch entscheiden kann, als Liste am Ende.

Erst nach Freigabe wird geschrieben. Teilfreigabe ist moeglich: dann nur die
freigegebenen Punkte, der Rest bleibt im Bericht stehen.

## 3. Nachfragen

Was der Bericht offen laesst, eine Entscheidung je Nachricht:

- Funnel-Namen bestaetigen.
- Store bestaetigen.
- Liegt der PATH-Shim auf dieser Maschine schon (`type -P netlify` zeigt auf
  `~/.local/bin/netlify`)?
- Optimierungsziel fuer Meta: Lead beim Absenden, oder spaeter ein
  Qualitaets-Event aus dem CRM.
- Consent-Schalter.
- Soll nach dem Rollout sofort deployt werden?

Ein Prod-Deploy braucht immer ein ausdrueckliches Go.

## 8. Abnahme, Deploy, Nacharbeit

- Alle Abnahmen der Einzel-Skills sind durch (Tests, Hook, Shim,
  `npm run deploy:check`, Bundle enthaelt `fbq`, lokaler Prueflauf).
- Erst nach dem Go: CHANGELOG-Eintrag, `npm run deploy`. Danach pruefen:
  neuer veroeffentlichter Deploy, Stempel-Commit, Rows im Store, Funnel in
  der Auswertungsseite, Pixel-Live-Check.
- Vorsicht bei CLI-Deploys ohne Git-Anbindung: veroeffentlicht wird der
  Arbeitsbaum, nicht zwingend der letzte Commit. Vor dem Deploy pruefen,
  welche uncommitteten Dateien live sind, und sie mitnehmen. Ein sauberer
  Deploy vom letzten Commit hat schon einmal eine Seite entfernt, die nur
  im Arbeitsbaum lag.
- Ist das Repo ein Submodul: erst das Submodul pushen, dann das Hauptrepo.
  Sonst zeigt der Pointer auf einen Commit, den nur diese Maschine kennt.

## Feste Grenzen

- Kein Prod-Deploy ohne ausdrueckliches Go.
- Keine Secrets ausgeben. `deploy.mjs` liest sie ueber `netlify env:get` und
  haelt sie nur in Variablen.
- Bestehende Tracking-Libs fremder Repos nicht nebenbei umbauen.
- Vorlagen im Plugin (`templates/` im Plugin-Root) sind die Quelle. Wer eine
  Kopie im Repo verbessert, aendert die Vorlage und zieht die Kopien nach.
- Keine Gedankenstriche im Em-Dash-Stil in Texten, Kommentaren und
  Commit-Messages.
