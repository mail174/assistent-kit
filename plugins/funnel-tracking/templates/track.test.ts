import { describe, expect, it } from "vitest";
import { addTouch, sourceFromReferrer, touchFromLocation } from "./track";

const at = (iso: string) => new Date(iso);

describe("touchFromLocation", () => {
  it("nimmt UTMs von der URL, Landing-Pfad und externen Referrer", () => {
    const t = touchFromLocation("https://beispiel.de/vertrieb?utm_source=meta&utm_medium=paid&utm_campaign=c1&utm_content=ad9", "https://l.facebook.com/", at("2026-08-28T10:00:00Z"));
    expect(t).toMatchObject({ source: "meta", medium: "paid", campaign: "c1", content: "ad9", landing: "/vertrieb", referrer: "https://l.facebook.com/" });
  });

  it("leitet die Quelle aus fbclid oder Referrer ab", () => {
    expect(touchFromLocation("https://x.de/vertrieb?fbclid=abc", "", at("2026-08-28T10:00:00Z"))).toMatchObject({ source: "meta", medium: "paid", fbclid: "abc" });
    expect(touchFromLocation("https://x.de/vertrieb", "https://www.google.com/", at("2026-08-28T10:00:00Z"))).toMatchObject({ source: "google", medium: "organic" });
    expect(touchFromLocation("https://x.de/vertrieb", "https://blog.example.org/post", at("2026-08-28T10:00:00Z"))).toMatchObject({ source: "blog.example.org", medium: "referral" });
  });

  it("ist null bei interner Navigation ohne Parameter", () => {
    expect(touchFromLocation("https://x.de/vertrieb/danke", "https://x.de/vertrieb", at("2026-08-28T10:00:00Z"))).toBeNull();
    expect(touchFromLocation("https://x.de/vertrieb", "", at("2026-08-28T10:00:00Z"))).toBeNull();
  });
});

describe("sourceFromReferrer", () => {
  it("kennt die großen Plattformen und fällt auf Host zurück", () => {
    expect(sourceFromReferrer("https://www.instagram.com/", null).source).toBe("meta");
    expect(sourceFromReferrer("https://www.linkedin.com/feed", null).source).toBe("linkedin");
    expect(sourceFromReferrer("https://foo.bar/", null)).toEqual({ source: "foo.bar", medium: "referral" });
    expect(sourceFromReferrer(null, null)).toEqual({ source: "direkt", medium: null });
  });
});

describe("addTouch", () => {
  const meta = touchFromLocation("https://x.de/vertrieb?utm_source=meta&utm_campaign=c1", "", at("2026-08-28T10:00:00Z"))!;

  it("legt beim ersten Aufruf ohne Signal einen direkten Touch an", () => {
    const s = addTouch(null, null, "https://x.de/vertrieb", at("2026-08-28T09:00:00Z"));
    expect(s.first.source).toBe("direkt");
    expect(s.touches).toHaveLength(1);
    expect(s.last).toBe(s.first);
  });

  it("überschreibt den ersten Touch nie, setzt den letzten und führt die Liste", () => {
    let s = addTouch(null, meta, "https://x.de/vertrieb");
    const google = touchFromLocation("https://x.de/vertrieb", "https://www.google.com/", at("2026-08-29T10:00:00Z"))!;
    s = addTouch(s, google, "https://x.de/vertrieb");
    expect(s.first.source).toBe("meta");
    expect(s.last.source).toBe("google");
    expect(s.touches.map((t) => t.source)).toEqual(["meta", "google"]);
  });

  it("schluckt denselben Touch innerhalb von 30 Minuten und deckelt bei zehn", () => {
    let s = addTouch(null, meta, "https://x.de/vertrieb");
    const again = { ...meta, ts: "2026-08-28T10:10:00Z" };
    s = addTouch(s, again, "https://x.de/vertrieb");
    expect(s.touches).toHaveLength(1);
    for (let i = 0; i < 15; i++) {
      s = addTouch(s, { ...meta, campaign: `c${i}`, ts: `2026-08-28T1${i % 10}:00:00Z` }, "https://x.de/vertrieb");
    }
    expect(s.touches.length).toBe(10);
    expect(s.first.source).toBe("meta");
    expect(s.first.campaign).toBe("c1");
  });

  it("interne Navigation ändert nichts", () => {
    const s = addTouch(null, meta, "https://x.de/vertrieb");
    expect(addTouch(s, null, "https://x.de/vertrieb/danke")).toBe(s);
  });
});
