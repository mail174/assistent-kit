import { describe, it, expect } from "vitest";
import {
  MARKER,
  parse,
  validate,
  pending,
  stamp,
  expandFunnels,
  syncKey,
  deployLine,
  description,
} from "./changelog-lib.mjs";

const FUNNELS = ["check", "vertrieb", "site"];
const CATEGORIES = ["hero", "quiz", "form", "ads", "copy", "tracking", "mail", "other"];

const SAMPLE = `# Changelog · demo

<!-- funnel-changelog v1
Pflichtdatei.
-->

## 2026-08-28 · vertrieb · copy · Telefon-Screen neu getextet
- Warum: Review
- Was: Frage und Hinweistext

## 2026-08-27 · check,vertrieb · tracking · step_number an step_answer
- Was: zwei Zeichen
- Deploy: 2026-08-27 17:08 · 6a90528548fd · Commit 371f337

## 2026-08-20 · site · other · Erster Eintrag
- Deploy: 2026-08-20 10:00 · abc123456789 · Commit deadbee
- Deploy: 2026-08-20 10:30 · abc123456790 · Commit deadbee
`;

describe("parse", () => {
  it("liest Überschrift, Funnels, Kategorie, Titel, Body und Deploy-Zeilen", () => {
    const { entries, hasMarker } = parse(SAMPLE);
    expect(hasMarker).toBe(true);
    expect(entries).toHaveLength(3);
    const [a, b, c] = entries;
    expect(a.date).toBe("2026-08-28");
    expect(a.funnels).toEqual(["vertrieb"]);
    expect(a.category).toBe("copy");
    expect(a.title).toBe("Telefon-Screen neu getextet");
    expect(a.body).toEqual(["- Warum: Review", "- Was: Frage und Hinweistext"]);
    expect(a.deploys).toEqual([]);
    expect(b.funnels).toEqual(["check", "vertrieb"]);
    expect(b.deploys).toEqual(["2026-08-27 17:08 · 6a90528548fd · Commit 371f337"]);
    expect(c.deploys).toHaveLength(2);
  });

  it("meldet fehlenden Marker und kaputte Überschriften", () => {
    const { hasMarker, errors } = parse("# x\n\n## 2026-08-28 · nur zwei Teile\n");
    expect(hasMarker).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Zeile 3/);
  });

  it("akzeptiert Mittelpunkt ohne umgebende Leerzeichen", () => {
    const { entries } = parse(`${MARKER} v1 -->\n## 2026-08-28·check·hero·Titel\n`);
    expect(entries[0].funnels).toEqual(["check"]);
    expect(entries[0].title).toBe("Titel");
  });
});

describe("validate", () => {
  it("ist leer bei gültigen Einträgen", () => {
    const { entries } = parse(SAMPLE);
    expect(validate(entries, { funnels: FUNNELS, categories: CATEGORIES })).toEqual([]);
  });

  it("findet unbekannten Funnel, Kategorie, Datum und zu langen Titel", () => {
    const text = `${MARKER} v1 -->\n## 2026-13-01 · foo · nope · ${"x".repeat(201)}\n`;
    const { entries } = parse(text);
    const errors = validate(entries, { funnels: FUNNELS, categories: CATEGORIES });
    expect(errors.join("\n")).toMatch(/Funnel/);
    expect(errors.join("\n")).toMatch(/Kategorie/);
    expect(errors.join("\n")).toMatch(/Datum/);
    expect(errors.join("\n")).toMatch(/Titel/);
  });
});

describe("pending", () => {
  it("liefert nur Einträge ohne Deploy-Zeile", () => {
    const { entries } = parse(SAMPLE);
    expect(pending(entries).map((e) => e.title)).toEqual(["Telefon-Screen neu getextet"]);
  });
});

describe("stamp", () => {
  it("hängt die Deploy-Zeile hinter die letzte Body-Zeile des Eintrags", () => {
    const { entries } = parse(SAMPLE);
    const out = stamp(SAMPLE, pending(entries), "2026-08-28 15:41 · 6a9052aaaaaa · Commit 778a8b9+dirty(3)");
    const lines = out.split("\n");
    const i = lines.indexOf("- Was: Frage und Hinweistext");
    expect(lines[i + 1]).toBe("- Deploy: 2026-08-28 15:41 · 6a9052aaaaaa · Commit 778a8b9+dirty(3)");
    expect(lines[i + 2]).toBe("");
    expect(parse(out).entries[0].deploys).toHaveLength(1);
    expect(pending(parse(out).entries)).toHaveLength(0);
  });

  it("stempelt mehrere Einträge und lässt den Rest unverändert", () => {
    const text = `${MARKER} v1 -->\n## 2026-08-28 · check · hero · A\n\n## 2026-08-28 · check · hero · B\n- Was: b\n`;
    const out = stamp(text, parse(text).entries, "D");
    const parsed = parse(out).entries;
    expect(parsed[0].deploys).toEqual(["D"]);
    expect(parsed[1].deploys).toEqual(["D"]);
    expect(out.startsWith(`${MARKER} v1 -->\n## 2026-08-28 · check · hero · A\n- Deploy: D\n`)).toBe(true);
  });

  it("redeploy: zweite Deploy-Zeile an einen gestempelten Eintrag", () => {
    const { entries } = parse(SAMPLE);
    const out = stamp(SAMPLE, [entries[1]], "Z");
    expect(parse(out).entries[1].deploys).toEqual([
      "2026-08-27 17:08 · 6a90528548fd · Commit 371f337",
      "Z",
    ]);
  });
});

describe("expandFunnels", () => {
  it("site erzeugt keine Funnel-Row, nur die genannten Funnels bleiben", () => {
    const { entries } = parse(SAMPLE);
    expect(expandFunnels(entries[2], FUNNELS)).toEqual([]);
    expect(expandFunnels(entries[1], FUNNELS)).toEqual(["check", "vertrieb"]);
    expect(expandFunnels(entries[0], FUNNELS)).toEqual(["vertrieb"]);
  });
  it("site neben einem Funnel wird verworfen", () => {
    const { entries } = parse(SAMPLE.replace("· site · other ·", "· site,vertrieb · other ·"));
    expect(expandFunnels(entries[2], FUNNELS)).toEqual(["vertrieb"]);
  });
});

describe("syncKey / deployLine / description", () => {
  it("syncKey ist stabil und hängt an deploy, funnel und Überschrift", () => {
    const { entries } = parse(SAMPLE);
    const k1 = syncKey(entries[0], "vertrieb", "dep1");
    expect(k1).toBe(syncKey(entries[0], "vertrieb", "dep1"));
    expect(k1).not.toBe(syncKey(entries[0], "check", "dep1"));
    expect(k1).not.toBe(syncKey(entries[0], "vertrieb", "dep2"));
    expect(k1).toMatch(/^[0-9a-f]{40}$/);
  });

  it("deployLine formatiert Datum, Deploy-ID gekürzt und Commit", () => {
    const line = deployLine({
      at: new Date("2026-08-28T13:41:00Z"),
      deployId: "6a90528548fd9adc7c22db09",
      commit: "778a8b9",
      dirty: 3,
      tz: "UTC",
    });
    expect(line).toBe("2026-08-28 13:41 · 6a90528548fd · Commit 778a8b9+dirty(3)");
    expect(deployLine({ at: new Date("2026-08-28T13:41:00Z"), deployId: "abc", commit: "1", dirty: 0, tz: "UTC" })).toBe(
      "2026-08-28 13:41 · abc · Commit 1"
    );
  });

  it("description ist der Body ohne Deploy-Zeilen, maximal 1000 Zeichen", () => {
    const { entries } = parse(SAMPLE);
    expect(description(entries[1])).toBe("- Was: zwei Zeichen");
    expect(description(entries[2])).toBe("");
    const long = { body: ["- " + "y".repeat(2000)], deploys: [] };
    expect(description(long)).toHaveLength(1000);
  });
});
