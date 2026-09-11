#!/usr/bin/env node
// CHANGELOG-PFLICHT: Dies ist der einzige erlaubte Weg fuer einen Prod-Deploy dieses Repos.
// Ohne ausstehenden Eintrag in CHANGELOG.md bricht das Script ab. Regeln: AGENTS.md.
// Gilt fuer jeden Agenten und jedes LLM. Nie `netlify deploy --prod` direkt aufrufen.
//
// Aufrufe:  npm run deploy              Prod-Deploy mit allen Pruefungen
//           npm run deploy:check        nur die Vorpruefungen, kein Deploy
//           node scripts/deploy.mjs --redeploy    gleicher Stand nochmal, zweite Deploy-Zeile
//           node scripts/deploy.mjs --sync-only   Eintraege nachtraeglich in den Store spiegeln
//
// Vorlage aus dem Skill funnel-tracking (templates/deploy.mjs). Nur der Konfig-Block und
// sink() sind pro Repo verschieden; der Rest bleibt identisch.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parse, validate, pending, stamp, expandFunnels, syncKey, deployLine, description, exampleEntry,
} from "./changelog-lib.mjs";
import { experimentRows, loadExperiment } from "./experiment-lib.mjs";

// ---------- Konfig-Block, pro Repo ausfuellen ----------
const SITE_ID = "{{SITE_ID}}";
const SITE_NAME = "{{SITE_NAME}}";
const PROD_URL = "{{PROD_URL}}";
const FUNNELS = [{{FUNNELS}}]; // "site" = ausserhalb der Funnels, keine Funnel-Row
const CATEGORIES = ["hero", "quiz", "form", "ads", "copy", "tracking", "mail", "other"];
const PUBLISH_DIR = "dist";
const MANIFESTS = {}; // Fragenkataloge je Funnel, z. B. { check: "src/check/engine/screens.ts" } mit Export STEPS (optional buildScreens); leer = kein Manifest
const EXPERIMENTS = {}; // A/B-Config je Funnel, z. B. { vertrieb: "src/vertrieb/config/experiment.ts" } mit Export EXPERIMENT; leer = kein Test

// Store-Anbindung. Standard: Netlify DB (Neon) der Site, Tabelle funnel_events, Rolle aus
// NETLIFY_DB_URL (readonly plus Grant-Migration). Jede Row traegt
// session_id "__changelog__"; Changelog-Eintraege als event_type "site_changelog" (eine Row je
// Funnel, step_label = Kategorie), Fragenkataloge als "funnel_manifest" (step_label = Hash).
// Nutzdaten in metadata, Idempotenz ueber metadata.key. Die Auswertungsseite liest
// beides und halten es aus jeder Aggregation heraus. Der Treiber kommt aus dem Repo
// (@neondatabase/serverless ist eine Abhaengigkeit von @netlify/database).
// Anderer Store: sink() austauschen, Signatur bleibt (rows mit event_type, funnel, key,
// step_label, metadata, created_at).
async function sink(rows) {
  const url = envGet("NETLIFY_DB_URL");
  if (!url) throw new Error("NETLIFY_DB_URL nicht lesbar (netlify env:get)");
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  let written = 0;
  for (const r of rows) {
    const seen = await sql`select id from funnel_events where metadata->>'key' = ${r.key} limit 1`;
    if (seen.length) continue;
    await sql`
      insert into funnel_events (funnel_name, session_id, event_type, step_number, step_label, metadata, ip_hash, created_at)
      values (${r.funnel}, '__changelog__', ${r.event_type}, null, ${r.step_label}, ${JSON.stringify(r.metadata)}::jsonb, null, ${r.created_at}::timestamptz)`;
    written++;
  }
  return written;
}
// ---------- Ende Konfig-Block ----------

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const REDEPLOY = args.has("--redeploy");
const SYNC_ONLY = args.has("--sync-only");

const log = (m) => console.log(`[deploy] ${m}`);
const fail = (m) => { console.error(`\n[deploy] ABBRUCH: ${m}\n`); process.exit(1); };

function run(cmd, cmdArgs, { inherit = false, env = {}, timeout } = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env }, timeout,
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  if (r.error) throw r.error;
  return r;
}

function netlifyApi(method, data) {
  const r = run("netlify", ["api", method, "--data", JSON.stringify(data)], { timeout: 60_000 });
  if (r.status !== 0) throw new Error(`netlify api ${method} fehlgeschlagen: ${(r.stderr || "").slice(0, 300)}`);
  return JSON.parse(r.stdout);
}

function envGet(name) {
  const r = run("netlify", ["env:get", name, "--site", SITE_ID, "--context", "production"], { timeout: 60_000 });
  const v = (r.stdout || "").trim();
  return r.status === 0 && v && !/^No value/i.test(v) ? v : "";
}

function gitState() {
  const sha = run("git", ["rev-parse", "--short", "HEAD"]).stdout.trim() || "unbekannt";
  const dirty = run("git", ["status", "--porcelain", "--", "."]).stdout.split("\n").filter(Boolean).length; // nur dieser Ordner, auch im Monorepo
  return { sha, dirty };
}

function readChangelog() {
  if (!existsSync(CHANGELOG)) fail("CHANGELOG.md fehlt im Repo-Root");
  const text = readFileSync(CHANGELOG, "utf8");
  const parsed = parse(text);
  if (!parsed.hasMarker) fail("CHANGELOG.md hat keinen funnel-changelog-Marker im Kopf");
  const errors = [...parsed.errors, ...validate(parsed.entries, { funnels: FUNNELS, categories: CATEGORIES })];
  if (errors.length) fail(`CHANGELOG.md ungültig:\n  ${errors.join("\n  ")}`);
  return { text, entries: parsed.entries };
}

function verifySite() {
  const site = netlifyApi("getSite", { site_id: SITE_ID });
  if (site.name !== SITE_NAME) fail(`Site-ID ${SITE_ID} heißt "${site.name}", erwartet "${SITE_NAME}"`);
  const pub = site.published_deploy || {};
  log(`Site ${site.name}, veröffentlicht: ${pub.id || "nichts"} (${pub.published_at || "-"})`);
  return pub;
}

function berlinToIso(date, time) {
  for (const off of ["+02:00", "+01:00"]) {
    const d = new Date(`${date}T${time}:00${off}`);
    const back = deployLine({ at: d, deployId: "x", commit: "x", dirty: 0 }).slice(0, 16);
    if (back === `${date} ${time}`) return d.toISOString();
  }
  return new Date(`${date}T${time}:00Z`).toISOString();
}

function rowsFor(entries, { deployId, commit, createdAt }) {
  const short = deployId.slice(0, 12);
  return entries.flatMap((e) =>
    expandFunnels(e, FUNNELS).map((funnel) => {
      const key = syncKey(e, funnel, short);
      return {
        event_type: "site_changelog", funnel, key, step_label: e.category, created_at: createdAt,
        metadata: {
          key, entry_date: e.date, category: e.category, title: e.title, description: description(e),
          deploy_id: deployId, commit, author: "deploy.mjs",
        },
      };
    })
  );
}

/** Fragenkatalog je Funnel aus dem Quellcode, gebuendelt mit esbuild (JS-API, kein Temp-File). */
async function buildManifests() {
  const out = {};
  const entries = Object.entries(MANIFESTS);
  if (!entries.length) return out;
  let esbuild;
  try {
    esbuild = await import("esbuild");
  } catch {
    fail("esbuild fehlt im Repo, der Fragenkatalog kann nicht gebaut werden (npm i -D esbuild)");
  }
  for (const [funnel, entry] of entries) {
    const r = await esbuild.build({ entryPoints: [join(ROOT, entry)], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
    const mod = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));
    if (!Array.isArray(mod.STEPS)) fail(`${entry} exportiert kein STEPS-Array`);

    // Zwischenseiten (Loader, Pressure-Release, Ergebnis) sind eigene Screens und
    // muessen im Portal als Schritte auftauchen. Wo sie stehen, weiss nur buildScreens;
    // die Fragenliste selbst kommt aus STEPS, damit auch bedingte Fragen drin sind.
    const extras = { first: [], after: {} };
    if (typeof mod.buildScreens === "function") {
      let prev = null;
      for (const sc of mod.buildScreens(mod.FIXED_ANSWERS ?? {}, {})) {
        if (sc.kind === "question") { prev = sc.id; continue; }
        const item = { id: sc.id, kind: sc.kind };
        if (prev) (extras.after[prev] ??= []).push(item);
        else extras.first.push(item);
      }
    }
    const ZWISCHEN = {
      loader: "Zwischenseite: wir prüfen deine Angaben",
      pressure: "Zwischenseite: Antwort auf deine größte Sorge",
      result: "Zwischenseite: dein Ergebnis",
    };
    const asScreen = (x) => ({ id: x.id, kind: x.kind, phase: "zwischen", question: ZWISCHEN[x.id] ?? `Zwischenseite: ${x.id}`, conditional: false, dynamic: false, options: null });

    const steps = [...extras.first.map(asScreen)];
    for (const st of mod.STEPS) {
      steps.push({
        id: st.id, kind: st.kind, phase: st.phase, question: st.question,
        conditional: !!st.showIf, dynamic: !!st.optionsFrom,
        options: Array.isArray(st.options) ? st.options.map((o) => ({ value: o.value, label: o.label })) : null,
      });
      for (const x of extras.after[st.id] ?? []) steps.push(asScreen(x));
    }
    out[funnel] = { steps, hash: createHash("sha1").update(JSON.stringify(steps)).digest("hex") };
  }
  return out;
}

function manifestRows(manifests, { deployId, commit, createdAt }) {
  const short = deployId.slice(0, 12);
  return Object.entries(manifests).map(([funnel, m]) => {
    const key = `manifest|${short}|${funnel}`;
    return {
      event_type: "funnel_manifest", funnel, key, step_label: m.hash, created_at: createdAt,
      metadata: { key, deploy_id: deployId, commit, hash: m.hash, steps: m.steps },
    };
  });
}

async function syncOnly(entries) {
  const stamped = entries.filter((e) => e.deploys.length);
  const lastStamp = (e) => {
    const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) · (\S+) · Commit (\S+)/.exec(e.deploys[e.deploys.length - 1]);
    return m ? { deployId: m[3], commit: m[4], createdAt: berlinToIso(m[1], m[2]) } : null;
  };
  let rows = [];
  for (const e of stamped) {
    const s = lastStamp(e);
    if (!s) { log(`Überspringe "${e.title}": Deploy-Zeile nicht lesbar`); continue; }
    rows = rows.concat(rowsFor([e], s));
  }
  // Aktuellen Experiment-Stand und Fragenkatalog mitspiegeln (idempotent ueber metadata.key),
  // damit --sync-only nach einem gescheiterten Sink auch Config- und Manifest-Rows nachholt.
  // Der Katalog kommt aus denselben Quellen wie der juengste Deploy, der Key traegt dessen Id.
  const newest = stamped.length ? lastStamp(stamped[0]) : null;
  if (newest) {
    for (const [funnel, entry] of Object.entries(EXPERIMENTS)) {
      rows = rows.concat(experimentRows(funnel, await loadExperiment(ROOT, entry), newest));
    }
    rows = rows.concat(manifestRows(await buildManifests(), newest));
  }
  const n = await sink(rows);
  log(`Sync fertig: ${n} neue Rows, ${rows.length - n} waren schon da`);
}

async function main() {
  const { text, entries } = readChangelog();

  if (SYNC_ONLY) { await syncOnly(entries); return; }

  const before = verifySite();
  const todo = REDEPLOY ? entries.slice(0, 1) : pending(entries);
  if (!todo.length) {
    fail(
      `Kein ausstehender Eintrag in CHANGELOG.md. Erst den Eintrag oben einfügen, dann deployen.\n\nBeispiel:\n\n${exampleEntry(FUNNELS, CATEGORIES)}\n\nGleicher Stand nochmal? Dann: node scripts/deploy.mjs --redeploy`
    );
  }
  if (REDEPLOY && !todo[0].deploys.length) fail("--redeploy braucht einen bereits gestempelten Eintrag oben");
  const { sha, dirty } = gitState();
  log(`${todo.length} Eintrag/Einträge: ${todo.map((e) => `"${e.title}"`).join(", ")}`);
  log(`Commit ${sha}${dirty ? `, Arbeitsbaum mit ${dirty} uncommitteten Dateien (wird mit deployt)` : ""}`);
  // Fragenkatalog VOR dem Deploy bauen: scheitert das, geht nichts raus. Die Netlify-CLI
  // baut den Live-Stand aus denselben Quellen, Manifest und Site sind damit derselbe Stand.
  const manifests = await buildManifests();
  for (const [funnel, m] of Object.entries(manifests)) log(`Fragenkatalog ${funnel}: ${m.steps.length} Fragen, Hash ${m.hash.slice(0, 12)}`);
  // A/B-Konfiguration ebenfalls vor dem Deploy laden: scheitert der Import, geht nichts raus.
  const experiments = {};
  for (const [funnel, entry] of Object.entries(EXPERIMENTS)) {
    experiments[funnel] = await loadExperiment(ROOT, entry);
    const e = experiments[funnel];
    log(e ? `Experiment ${funnel}: ${e.id} (Status ${e.status})` : `Experiment ${funnel}: keins konfiguriert`);
  }
  if (CHECK_ONLY) { log("Vorprüfungen bestanden, kein Deploy (--check)"); return; }

  const message = `${todo[0].title} (${sha})`;
  log(`netlify deploy --prod --site ${SITE_ID}`);
  const dep = run("netlify", [
    "deploy", "--prod", "--context", "production", "--site", SITE_ID, "--dir", PUBLISH_DIR, "--message", message,
  ], { inherit: true, env: { FUNNEL_DEPLOY_VIA_SCRIPT: "1" } });
  if (dep.status !== 0) fail(`netlify deploy endete mit Exit ${dep.status}. Nichts gestempelt.`);

  const after = netlifyApi("getSite", { site_id: SITE_ID }).published_deploy || {};
  if (!after.id || after.id === before.id) fail(`Kein neuer Prod-Deploy sichtbar (vorher ${before.id}, jetzt ${after.id}). Bitte prüfen.`);
  if (after.context !== "production") fail(`Veröffentlichter Deploy hat Kontext "${after.context}"`);
  log(`Neuer Prod-Deploy ${after.id}`);

  await smoke();

  const line = deployLine({ at: new Date(after.published_at || Date.now()), deployId: after.id, commit: sha, dirty });
  writeFileSync(CHANGELOG, stamp(text, todo, line));
  log(`Gestempelt: ${line}`);

  const add = run("git", ["add", "CHANGELOG.md"]);
  const commit = add.status === 0 ? run("git", ["commit", "-m", `changelog: deploy ${after.id.slice(0, 12)}`, "--", "CHANGELOG.md"]) : add;
  if (commit.status === 0) log("Stempel committet (Push bleibt manuell)");
  else console.error(`[deploy] WARNUNG: Commit des Stempels fehlgeschlagen:\n${(commit.stderr || commit.stdout || "").slice(0, 300)}`);

  try {
    const stamp = { deployId: after.id, commit: sha, createdAt: after.published_at || new Date().toISOString() };
    const expRows = Object.entries(experiments).flatMap(([funnel, e]) => experimentRows(funnel, e, stamp));
    const n = await sink([...rowsFor(todo, stamp), ...manifestRows(manifests, stamp), ...expRows]);
    log(`Changelog, Fragenkatalog${expRows.length ? " und Experiment-Config" : ""} in den Store gespiegelt: ${n} Rows`);
  } catch (err) {
    console.error(`\n[deploy] WARNUNG: Sync in den Store fehlgeschlagen: ${err.message}\n  Deploy ist trotzdem live. Nachholen mit: node scripts/deploy.mjs --sync-only\n`);
  }
}

async function smoke() {
  const html = join(ROOT, PUBLISH_DIR, "index.html");
  const asset = existsSync(html) ? /assets\/index-[^"']+\.js/.exec(readFileSync(html, "utf8"))?.[0] : null;
  for (let i = 1; i <= 5; i++) {
    try {
      const res = await fetch(`${PROD_URL}/`, { headers: { "Cache-Control": "no-cache" } });
      const body = await res.text();
      if (res.status === 200 && (!asset || body.includes(asset))) { log(`Smoke ok: ${PROD_URL}/ liefert 200${asset ? ` mit ${asset}` : ""}`); return; }
      log(`Smoke Versuch ${i}: Status ${res.status}${asset && !body.includes(asset) ? ", Asset noch nicht sichtbar" : ""}`);
    } catch (err) {
      log(`Smoke Versuch ${i}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  fail(`${PROD_URL}/ liefert nach dem Deploy nicht den neuen Build. Live-Stand prüfen, ggf. restoreSiteDeploy.`);
}

main().catch((err) => fail(err.stack || String(err)));
