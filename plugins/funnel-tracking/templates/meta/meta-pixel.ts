// CHANGELOG-PFLICHT: Jede deployte Änderung an diesem Funnel braucht vorher einen Eintrag in
// CHANGELOG.md. Deploy nur über `npm run deploy`, nie `netlify deploy --prod` direkt.
// Gilt für jeden Agenten und jedes LLM. Regeln: AGENTS.md.

/**
 * Meta Pixel für die ganze Site: Base-Code, PageView je Route, Standard- und
 * Custom-Events mit event_id für die Dedup gegen das serverseitige CAPI.
 * Die Funnels rufen ihre Events über ihre eigene lib/pixel.ts hierher.
 *
 * Consent-Schalter VITE_META_CONSENT (Build-Env):
 *   "off"       Pixel lädt sofort, ohne Banner-Bindung. Je Repo bewusst entscheiden.
 *   "cookieyes" Meta Consent Mode: fbq("consent","revoke") vor init, "grant" sobald
 *               CookieYes die Kategorie advertisement bestätigt. Events vor dem
 *               Grant hält der Pixel selbst zurück.
 *
 * Die Pixel-ID steht als Konstante im Code. Eine fehlende Build-Env hat den Pixel
 * vorher still aus dem Bundle optimiert (Vite inlined undefined, Terser warf fbq weg).
 */

export const PIXEL_ID: string = (import.meta.env.VITE_META_PIXEL_ID as string | undefined) || "{{PIXEL_ID}}";

export type ConsentMode = "off" | "cookieyes";
export const CONSENT_MODE: ConsentMode = import.meta.env.VITE_META_CONSENT === "cookieyes" ? "cookieyes" : "off";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
  }
}

const CY_COOKIE = "cookieyes-consent";

function cookieValue(cookie: string, name: string): string | null {
  const raw = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return raw ? raw.slice(name.length + 1) : null;
}

/** CookieYes-Cookie: ist die Kategorie advertisement zugestimmt? */
export function cookieYesAdvertising(cookie: string): "granted" | "denied" | "unknown" {
  const raw = cookieValue(cookie, CY_COOKIE);
  if (!raw) return "unknown";
  const value = decodeURIComponent(raw);
  if (/advertisement\s*:\s*yes/i.test(value)) return "granted";
  if (/advertisement\s*:\s*no/i.test(value)) return "denied";
  return "unknown";
}

/** _fbp und _fbc, die der Pixel setzt. Gehen roh ins CAPI (Meta will sie ungehasht). */
export function metaCookies(cookie: string): { fbp: string | null; fbc: string | null } {
  return { fbp: cookieValue(cookie, "_fbp"), fbc: cookieValue(cookie, "_fbc") };
}

export function newEventId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${Date.now()}_${rand}`;
}

export interface MatchData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  external_id?: string;
}

/** Advanced-Matching-Daten so, wie der Pixel sie vor dem Hashen erwartet. */
export function normalizeMatch(d: MatchData): Record<string, string> {
  const out: Record<string, string> = {};
  const em = d.em?.trim().toLowerCase();
  const ph = d.ph?.replace(/\D/g, "");
  const fn = d.fn?.trim().toLowerCase();
  const ln = d.ln?.trim().toLowerCase();
  if (em) out.em = em;
  if (ph) out.ph = ph;
  if (fn) out.fn = fn;
  if (ln) out.ln = ln;
  if (d.external_id) out.external_id = d.external_id;
  return out;
}

let injected = false;
let granted = CONSENT_MODE === "off";

/** Darf der Server das CAPI-Pendant schicken? Bei "off" immer, sonst nur nach Grant. */
export function isActive(): boolean {
  return granted;
}

function grant() {
  if (granted) return;
  granted = true;
  window.fbq?.("consent", "grant");
}

function inject() {
  if (window.fbq) return;
  /* eslint-disable */
  const f = window as any;
  const n: any = (f.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  });
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  /* eslint-enable */
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
}

export function ensurePixel(): void {
  if (typeof window === "undefined" || injected) return;
  injected = true;
  inject();
  if (CONSENT_MODE === "cookieyes") {
    granted = cookieYesAdvertising(document.cookie) === "granted";
    window.fbq?.("consent", granted ? "grant" : "revoke");
    const check = () => {
      if (cookieYesAdvertising(document.cookie) === "granted") grant();
    };
    document.addEventListener("cookieyes_consent_update", check);
    document.addEventListener("cookieyes_banner_load", check);
  }
  window.fbq?.("init", PIXEL_ID);
}

export function pageView(): void {
  ensurePixel();
  window.fbq?.("track", "PageView");
}

/** Standard-Event mit event_id. Rückgabe: darf der Server das CAPI-Pendant schicken? */
export function fbqTrack(event: string, params: Record<string, unknown>, eventId: string): boolean {
  ensurePixel();
  window.fbq?.("track", event, params, { eventID: eventId });
  return granted;
}

export function fbqCustom(event: string, params: Record<string, unknown>, eventId?: string): void {
  ensurePixel();
  window.fbq?.("trackCustom", event, params, eventId ? { eventID: eventId } : undefined);
}

/** Advanced Matching nachreichen (vor dem Lead): init mit Nutzerdaten, der Pixel hasht selbst. */
export function advancedMatch(d: MatchData): void {
  ensurePixel();
  const data = normalizeMatch(d);
  if (Object.keys(data).length) window.fbq?.("init", PIXEL_ID, data);
}
