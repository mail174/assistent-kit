// @vitest-environment node
// esbuild (loadExperiment) verweigert die jsdom-Umgebung, weil deren
// TextEncoder Uint8Arrays aus einem fremden Realm liefert.

import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { experimentRows, loadExperiment } from "./experiment-lib.mjs";

const EXP = {
  id: "2026-09-test",
  name: "Testlauf",
  hypothesis: "B hebt die CR",
  arms: { a: "Kontrolle", b: "Variante" },
  start: "2026-09-01",
  targetPerArm: 400,
  mdeRelative: 0.25,
  status: "running",
};

const STAMP = { deployId: "6a91deadbeef0000", commit: "abc1234", createdAt: "2026-08-29T12:00:00.000Z" };

describe("experimentRows", () => {
  it("liefert ohne Experiment keine Rows", () => {
    expect(experimentRows("vertrieb", null, STAMP)).toEqual([]);
  });

  it("baut eine experiment_config-Row im __changelog__-Muster", () => {
    const [row] = experimentRows("vertrieb", EXP, STAMP);
    expect(row.event_type).toBe("experiment_config");
    expect(row.funnel).toBe("vertrieb");
    expect(row.step_label).toBe("2026-09-test");
    expect(row.created_at).toBe(STAMP.createdAt);
    expect(row.metadata).toMatchObject({
      id: "2026-09-test",
      name: "Testlauf",
      hypothesis: "B hebt die CR",
      arms: { a: "Kontrolle", b: "Variante" },
      start: "2026-09-01",
      target_per_arm: 400,
      mde_relative: 0.25,
      status: "running",
      deploy_id: "6a91deadbeef0000",
      commit: "abc1234",
    });
    expect(row.metadata.key).toBe(row.key);
  });

  it("haelt den Key bei gleicher Konfiguration stabil und aendert ihn bei jeder Aenderung", () => {
    const [a] = experimentRows("vertrieb", EXP, STAMP);
    const [b] = experimentRows("vertrieb", EXP, { ...STAMP, deployId: "anderer-deploy" });
    expect(a.key).toBe(b.key);
    const [c] = experimentRows("vertrieb", { ...EXP, status: "won_b" }, STAMP);
    expect(c.key).not.toBe(a.key);
  });
});

describe("loadExperiment", () => {
  it("buendelt eine Konfigurationsdatei und liefert EXPERIMENT", async () => {
    const dir = mkdtempSync(join(tmpdir(), "exp-"));
    writeFileSync(join(dir, "experiment.mjs"), "export const EXPERIMENT = { id: 'x-1', name: 'X', arms: { a: 'A', b: 'B' }, start: '2026-09-01', targetPerArm: 10, mdeRelative: 0.2, status: 'stopped' };\n");
    const exp = await loadExperiment(dir, "experiment.mjs");
    expect(exp).toMatchObject({ id: "x-1", status: "stopped" });
    writeFileSync(join(dir, "none.mjs"), "export const EXPERIMENT = null;\n");
    expect(await loadExperiment(dir, "none.mjs")).toBeNull();
  });
});
