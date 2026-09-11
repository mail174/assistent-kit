---
name: meta-pixel
description: "Use when ein Funnel Meta Pixel oder Conversions API braucht oder das Meta-Tracking geprueft werden soll: 'Pixel einbauen', 'CAPI', 'Meta Tracking', 'Pixel feuert nicht', 'Events doppelt im Pixel Helper', 'welches Event wohin'. Baut Pixel und CAPI mit gemeinsamer event_id, Consent-Schalter, Advanced Matching und Prueflaeufen in einen Lead- oder Sales-Call-Funnel ein."
---

# funnel-tracking:meta-pixel

Vorlagen: `templates/meta/` im Plugin-Root (zwei Ebenen ueber dieser Datei),
Pfad zur Laufzeit ermitteln, nicht raten.

## Welches Event wohin

| Moment | First-Party-Event | Meta-Event | Pixel | CAPI |
|---|---|---|---|---|
| jede Seite / Routenwechsel | (Site) | `PageView` | ja | nein |
| erster Funnel-Screen | `entry_view` | `ViewContent` | ja | ja (`q.ts`) |
| jede Frage | `step_view` | Custom `FunnelStep` | ja | nein |
| disqualifiziert | `dq` | Custom `Disqualified` | ja | nein |
| erster Kontakt-Screen | `contact_view` | `InitiateCheckout` | ja | ja (`q.ts`) |
| Lead gespeichert (HTTP 200) | `lead_submit` | `Lead` (value, currency) | ja | ja (Submit-Function, mit PII) |
| Danke-Seite | `thankyou_view` | nur `PageView` | ja | nein |
| Sales-Call-Funnel: Termin gebucht | eigenes Event | `Schedule` | ja | ja |
| Phase 2: CRM-Status qualifiziert | (CRM) | Custom `QualifiedLead`, `action_source: system_generated` | nein | ja |

Bewusst nicht: `phone_view` und `result_view` als Meta-Events,
`CompleteRegistration` fuer Leads, CAPI-Spiegel fuer Zwischenschritte.

## Regeln

1. **Pixel-ID als Konstante im Code**, Build-Env nur als Override. Eine
   fehlende `VITE_`-Variable hat den Pixel in einem Rollout still aus dem
   Bundle optimiert (Vite inlined `undefined`, Terser warf `fbq` weg).
   Pruefung nach dem Build: `grep -c fbq dist/assets/*.js` groesser 0.
2. **Eine `event_id` je Pixel/CAPI-Paar.** Der Browser erzeugt sie
   (`newEventId("vc"|"ic"|"lead")`), das First-Party-Event traegt sie in
   `metadata.event_id`, `q.ts` spiegelt nur Events mit ID (`CAPI_EVENT_MAP`)
   und wartet den Send ab (Fire-and-forget stirbt mit der Function-Antwort).
   Meta dedupliziert bei gleichem Namen und gleicher ID binnen 48 h.
3. **Standard-Events fuer die Optimierung, Custom-Events fuer Audiences.**
   Lead braucht rund 50 Conversions pro Woche fuer die Lernphase, darunter
   auf `InitiateCheckout` optimieren.
4. **Lead erst nach HTTP 200**, davor `matchLead` (Advanced Matching,
   `fbq('init', id, { em, ph, fn, ln, external_id })`, der Pixel hasht
   selbst). ViewContent und InitiateCheckout einmal je Sitzung (Ref),
   Custom-Events einmal je Inhalt und Seitenaufruf (Set in `pixel.ts`; der
   Pixel Helper meldete sonst dreifache `FunnelStep`).
5. **CAPI `user_data` so voll wie moeglich:** em, ph (E.164), fn, ln
   gehasht; `external_id` = Hash der Session-ID; `fbp`, `fbc`, IP,
   User-Agent roh. `metaCookies` liest `_fbp`/`_fbc`, die Tracking-Lib
   schickt sie mit jedem Event und im Lead-Payload.
6. **Consent-Schalter immer paarweise:** Browser `VITE_META_CONSENT`
   (`off` | `cookieyes`), Server `META_CONSENT_MODE` (ungesetzt | `client`).
   Bei `cookieyes` laeuft Meta Consent Mode (`revoke` vor `init`, `grant`
   bei Zustimmung) und der Server sendet nur mit `tracking_consent=true`.
   Welcher Schalter gilt, entscheidet der Mensch: Risiko einmal klar
   benennen, dann seine Entscheidung umsetzen, nicht eigenmaechtig auf
   `off` stellen.
7. **Test nur mit `META_TEST_EVENT_CODE`** aus dem Events Manager; Lead muss
   dort als dedupliziert erscheinen. Keine Test-Leads gegen den Prod-Pixel.
8. **Keine blinden `fbq('track','Lead')` auf Danke-Seiten** ohne event_id:
   sobald der Pixel site-weit laedt, zaehlen sie doppelt zum CAPI-Lead.

## 1. Inventur (nichts schreiben)

- Wo laedt der Pixel heute?
  `grep -rn "fbq\|fbevents\|VITE_META_PIXEL_ID\|META_PIXEL_ID" index.html src netlify`.
  Typische Fallen: Pixel nur beim Lead-Submit per JS, Pixel-ID nur aus einer
  `VITE_`-Env, blinde `fbq('track','Lead')` auf Danke-Seiten.
- Bundle-Check: `grep -c fbq dist/assets/*.js`. Null heisst: nichts feuert,
  egal was der Code sagt.
- Server: gibt es `_lib/capi.ts` (Hashing, `sendCapiEvent`, `ctxFromEnv`)?
  Env-Namen pruefen, nur Namen:
  `netlify env:list --json | python3 -c "import json,sys;print([k for k in json.load(sys.stdin) if 'META' in k])"`.
  Erwartet `META_PIXEL_ID`, `META_CAPI_TOKEN`, optional
  `META_TEST_EVENT_CODE`.
- Pixel-ID: `META_PIXEL_ID` der Site nur mit der bekannten ID vergleichen
  (`[ "$v" = "<id>" ] && echo ja`), nie ausgeben.
- Consent: welcher Banner (CookieYes, Klaro, eigener), welche Kategorie, wie
  liest der Code sie heute.
- Meta-CLI: `meta ads dataset get <pixel_id>` zeigt `LAST_FIRED_TIME`. Liegt
  das Datum Tage zurueck, obwohl Traffic da ist, feuert nichts.

## 2. Entscheidungen des Menschen holen

1. Optimierungsziel: Lead beim Absenden (Standard) oder spaeter ein
   Qualitaets-Event aus dem CRM (`QualifiedLead`). Sales-Call-Funnel:
   zusaetzlich `Schedule` bei Terminbuchung.
2. Consent-Schalter `off` oder `cookieyes`/`client`.
3. Lead-Wert (`value`) in EUR und `content_name`.

## 3. Dateien

| Vorlage (`templates/meta/`) | Ziel im Repo | Anpassen |
|---|---|---|
| `meta-pixel.ts` | `src/lib/meta-pixel.ts` | `{{PIXEL_ID}}`; Consent-Modus ueber `VITE_META_CONSENT` |
| `MetaPageView.tsx` | `src/components/MetaPageView.tsx` | nichts; in `App.tsx` direkt unter `<BrowserRouter>` einhaengen |
| `pixel.ts` | `src/<funnel>/lib/pixel.ts` | `{{FUNNEL}}`; Importpfad zu `lib/meta-pixel` |
| `consent.ts` | `src/<funnel>/lib/consent.ts` | Cookie-Parser an den Banner anpassen, wenn nicht CookieYes |
| `capi.ts` | `netlify/functions/_lib/capi.ts` | nichts (Graph v21.0, `capiAllowed` liest `META_CONSENT_MODE`) |
| `q-capi-forward.ts` | Ausschnitt fuer `netlify/functions/q.ts` | `{{DOMAIN}}`, `{{CONTENT_NAME}}`; `contact_view` in die erlaubten Event-Typen |
| `submit-capi-lead.ts` | Ausschnitt fuer die Submit-Function | `{{CONTENT_NAME}}`, `{{LEAD_VALUE}}`; Lead-Input-Typ um `fbp`, `fbc`, `utm_term` erweitern |
| `meta-walk.mjs` | lokaler Prueflauf (Scratchpad, nicht ins Repo) | `BASE`, `FUNNEL`, `PREFIX` (CSS-Praefix der Screens), `CHROME` |
| `pixel-live-check.mjs` | Live-Check nach dem Deploy (Scratchpad) | `URL`, `CHROME` |

Die Tracking-Lib (`templates/track.ts`, Skill `funnel-tracking:tracking`)
schickt mit jedem Event `fbp`/`fbc` und uebernimmt `event_id` aus
`opts.meta`; `attribution()` legt `fbp`/`fbc` in den Lead-Payload.

## 4. Events im Funnel verdrahten

Muster in der Funnel-Komponente (`src/<funnel>/<Funnel>.tsx`):

- `META_CONTENT = { content_name, content_category: "<funnel>_v<n>" }` einmal
  oben.
- Ref `metaFired = useRef<{ vc?: boolean; ic?: boolean }>({})`.
- Screen-Effekt: erster Screen mit `ViewContent` und `newEventId("vc")`,
  dieselbe ID in `track.event("entry_view", { meta: { event_id } })`, aber
  nur wenn `trackStandard` `true` zurueckgab. Jede Frage mit
  `trackCustom("FunnelStep", { ...META_CONTENT, step_number, step_label })`.
  Erster Kontakt-Screen mit `InitiateCheckout`, `newEventId("ic")` und
  `track.event("contact_view", { meta: { event_id } })`.
- DQ mit `trackCustom("Disqualified", { ...META_CONTENT, reason })`.
- Submit: `leadEventId = newEventId("lead")` in den Payload (`event_id`),
  dazu `tracking_consent: pixelAllowed()`. Erst nach `res.ok`:
  `matchLead({ em, ph, fn, ln, external_id: session_id })`, dann
  `trackStandard("Lead", { ...META_CONTENT, currency: "EUR", value }, leadEventId)`.
- Danke-Seite: nichts ausser dem PageView der Route. Alte blinde
  `fbq('track','Lead')` dort entfernen.

## 5. Tests

- `src/lib/meta-pixel.test.ts` (Cookie-Parser, `normalizeMatch`,
  `newEventId`, Pixel-ID fest).
- `consent.test.ts` je Funnel: bei Schalter `off` ist
  `hasAdvertisingConsent()` immer `true`, `advertisingConsent()` liest den
  Cookie trotzdem korrekt.
- `netlify/functions/_lib/q.test.ts` (Insert gestubbt, `fetch`
  mitgeschnitten): `entry_view` mit `event_id` ergibt einen CAPI-Call
  `ViewContent` mit derselben ID, `fbp`, `fbc`, gehashter Session;
  `step_view` und Events ohne `event_id` ergeben keinen Call; Meta offline
  ergibt trotzdem 200. **Testdateien nie direkt unter
  `netlify/functions/`**, Netlify buendelt sie sonst als Function und der
  Build bricht ab; `_lib/` ist sicher.
- `tsc --noEmit`, Vitest, `npm run build`, dann
  `grep -c fbq dist/assets/*.js` groesser 0.

## 6. Lokaler Prueflauf ohne Traffic an Meta

`vite preview` (oder `npm run dev`) starten, dann
`BASE=http://localhost:4173 FUNNEL=<funnel> PREFIX=<css-praefix> node meta-walk.mjs`.
Das Skript blockt die Meta-Hosts (fbq bleibt Queue-Stub), mockt die
Functions und klickt den Funnel bis zur Danke-Seite durch. Erwartete Queue:
`init`, `PageView`, `ViewContent` (eid), `FunnelStep` je Frage,
`InitiateCheckout` (eid), `init` mit Nutzerdaten, `Lead` (eid), `PageView`.
Die eids muessen mit `metadata.event_id` der `q`-Calls und `event_id` des
Submit-Bodies uebereinstimmen. Kein Lead gegen Prod, keine Events an Meta.

## 7. Deploy und Live-Check

1. CHANGELOG-Eintrag, Kategorie `tracking`, dann `npm run deploy` nach dem
   Go des Menschen (`funnel-tracking:changelog`).
2. `URL=https://<host>/<funnel> node pixel-live-check.mjs`: erwartet
   Requests an `facebook.com/tr` mit `ev=PageView` und `ev=ViewContent`
   (eid) und Status 200. Ohne das Chrome-Flag
   `--disable-blink-features=AutomationControlled` schickt fbevents.js in
   Headless-Chrome nichts.
3. `meta ads dataset get <pixel_id>`: `LAST_FIRED_TIME` muss nach vorne
   springen.
4. Ein Mensch geht mit dem Meta Pixel Helper durch den Funnel: jedes Event
   einmal, Lead als dedupliziert. Meldet der Helper Mehrfachfeuern bei
   PageView, steckt ein zweiter Pixel-Init auf der Seite
   (Banner-Integration, Tag-Manager).
5. Events Manager: mit `META_TEST_EVENT_CODE` sind die Server-Events unter
   Test-Events sichtbar; Match-Qualitaet nach den ersten echten Leads
   pruefen.

## 8. Nacharbeit

- UTM-Vorlage in den Anzeigen pruefen
  (`utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.id}}`),
  Feld fuer die Anzeigengruppe im Lead-Ziel aus `utm_term`.
- Phase 2: CRM-Status als `QualifiedLead` per CAPI, sobald der Mensch den
  Status gewaehlt hat.

## Grenzen

Kein Prod-Deploy ohne Go. Keine Secrets ausgeben (Token stehen in Env,
Meta-CLI-Fehler mit `stderr` unterdruecken). Keine Test-Leads gegen Prod.
Vorlagen im Plugin sind die Quelle.
