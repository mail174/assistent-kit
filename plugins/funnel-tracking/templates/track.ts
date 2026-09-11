// CHANGELOG-PFLICHT: Jede deployte Änderung an diesem Funnel braucht vorher einen Eintrag in
// CHANGELOG.md. Deploy nur über `npm run deploy`, nie `netlify deploy --prod` direkt.
// Gilt für jeden Agenten und jedes LLM. Regeln: AGENTS.md.

/**
 * First-Party-Tracking für den Funnel {{FUNNEL}} (Vorlage aus dem Skill funnel-tracking). Sink ist `/.netlify/functions/q`
 * mit `funnel_name` als Diskriminator.
 *
 * Herkunft (seit 28.08.2026) als Touch-Historie: jeder Aufruf mit UTM-Parametern,
 * fbclid oder externem Referrer ist ein Touch. `first` wird nie überschrieben,
 * `last` ist der jüngste Touch, `touches` die Liste (max. 10). Ohne UTMs wird die
 * Quelle aus dem Referrer abgeleitet, ohne Referrer heißt sie "direkt".
 *
 * Speicher: sessionStorage für die laufende Sitzung. Über Sitzungen hinweg nur mit
 * Werbe-Consent (CookieYes-Kategorie advertisement) in einem First-Party-Cookie,
 * 90 Tage; Safari kappt JS-Cookies bei sieben Tagen, das ist bekannt.
 *
 * Jedes Event trägt die flachen utm_* des ersten Touches (Altformat, bleibt für die
 * Auswertung) plus first_touch und last_touch; der Lead-Payload zusätzlich touches.
 */

import { hasAdvertisingConsent } from "./consent";
import { metaCookies } from "../../lib/meta-pixel";

const FUNNEL = "{{FUNNEL}}";
const ENDPOINT = "/.netlify/functions/q";
const K_SESSION = "{{PREFIX}}_sid";
const K_TOUCHES = "{{PREFIX}}_touches";
const COOKIE = "{{PREFIX}}_touches";
const COOKIE_DAYS = 90;
const MAX_TOUCHES = 10;
const SAME_TOUCH_MS = 30 * 60_000;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export interface Touch {
  ts: string;
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  fbclid: string | null;
  referrer: string | null;
  landing: string;
}

interface TouchState {
  first: Touch;
  last: Touch;
  touches: Touch[];
}

function store(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private Mode */
  }
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readCookie(): TouchState | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(COOKIE.length + 1))) as TouchState;
    return parsed && parsed.first && Array.isArray(parsed.touches) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCookie(state: TouchState) {
  if (typeof document === "undefined" || !hasAdvertisingConsent()) return;
  try {
    const value = encodeURIComponent(JSON.stringify(state));
    if (value.length > 3500) return; // Cookie-Limit, dann bleibt es bei der Sitzung
    document.cookie = `${COOKIE}=${value}; path=/; max-age=${COOKIE_DAYS * 86_400}; samesite=lax`;
  } catch {
    /* egal */
  }
}

function sessionId(): string {
  let id = load<string>(K_SESSION, "");
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    store(K_SESSION, id);
  }
  return id;
}

/** Quelle aus dem Referrer, wenn keine UTMs mitkommen. */
export function sourceFromReferrer(referrer: string | null, fbclid: string | null): { source: string; medium: string | null } {
  if (fbclid) return { source: "meta", medium: "paid" };
  if (!referrer) return { source: "direkt", medium: null };
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return { source: "direkt", medium: null };
  }
  if (/facebook\.|instagram\.|fb\.com|l\.facebook/.test(host)) return { source: "meta", medium: "organic" };
  if (/google\./.test(host)) return { source: "google", medium: "organic" };
  if (/bing\./.test(host)) return { source: "bing", medium: "organic" };
  if (/linkedin\./.test(host)) return { source: "linkedin", medium: "organic" };
  if (/tiktok\./.test(host)) return { source: "tiktok", medium: "organic" };
  if (/youtube\.|youtu\.be/.test(host)) return { source: "youtube", medium: "organic" };
  return { source: host, medium: "referral" };
}

/** Touch aus URL und Referrer. null, wenn nichts Neues dran ist (interne Navigation). */
export function touchFromLocation(href: string, referrer: string, now: Date = new Date()): Touch | null {
  const url = new URL(href);
  const p = url.searchParams;
  const utm: Record<string, string | null> = {};
  for (const k of UTM_KEYS) utm[k] = p.get(k);
  const fbclid = p.get("fbclid");
  let external: string | null = null;
  try {
    if (referrer && new URL(referrer).origin !== url.origin) external = referrer;
  } catch {
    external = null;
  }
  const hasSignal = Boolean(utm.utm_source || utm.utm_campaign || utm.utm_content || fbclid || external);
  if (!hasSignal) return null;
  const derived = sourceFromReferrer(external, fbclid);
  return {
    ts: now.toISOString(),
    source: utm.utm_source ?? derived.source,
    medium: utm.utm_medium ?? derived.medium,
    campaign: utm.utm_campaign,
    content: utm.utm_content,
    term: utm.utm_term,
    fbclid,
    referrer: external,
    landing: url.pathname,
  };
}

function directTouch(href: string, now: Date): Touch {
  return { ts: now.toISOString(), source: "direkt", medium: null, campaign: null, content: null, term: null, fbclid: null, referrer: null, landing: new URL(href).pathname };
}

function sameTouch(a: Touch, b: Touch): boolean {
  return a.source === b.source && a.campaign === b.campaign && a.content === b.content && a.fbclid === b.fbclid;
}

/** Reine Zustandsübergang: neuer Touch rein, Dubletten innerhalb 30 Minuten raus. */
export function addTouch(state: TouchState | null, touch: Touch | null, href: string, now: Date = new Date()): TouchState {
  if (!state) {
    const first = touch ?? directTouch(href, now);
    return { first, last: first, touches: [first] };
  }
  if (!touch) return state;
  const prev = state.touches[state.touches.length - 1];
  if (prev && sameTouch(prev, touch) && Date.parse(touch.ts) - Date.parse(prev.ts) < SAME_TOUCH_MS) return state;
  const touches = [...state.touches, touch].slice(-MAX_TOUCHES);
  return { first: state.first, last: touch, touches };
}

let state: TouchState | null = null;
let initialised = false;

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  sessionId();
  const stored = load<TouchState | null>(K_TOUCHES, null) ?? readCookie();
  const touch = touchFromLocation(window.location.href, document.referrer);
  state = addTouch(stored, touch, window.location.href);
  store(K_TOUCHES, state);
  writeCookie(state);
}

function touches(): TouchState {
  init();
  if (!state) state = addTouch(null, null, typeof window !== "undefined" ? window.location.href : "https://x/", new Date());
  return state;
}

/** Flache utm_* des ersten Touches, Altformat für Store und Airtable. */
function utmFlat(t: Touch): Record<string, string> {
  const out: Record<string, string> = {};
  if (t.source) out.utm_source = t.source;
  if (t.medium) out.utm_medium = t.medium;
  if (t.campaign) out.utm_campaign = t.campaign;
  if (t.content) out.utm_content = t.content;
  if (t.term) out.utm_term = t.term;
  return out;
}

const recent = new Map<string, number>();
const DEBOUNCE_MS = 600;

interface EventOpts {
  step_slug?: string;
  step_number?: number;
  meta?: Record<string, unknown>;
}

function event(type: string, opts: EventOpts = {}) {
  if (typeof window === "undefined") return;
  init();

  const key = `${type}#${opts.step_slug ?? ""}#${opts.step_number ?? ""}`;
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < DEBOUNCE_MS) return; // React StrictMode feuert doppelt
  recent.set(key, now);

  const t = touches();
  const payload = {
    funnel_name: FUNNEL,
    session_id: sessionId(),
    event_type: type,
    step_number: opts.step_number ?? null,
    step_label: opts.step_slug ?? null,
    metadata: {
      ...(opts.meta ?? {}),
      ...utmFlat(t.first),
      first_touch: t.first,
      last_touch: t.last,
      touch_count: t.touches.length,
      // Die ganze Liste nur am Lead, damit die Events klein bleiben.
      ...(type === "lead_submit" ? { touches: t.touches } : {}),
      // _fbp/_fbc des Pixels, damit der Server sie ins CAPI legen kann (Match-Qualität).
      ...metaCookies(document.cookie),
      path: window.location.pathname,
    },
  };

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fällt auf fetch zurück */
  }
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/** Attribution für den Lead-Payload: erster Touch flach, dazu first, last und die Liste. */
function attribution() {
  const t = touches();
  return {
    session_id: sessionId(),
    fbclid: t.first.fbclid ?? t.last.fbclid ?? null,
    ...metaCookies(document.cookie),
    ...utmFlat(t.first),
    utm_source_last: t.last.source,
    first_touch: t.first,
    last_touch: t.last,
    touches: t.touches,
  };
}

export const track = { event, attribution, sessionId, init, touches };
