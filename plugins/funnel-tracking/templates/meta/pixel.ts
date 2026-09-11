import { hasAdvertisingConsent } from "./consent";
import { advancedMatch, fbqCustom, fbqTrack, newEventId, type MatchData } from "../../lib/meta-pixel";

/**
 * Meta-Events des {{FUNNEL}}-Funnels. Base-Code, PageView und Consent-Schalter
 * liegen site-weit in src/lib/meta-pixel.ts; hier nur die Aufrufe mit event_id
 * für die Dedup gegen das serverseitige CAPI.
 */

export { newEventId };

/** Darf getrackt werden? Bei Schalter "off" immer, sonst nur mit CookieYes-Werbe-Consent. */
export function pixelAllowed(): boolean {
  return hasAdvertisingConsent();
}

/** Standard-Event. Rückgabe false: der Server soll das CAPI-Pendant ebenfalls lassen. */
export function trackStandard(event: string, params: Record<string, unknown>, eventId: string): boolean {
  if (!pixelAllowed()) return false;
  return fbqTrack(event, params, eventId);
}

const customFired = new Set<string>();

/**
 * Custom-Event für Audiences (Schritte, DQ). Kein CAPI-Pendant, deshalb keine event_id.
 * Einmal je Inhalt und Seitenaufruf: der Pixel Helper meldete am 28.08.2026 dreifache
 * FunnelStep-Events mit gleichen Daten, ein zweites Mal derselbe Schritt bringt Meta nichts.
 */
export function trackCustom(event: string, params: Record<string, unknown>): void {
  if (!pixelAllowed()) return;
  const key = `${event}#${JSON.stringify(params)}`;
  if (customFired.has(key)) return;
  customFired.add(key);
  fbqCustom(event, params);
}

/** Advanced Matching vor dem Lead: der Pixel hasht selbst. */
export function matchLead(data: MatchData): void {
  if (!pixelAllowed()) return;
  advancedMatch(data);
}
