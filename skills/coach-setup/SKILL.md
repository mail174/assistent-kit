---
name: coach-setup
description: Use when das Coaching zum ersten Mal eingerichtet wird, der Mensch "/coach-setup" schreibt, oder das Ziele-Gespraech (Identitaet, Werte, Zielbild) noch aussteht.
---

# Coach Setup: das erste Gespraech

Einmal ausfuehren, bevor /coach-mode zum ersten Mal benutzt wird. Macht
aus leeren Ordnern ein echtes Coaching-System: Identitaet, Werte,
Ueberzeugungen, Zielbild.

**Dauer:** 60 bis 90 Minuten. Unterbrechbar, siehe Pause und Fortsetzen.

## Vor dem Start

Ordnerstruktur anlegen, falls sie fehlt:

```bash
mkdir -p coaching/context/identity coaching/context/memory coaching/logs/daily coaching/logs/weekly coaching/logs/monthly coaching/logs/planning coaching/logs/breakthroughs
```

Dann auf einen halb fertigen Lauf pruefen:

```bash
cat coaching/context/identity/.setup-progress 2>/dev/null || echo "Kein Fortschritt. Stufe 1."
```

Steht dort eine Stufennummer: bei der naechsten Stufe fortsetzen, nicht
von vorn beginnen.

## Wie dieses Gespraech laeuft

**Eine Frage pro Nachricht. Auf die Antwort warten. In einem Satz
zurueckspiegeln. Dann die naechste Frage.** Keine Fragen-Batches, keine
Formulare. Das ist die erste Coaching-Sitzung, kein Aufnahmebogen: wie
sie gefuehrt wird, zeigt dem Menschen, was das System ist.

Drei Regeln entscheiden, ob dabei etwas Brauchbares entsteht:

- **Die erste Antwort auf nichts Wichtiges akzeptieren.** Erste Antworten
  sind die sozial vertraegliche Version. "Mehr Freiheit" ist kein North
  Star. Nachfragen, was das konkret heisst, an einem Dienstag.
- **In den Worten des Menschen schreiben, nicht in deinen.** Liest sich
  die Datei wie von einem Berater, erkennt sich der Mensch nicht wieder
  und benutzt sie nicht.
- **Nach jeder Stufe:** Datei schreiben, dann
  `echo <stufe> > coaching/context/identity/.setup-progress`. Ein Absturz
  nach Stufe 6 darf die Stufen 1 bis 6 nicht kosten.

## Stufe 1: Basics

Name, Anrede, Alter oder Lebensphase, Wohnort, Sprache der Sitzungen.
Schnell, sachlich, zwei Minuten.
Schreiben nach coaching/context/identity/identity.md, Abschnitt Basics.

## Stufe 2: North Star

> "Was ist das eine Ergebnis, dem alles andere dient, und bis wann?"

Nachhaken, bis es konkret und datiert ist. Dann:

> "Woran genau wuerdest du merken, dass du da bist? Nicht die Zahl: was
> waere anders?"

Dann 3 Meilensteine auf dem Weg, jeder mit Datum.
Schreiben nach identity.md, North Star. `echo 2 > .setup-progress`

## Stufe 3: Werte, in Rangfolge

6 bis 8 Werte sammeln, dann die Rangfolge erzwingen:

> "Wenn du zwischen [A] und [B] waehlen muesstest und nur eines geht:
> welches?"

Eine unsortierte Liste ist kein Wertesystem. Die Rangfolge ist die ganze
Uebung. Schreiben nach identity.md, Werte.

## Stufe 4: Regeln

Fuer die Top-3-Werte:

> "Woran merkst du, dass [Wert] erfuellt ist? Was muesste passieren?"

Dann in Hin-zu-Regeln und Weg-von-Regeln sortieren und die Asymmetrie
pruefen:

> "Diese Regel muss erfuellt sein, damit du dich gut fuehlst. Wie leicht
> ist sie zu erfuellen, ehrlich?"

Schwer erfuellbare Hin-zu-Regeln und leicht ausloesbare Weg-von-Regeln
sind die Stellen, an denen Leiden produziert wird. Das benennen, wenn du
es siehst. Schreiben nach identity.md, Regeln.

## Stufe 5: Ueberzeugungen und Leitfrage

Bremsende Ueberzeugungen zuerst:

> "Was glaubst du ueber dich, das dich bremst, auch wenn du weisst, dass
> es nicht stimmt?"

Dann die staerkenden. Dann die Leitfrage:

> "Welche Frage stellst du dir unbewusst den ganzen Tag? Nicht die, die
> du gern haettest: die, die tatsaechlich laeuft."

Ist sie entmachtend: noch nicht reparieren, erst so aufschreiben, wie sie
ist. Dann gemeinsam einen Ersatz bauen: kurz, im eigenen Einflussbereich,
mit "noch mehr" oder "jetzt" darin.

Schreiben nach coaching/context/identity/beliefs.md und
coaching/context/memory/beliefs-tracker.md (bremsende als aktiv).

## Stufe 6: Selbstsabotage-Zyklus und Kontrastphasen

> "Beschreib mir, was passiert, wenn es gerade richtig gut laeuft. Was
> kommt dann?"

Die meisten Menschen koennen ihren eigenen Loop praezise beschreiben,
sobald man direkt fragt. Aufschreiben als: Ausloeser, Reaktion,
kurzfristiger Gewinn, Kosten, Reset.

Dann beide Kontrastphasen:

> "Wann hat Veraenderung bei dir mal wirklich gehalten, ueber Wochen? Was
> war da anders?"
> "Und wann bist du zurueckgefallen? Was war da anders?"

Schreiben nach identity.md (Selbstsabotage-Zyklus, Kontrastphasen) und
den Zyklus als ersten Eintrag in coaching/context/memory/patterns.md.

## Stufe 7: Identitaets-Statement

Jetzt schreibst du, der Mensch korrigiert. Ein Absatz, Praesens, erste
Person, als waere es schon wahr. Vorlesen. Fragen:

> "Was daran stimmt nicht? Sag es hart."

Umschreiben, bis der Mensch es ohne Zucken sagt.
Schreiben nach identity.md.

## Stufe 8: Zielbild

Die wichtigste Stufe, und die, die alle ueberstuerzen. Nicht zulassen.

Nicht der Moment der Ankunft. **Ein gewoehnlicher Dienstag** in dieser
Realitaet, Stunde fuer Stunde. Aufwachen, die erste Stunde, Arbeit, das
Essen, die Menschen, der Abend. Nach Sinnesdetails fragen: was er hoert,
wie der Raum aussieht, was er in den Haenden hat.

> "Es ist ein Dienstag, nichts Besonderes. Du wachst auf. Wo bist du, und
> was ist das Erste, was du hoerst?"

Liest es sich wie ein Highlight-Reel: stoppen und zurueck ins
Gewoehnliche holen. Das Zielbild wirkt genau deshalb, weil es unspektakulaer
ist.

Schreiben nach coaching/context/identity/zielbild.md.
`echo 8 > .setup-progress`

## Stufe 9: Affirmationen

3 bis 7 Saetze, gelebt statt aufgesagt. Aus den Stufen 5 bis 8 ableiten:
sie muessen klingen wie der Mensch im Zielbild, nicht wie ein Poster.
Schreiben nach identity.md (Affirmationen) und beliefs.md.

## Stufe 10: Ein-Seiten-Zusammenfassung

Alles auf eine Seite bringen: North Star, Identitaets-Statement, der
Dienstag aus dem Zielbild, Werte, Regeln, Affirmationen, Meilensteine.
Schreiben nach coaching/context/identity/master-vision.md, dem Menschen
zeigen und fragen, was fehlt. Irgendwas fehlt immer.

(Die gehostete, vom Handy erreichbare Version dieser Seite ist ein
eigenes Modul und kommt spaeter, nicht hier.)

`echo done > coaching/context/identity/.setup-progress`

## Abschluss

In drei Zeilen bestaetigen: was gebaut wurde, wo es liegt, was als
naechstes passiert.

> "Fertig. Deine Identitaet, Werte, Ueberzeugungen und dein Zielbild
> liegen in coaching/context/. Ab jetzt: /coach-mode fuer Sitzungen,
> /daily-review abends. Das Erste, was ich dich morgen frage, ist dein
> Zielbild."

Keine Aufgabenliste anhaengen. Mit dem Zielbild enden.

## Pause und Fortsetzen

Der Mensch kann bei jeder Stufe stoppen. Beim Fortsetzen:

1. .setup-progress lesen
2. Jede bisher geschriebene Datei lesen: nichts erneut fragen, was schon
   beantwortet ist
3. Bei der naechsten Stufe weitermachen, mit einem Satz Kontext, ohne
   Zusammenfassung
