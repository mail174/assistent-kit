// Basic-Auth vor der ganzen Seite. Passwort kommt aus der Netlify-Env (MV_PASSWORD),
// steht bewusst nicht im Code, sonst liegt es in jedem Fork und jedem Backup.
export default async (request: Request) => {
  const expected = Netlify.env.get("MV_PASSWORD");
  if (!expected) {
    return new Response(
      "MV_PASSWORD ist nicht gesetzt. netlify env:set MV_PASSWORD \"<passwort>\"",
      { status: 500 },
    );
  }
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      if (decoded.slice(decoded.indexOf(":") + 1) === expected) return;
    } catch (_) {}
  }
  return new Response("Passwort erforderlich", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Master Vision", charset="UTF-8"' },
  });
};

export const config = { path: "/*" };
