# Master Vision Site

Eine Seite, passwortgeschuetzt, vom Handy editierbar. Der Inhalt liegt in
Netlify Blobs, nicht in der HTML-Datei. Deshalb reicht ein Fingertipp zum
Aendern, kein Deploy.

## Aufsetzen

```bash
npm install
netlify login
netlify sites:create          # oder: netlify link
netlify env:set MV_PASSWORD "<passwort>"
netlify deploy --prod
```

Danach `public/index.template.html` nach `public/index.html` kopieren, den
Inhalt zwischen `<main>` und `</main>` mit der eigenen Vision fuellen,
erneut deployen, und den Inhalt einmal in den Blob schreiben (siehe unten).

## Die eine Falle

Sobald im Blob etwas liegt, ersetzt das Seiten-JS beim Laden den
`<main>`-Inhalt durch den Blob-Stand. **Ein Deploy allein aendert danach
nichts mehr an dem, was man sieht.** Nach jedem Deploy, der den Text
aendert, den Blob mitschreiben:

```bash
SITE=https://<site>.netlify.app
PW=<passwort>
curl -s -u "x:$PW" -X PUT -H "content-type: text/html" \
     --data-binary @<(sed -n '/<main/,/<\/main>/p' public/index.html) \
     "$SITE/.netlify/functions/content"
curl -s -u "x:$PW" "$SITE/.netlify/functions/content?cb=$RANDOM" | head -3
```

Der Cache-Buster am GET ist noetig, die erste Abfrage nach dem PUT liefert
sonst noch die alte Antwort.

Vor dem Ueberschreiben lohnt ein Blick auf den aktuellen Blob-Stand: wer
zwischendurch mobil editiert hat, verliert diese Aenderungen sonst.

## Selbsttest ohne Risiko fuer den Inhalt

Header `x-selftest: 1` schreibt und liest den Schluessel `selftest` statt
`current`:

```bash
curl -s -u "x:$PW" -H "x-selftest: 1" -X PUT --data "ok" "$SITE/.netlify/functions/content"
curl -s -u "x:$PW" -H "x-selftest: 1" "$SITE/.netlify/functions/content?cb=$RANDOM"
```

## Backups

Beim ersten Speichern eines Tages wird der vorherige Stand automatisch als
`backup-YYYY-MM-DD` im selben Store abgelegt.
