// CHANGELOG-PFLICHT: Parser fuer CHANGELOG.md. Wird von scripts/deploy.mjs benutzt.
// Reine Funktionen, keine Abhaengigkeiten. Format der Datei: siehe Kopf von CHANGELOG.md.
// Diese Datei ist eine 1:1-Kopie aus dem Skill funnel-tracking (templates/changelog-lib.mjs).
// Aenderungen dort machen, dann in alle Repos kopieren.

import { createHash } from "node:crypto";

export const MARKER = "<!-- funnel-changelog";
const HEADING = /^## (.*)$/;
const DEPLOY = /^- Deploy: (.+)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function splitHeading(rest) {
  return rest.split("·").map((s) => s.trim());
}

/** @returns {{ hasMarker: boolean, entries: Entry[], errors: string[] }} */
export function parse(text) {
  const lines = text.split("\n");
  const entries = [];
  const errors = [];
  let current = null;

  lines.forEach((line, i) => {
    const h = HEADING.exec(line);
    if (h) {
      const parts = splitHeading(h[1]);
      if (parts.length < 4) {
        errors.push(`Zeile ${i + 1}: Überschrift nicht im Format "## JJJJ-MM-TT · funnel · kategorie · Titel"`);
        current = null;
        return;
      }
      const [date, funnels, category, ...titleParts] = parts;
      current = {
        line: i,
        endLine: i,
        date,
        funnels: funnels.split(",").map((f) => f.trim()).filter(Boolean),
        category,
        title: titleParts.join(" · "),
        body: [],
        deploys: [],
      };
      entries.push(current);
      return;
    }
    if (!current) return;
    if (line.trim() === "") return;
    current.body.push(line);
    current.endLine = i;
    const d = DEPLOY.exec(line);
    if (d) current.deploys.push(d[1].trim());
  });

  return { hasMarker: text.includes(MARKER), entries, errors };
}

function validDate(s) {
  if (!DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** @returns {string[]} Fehlertexte, leer wenn alles passt */
export function validate(entries, { funnels, categories }) {
  const errors = [];
  for (const e of entries) {
    const where = `Zeile ${e.line + 1}`;
    if (!validDate(e.date)) errors.push(`${where}: Datum "${e.date}" ist kein gültiges JJJJ-MM-TT`);
    for (const f of e.funnels) {
      if (!funnels.includes(f)) errors.push(`${where}: Funnel "${f}" unbekannt, erlaubt: ${funnels.join(", ")}`);
    }
    if (e.funnels.length === 0) errors.push(`${where}: kein Funnel angegeben`);
    if (!categories.includes(e.category)) {
      errors.push(`${where}: Kategorie "${e.category}" unbekannt, erlaubt: ${categories.join(", ")}`);
    }
    if (!e.title) errors.push(`${where}: Titel fehlt`);
    if (e.title.length > 200) errors.push(`${where}: Titel länger als 200 Zeichen`);
  }
  return errors;
}

export function pending(entries) {
  return entries.filter((e) => e.deploys.length === 0);
}

/** Haengt "- Deploy: <line>" hinter die letzte Body-Zeile jedes Eintrags. */
export function stamp(text, entries, line) {
  const lines = text.split("\n");
  const targets = [...entries].sort((a, b) => b.endLine - a.endLine);
  for (const e of targets) lines.splice(e.endLine + 1, 0, `- Deploy: ${line}`);
  return lines.join("\n");
}

/** "site" = Seiten ausserhalb der Funnels, erzeugt keine Funnel-Row. Nur genannte Funnels bleiben. */
export function expandFunnels(entry, funnels) {
  return entry.funnels.filter((f) => f !== "site" && funnels.includes(f));
}

export function syncKey(entry, funnel, deployId) {
  const heading = `${entry.date}|${entry.category}|${entry.title}`;
  return createHash("sha1").update(`${deployId}|${funnel}|${heading}`).digest("hex");
}

function pad(n) {
  return String(n).padStart(2, "0");
}

export function deployLine({ at, deployId, commit, dirty, tz = "Europe/Berlin" }) {
  const fmt = new Intl.DateTimeFormat("de-DE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(at).map((x) => [x.type, x.value]));
  const when = `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
  const sha = dirty > 0 ? `${commit}+dirty(${dirty})` : commit;
  return `${when} · ${deployId.slice(0, 12)} · Commit ${sha}`;
}

export function description(entry) {
  return entry.body.filter((l) => !DEPLOY.test(l)).join("\n").slice(0, 1000);
}

export function exampleEntry(funnels, categories) {
  const today = new Date().toISOString().slice(0, 10);
  const funnel = funnels.find((f) => f !== "site") ?? funnels[0];
  return [
    `## ${today} · ${funnel} · ${categories.includes("copy") ? "copy" : categories[0]} · Kurzer Titel, was sich ändert`,
    "- Warum: der Anlass in einem Satz",
    "- Was: welche Screens, Texte oder Funktionen",
  ].join("\n");
}
