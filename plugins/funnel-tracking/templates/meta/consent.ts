/**
 * Consent-Status aus CookieYes lesen (die Site lädt den Banner in index.html).
 *
 * Schalter VITE_META_CONSENT (src/lib/meta-pixel.ts): bei "off" gilt Werbe-Consent
 * als erteilt, Pixel, CAPI und Touch-Cookie laufen ohne Banner-Bindung. Diese
 * Entscheidung trifft der Betreiber bewusst, nicht der Agent. Bei "cookieyes"
 * zählt nur die Kategorie advertisement,
 * und serverseitiges CAPI folgt demselben Flag: derselbe Zweck, anderer Transportweg.
 *
 * Wichtig zu unterscheiden: die Consent-Checkbox im Kontakt-Schritt ist die
 * Einwilligung zur KONTAKTAUFNAHME durch den Anbieter. Sie ersetzt die
 * Marketing-Cookie-Einwilligung nicht und wird hier bewusst nicht dafür benutzt.
 */

import { CONSENT_MODE, cookieYesAdvertising } from "../../lib/meta-pixel";

export type ConsentState = "granted" | "denied" | "unknown";

export function advertisingConsent(): ConsentState {
  if (typeof document === "undefined") return "unknown";
  return cookieYesAdvertising(document.cookie);
}

export function hasAdvertisingConsent(): boolean {
  if (CONSENT_MODE === "off") return true;
  return advertisingConsent() === "granted";
}
