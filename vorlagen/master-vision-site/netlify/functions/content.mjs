import { getStore } from "@netlify/blobs";

// Der Inhalt der Vision liegt im Blob, nicht in der HTML-Datei. Damit ist die Seite
// vom Handy editierbar, ohne Deploy. Achtung: sobald hier etwas liegt, ueberdeckt es
// beim Laden das statische <main>. Ein Deploy allein aendert also nichts mehr an dem,
// was der Nutzer sieht. Nach jedem Deploy den Blob mitschreiben.
function authorized(req) {
  const expected = process.env.MV_PASSWORD;
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    return decoded.slice(decoded.indexOf(":") + 1) === expected;
  } catch (_) {
    return false;
  }
}

export default async (req) => {
  if (!authorized(req)) {
    return new Response("Passwort erforderlich", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Master Vision", charset="UTF-8"' },
    });
  }

  const store = getStore("master-vision");
  const key = req.headers.get("x-selftest") ? "selftest" : "current";

  if (req.method === "GET") {
    const html = await store.get(key);
    return new Response(html ?? "", {
      status: html == null ? 404 : 200,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  if (req.method === "PUT" || req.method === "POST") {
    const body = await req.text();
    if (!body || body.length > 2_000_000) return new Response("Bad body", { status: 400 });
    // Erstes Speichern des Tages sichert den Vorstand als backup-YYYY-MM-DD.
    if (key === "current") {
      const today = new Date().toISOString().slice(0, 10);
      const backupKey = `backup-${today}`;
      if ((await store.get(backupKey)) == null) {
        const current = await store.get("current");
        if (current) await store.set(backupKey, current);
      }
    }
    await store.set(key, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};
