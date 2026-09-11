# Funnel-Tracking: Zahlen, die man deuten kann

Gilt fuer jedes Repo, das einen Lead-Funnel ausliefert. Das Plugin
`plugins/funnel-tracking` setzt die vier Regeln unten durch; installiert wird
es ueber den Marketplace des Kits:

```
/plugin marketplace add <pfad-oder-repo-des-kits>
/plugin install funnel-tracking@assistent-kit
```

## Kein Prod-Deploy ohne Changelog-Eintrag

**Regel:** Vor jedem Prod-Deploy steht oben in `CHANGELOG.md` ein neuer
Eintrag (`## JJJJ-MM-TT · funnel · kategorie · Titel`), und deployt wird nur
ueber `npm run deploy`. Der Wrapper verweigert ohne Eintrag, prueft die
Site-ID gegen den Namen, stempelt Deploy-ID und Commit zurueck in den Eintrag
und spiegelt ihn in den Event-Store.

**Warum:** Ein Funnel, der ohne Protokoll deployt wird, produziert Zahlen,
die niemand deuten kann: die Conversion faellt um einen Punkt, und keiner
weiss, ob das an der neuen Headline lag, an der neuen Frage oder am Wetter.
Eine Bitte im Systemprompt reicht dafuer nicht, weil sie unter Zeitdruck
uebergangen wird. Deshalb liegt die Sperre dreifach: Plugin-Hook, Repo-Hook
und PATH-Shim. Dazu kommt die CLI-Falle: am 31.08.2026 hat bei uns ein
sauberer Deploy vom letzten Commit eine Live-Seite entfernt, die nur im
Arbeitsbaum lag. Bei CLI-Deploys ohne Git-Anbindung wird der Arbeitsbaum
veroeffentlicht, nicht HEAD.

**Werkzeug:** `plugins/funnel-tracking` (Skill `changelog`), Vorlagen
`templates/deploy.mjs`, `templates/deploy-guard.py`,
`scripts/install-shim.sh`.

**Fertig wenn:**
```
echo '{"cwd":"<repo>","tool_input":{"command":"netlify deploy --prod"}}' \
  | python3 scripts/deploy-guard.py; echo $?
npm run deploy:check
```
Ausgabe: `2` plus Hinweis fuer den Guard, und `deploy:check` bestaetigt
Site-Name, ausstehenden Eintrag und Fragenkataloge.

## Herkunft als Touch-Historie, nicht als ein UTM-Feld

**Regel:** Der Funnel fuehrt `first`, `last` und `touches` (Deckel zehn,
Dubletten binnen 30 Minuten geschluckt) und schickt sie mit jedem Event und
im Lead-Payload mit. `first` wird nie ueberschrieben.

**Warum:** Ein einzelnes `utm_source` beantwortet die Frage "welche Quelle
bringt Leads" falsch, sobald jemand zweimal kommt. Und Attribution nur aus
UTM verliert die Klicks ganz: Aufrufe aus der Instagram-App kommen ohne
UTM-Parameter an, der Klick lebt dann allein in `fbc`. Wer nur die UTM-Spalte
auswertet, schreibt diese Leads auf "direkt" und schaltet die falsche
Kampagne ab.

**Werkzeug:** `templates/track.ts` plus `templates/track.test.ts` im Plugin
(Skill `tracking`); UTM-Vorlage in den Anzeigen
`utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.id}}`.

**Fertig wenn:**
```
npx vitest run src/**/track.test.ts
```
Ausgabe: alle Tests gruen, darunter "first wird nie ueberschrieben" und
"interne Navigation erzeugt keinen Touch".

## Eine event_id fuer Pixel und Conversions API

**Regel:** Der Browser erzeugt die `event_id`, das First-Party-Event traegt
sie in `metadata.event_id`, der Server spiegelt nur Events mit ID an die
Conversions API. Gleicher Event-Name plus gleiche ID binnen 48 Stunden ist
fuer Meta ein Ereignis, nicht zwei. Die Pixel-ID steht als Konstante im Code,
die Build-Env ist nur Override.

**Warum:** Beide Haelften scheitern still. Eine fehlende `VITE_`-Variable hat
den Pixel bei uns komplett aus dem Bundle optimiert, weil der Bundler
`undefined` inlinet und der Minifier den toten Zweig wegwirft: der Code sah
richtig aus, es feuerte nichts. Umgekehrt zaehlen blinde
`fbq('track','Lead')` auf der Danke-Seite jeden Lead doppelt, sobald der
Pixel site-weit laedt. Ohne gemeinsame ID optimiert Meta auf eine erfundene
Zahl.

**Werkzeug:** `templates/meta/` im Plugin (Skill `meta-pixel`), lokaler
Prueflauf `meta-walk.mjs`, Live-Check `pixel-live-check.mjs`.

**Fertig wenn:**
```
npm run build && grep -c fbq dist/assets/*.js
URL=https://<host>/<funnel> node pixel-live-check.mjs
```
Ausgabe: Zaehler groesser `0`, und der Live-Check zeigt `TR PageView` und
`TR ViewContent` mit `eid=` und Status 200.

## Eine Auswertungsseite, kein Dashboard je Repo

**Regel:** Die Events bleiben im Store des Funnel-Repos, ausgewertet wird an
einer Stelle: eine passwortgeschuetzte Route `/admin/tracking/<projekt>/<funnel>`,
die die Stores aller Projekte liest. Ein neues Funnel-Repo bekommt einen
Eintrag in deren Konfiguration, kein eigenes Dashboard. Der Verbindungsstring
liegt je Projekt als eigene Env-Variable, read-only, nie im Code.

**Warum:** Ein Dashboard je Repo bedeutet, dass jede Verbesserung
n-mal gebaut wird und die Zahlen zwischen den Seiten auseinanderlaufen. Dazu
zwei Fallen, die stumm falsche Zahlen erzeugen: Changelog- und
Manifest-Rows (`session_id = "__changelog__"`) muessen vor jeder Aggregation
abgetrennt werden, sonst entstehen Phantom-Schritte; und Listen-Endpunkte
kappen stillschweigend (100 bei manchen CRMs, 1000 bei PostgREST), weshalb
immer paginiert und ein gekapptes Fenster gekennzeichnet wird.

**Werkzeug:** `plugins/funnel-tracking` (Skill `analytics`); der Skill nennt
den vollstaendigen Vertrag, den die Seite erfuellen muss.

**Fertig wenn:**
```
curl -s -o /dev/null -w '%{http_code}\n' https://<host>/admin/tracking/<projekt>/<funnel>
```
Ausgabe: `200` fuer den angemeldeten Nutzer, Umleitung oder `401` ohne Login,
und der neue Funnel steht in der Liste, auch wenn er noch bei null Events
steht.
