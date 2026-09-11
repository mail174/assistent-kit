---
name: tracking
description: "Use when ein Funnel First-Party-Tracking braucht oder die Herkunft fehlt: 'Tracking einbauen', 'UTM passing', 'Multi-Touch', 'Abbruch je Frage', 'Zeitmessung', 'Danke-Seite tracken', 'welche Quelle bringt Leads'. Legt die Tracking-Lib mit Touch-Historie (first, last, touches), fbp/fbc und event_id an, verdrahtet Events je Screen und die Attribution im Lead-Payload bis ins Lead-Ziel."
---

# funnel-tracking:tracking

First-Party-Events gehen per `sendBeacon` an den Sink
`/.netlify/functions/q` (Datenbank der Site, Tabelle `funnel_events`:
`funnel_name`, `session_id`, `event_type`, `step_number`, `step_label`,
`metadata`, `ip_hash`, `created_at`). Keine Cookies fuer die Auswertung,
Session-ID in `sessionStorage`.

Vorlagen: `templates/track.ts` und `templates/track.test.ts` im Plugin-Root
(Platzhalter `{{FUNNEL}}`, `{{PREFIX}}`).

## Events je Funnel (Standard)

| Moment | `event_type` | Felder |
|---|---|---|
| erster Screen sichtbar | `entry_view` | `step_label`, `step_number 1`, `metadata.event_id` (Meta-Dedup) |
| Frage sichtbar | `step_view` | `step_label` = Step-ID aus `steps.ts`, `step_number` |
| Antwort | `step_answer` | `metadata.answer` = Option-Wert |
| unter den Fold gescrollt | `scroll_below_fold` | |
| disqualifiziert | `dq` | `metadata.reason` |
| Zwischenscreens | `pressure_release_view`, `result_view` | |
| erster Kontakt-Screen | `contact_view` | `metadata.event_id` (Meta-Dedup) |
| Kontaktfelder | `name_submitted`, `email_submitted`, `phone_view` | einzeln, damit sichtbar wird, an welchem Feld abgebrochen wird |
| Lead gespeichert | `lead_submit` | `metadata.recordId`, `touches` |
| Danke-Seite | `thankyou_view` | Pflicht: sonst weiss niemand, wie viele dort ankommen |

Debounce 600 ms je Event und Schritt (React feuert Effekte doppelt). Jedes
Event traegt ausserdem `path`, `utm_*` des ersten Touches, `first_touch`,
`last_touch`, `touch_count`, `fbp`, `fbc`.

## Herkunft, UTM und Multi-Touch

Die Tracking-Lib fuehrt die Herkunft als **Touch-Historie**: jeder Aufruf mit
UTM-Parametern, `fbclid` oder externem Referrer ist ein Touch; ohne UTMs wird
die Quelle aus dem Referrer abgeleitet (meta, google, linkedin, Host), ohne
Referrer heisst sie `direkt`. `first` wird nie ueberschrieben, `last` ist der
juengste Touch, `touches` die Liste (maximal zehn, Dubletten binnen 30
Minuten werden geschluckt). `lead_submit` und der Lead-Payload tragen
zusaetzlich `touches`. Ueber Sitzungen hinweg nur mit Werbe-Consent (Schalter
in `consent.ts`, siehe `funnel-tracking:meta-pixel`) als First-Party-Cookie,
90 Tage; Safari kappt per JavaScript gesetzte Cookies nach sieben Tagen.

Rollout: `{{FUNNEL}}` und `{{PREFIX}}` in der Vorlage ersetzen, `consent.ts`
des Funnels anbinden (Vorlage `templates/meta/consent.ts`), `metaCookies` aus
`src/lib/meta-pixel.ts` importieren. Die Submit-Function nimmt
`utm_source_last`, `touches`, `fbp`, `fbc`, `utm_term` entgegen und schreibt
sie ins Lead-Ziel (CRM, Tabelle, Datenbank): Quelle des letzten Touches, die
Touch-Liste als JSON (bei Airtable maximal 20 000 Zeichen je Feld),
Kampagnenname aus `utm_campaign`, Anzeigengruppe aus `utm_term` (Fallback
`utm_medium`), Creative aus `utm_content` (die Anzeigen-ID). Felder im
Lead-Ziel erst nach Freigabe des Menschen anlegen.

UTM-Vorlage fuer Meta-Anzeigen:
`utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.id}}`.
Ohne die Vorlage bleibt die Creative-Zuordnung leer. Attribution nie nur aus
UTM: Klicks aus Instagram kommen ohne UTM an, der Klick lebt dann nur in
`fbc`.

## Sink und Danke-Seite

- `q.ts` kennt nur die Event-Typen der Tabelle oben (`ALLOWED_EVENT_TYPES`),
  droppt Bots per User-Agent, verwirft Aufrufe aus dem Land des Betreibers
  (Header `x-country`, damit eigene Tests die Zahlen nicht faelschen) und
  hasht die IP. `site_changelog` und `funnel_manifest` duerfen nie vom
  Browser kommen.
- Danke-Seite als eigene Route (`/<funnel>/danke` oder `/lp/<funnel>/danke`)
  mit `thankyou_view`. Landingpages unter `/lp/` ohne globalen Header und
  Footer, aber mit Impressum und Datenschutz als kleinem Footer. Alte
  Adressen leiten mit Query-Parametern weiter, sonst geht die Herkunft beim
  Redirect verloren.

## Abnahme

- `track.test.ts` gruen (Touch aus URL und Referrer, first nie
  ueberschrieben, Dedupe 30 Minuten, Deckel zehn, interne Navigation aendert
  nichts).
- Lokal mit dem Pruefskript `templates/meta/meta-walk.mjs` (Functions
  gemockt): jede Frage genau ein `step_view`, `contact_view` am
  Kontakt-Screen, `lead_submit` mit `touches`, `thankyou_view` am Ende,
  `utm_*` und `fbp`/`fbc` in `metadata`.
- Rechtlich, keine Rechtsberatung: UTMs sind keine personenbezogenen Daten;
  Session-ID und Touches in `sessionStorage` ohne Consent sind nach strenger
  Lesart der deutschen Umsetzung der ePrivacy-Richtlinie eine Grauzone. Die
  speicherfreie Variante waere ein serverseitiger Tages-Hash statt einer
  Session-ID im Browser.

## Grenzen

Schema des Lead-Ziels nur mit Freigabe aendern. Keine Schreibtests gegen
Produktion, Pruefläufe laufen mit gemockten Functions. Die Vorlage im Plugin
ist die Quelle.
