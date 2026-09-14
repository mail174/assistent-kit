// A/B-Experiment-Konfiguration in den Store spiegeln, gleiches Muster wie die
// Changelog- und Manifest-Rows in deploy.mjs: session_id "__changelog__",
// event_type "experiment_config", Nutzdaten in metadata, Idempotenz ueber
// metadata.key. Der Key haengt am Inhalt: jede Konfig-Aenderung (auch nur der
// Status) ergibt eine neue Row, der juengste Stand je Experiment-Id gilt.

import { createHash } from "node:crypto";
import { join } from "node:path";

/** EXPERIMENT aus der TS-Config lesen, wie buildManifests ueber esbuild. */
export async function loadExperiment(root, entry) {
  const esbuild = await import("esbuild");
  const r = await esbuild.build({
    entryPoints: [join(root, entry)],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    logLevel: "silent",
  });
  const mod = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));
  return mod.EXPERIMENT ?? null;
}

export function experimentRows(funnel, exp, { deployId, commit, createdAt }) {
  if (!exp) return [];
  // Feste Feld-Reihenfolge, damit der Hash nur bei echten Aenderungen kippt.
  const core = {
    id: exp.id,
    name: exp.name,
    hypothesis: exp.hypothesis ?? null,
    arms: { a: exp.arms.a, b: exp.arms.b },
    start: exp.start,
    target_per_arm: exp.targetPerArm,
    mde_relative: exp.mdeRelative,
    status: exp.status,
  };
  const hash = createHash("sha1").update(JSON.stringify(core)).digest("hex").slice(0, 12);
  // Funnel gehoert in den Key, sonst deduppt sink() die Rows mehrerer Funnel mit derselben
  // Experiment-Id gegeneinander weg (wie manifest|<deploy>|<funnel> und der Changelog-Key).
  const key = `experiment|${funnel}|${exp.id}|${hash}`;
  return [
    {
      event_type: "experiment_config",
      funnel,
      key,
      step_label: exp.id,
      created_at: createdAt,
      metadata: { key, ...core, deploy_id: deployId, commit, author: "deploy.mjs" },
    },
  ];
}
