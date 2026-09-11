// Ausschnitt für den Event-Sink (q.ts): CAPI-Spiegel für Standard-Events.
// 1. Import:  import { ctxFromEnv, hashExternalId, sendCapiEvent } from './_lib/capi'
// 2. ALLOWED_EVENT_TYPES um 'contact_view' erweitern.
// 3. Konstante und Block unten einsetzen, der Block NACH dem gelungenen Insert, VOR dem Return.
//    Platzhalter: {{DOMAIN}} (Prod-Host für die Fallback-URL), {{CONTENT_NAME}}.

// Browser-Pixel und CAPI teilen sich die event_id (Dedup). Nur Events, die im Browser
// auch als Standard-Event feuern; lead_submit macht submit-*-lead.ts mit PII.
const CAPI_EVENT_MAP: Record<string, string> = {
  entry_view: 'ViewContent',
  contact_view: 'InitiateCheckout',
}

// ---- im Handler, nach insertEvent(row) ----
declare const body: { event_type: string; session_id: string; funnel_name: string; metadata?: Record<string, unknown> | null }
declare const event: { headers: Record<string, string | undefined> }
declare const ip: string | null
declare const ua: string | null

async function forwardToCapi() {
  const capiName = CAPI_EVENT_MAP[body.event_type]
  const meta = body.metadata ?? {}
  const eventId = meta.event_id
  if (capiName && typeof eventId === 'string') {
    const ctx = ctxFromEnv()
    if (ctx) {
      // Referer des Browsers, damit event_source_url dem entspricht, was der Pixel sah.
      const referer = event.headers['referer'] || event.headers['referrer']
      const path = typeof meta.path === 'string' ? meta.path : ''
      try {
        // await, sonst stirbt der Send mit der Function-Antwort.
        await sendCapiEvent(ctx, {
          event_name: capiName,
          event_id: eventId,
          event_source_url: referer || `https://{{DOMAIN}}${path}`,
          user_data: {
            fbp: typeof meta.fbp === 'string' ? meta.fbp : undefined,
            fbc: typeof meta.fbc === 'string' ? meta.fbc : undefined,
            external_id: [hashExternalId(body.session_id)].filter(Boolean) as string[],
            client_ip_address: ip || undefined,
            client_user_agent: ua || undefined,
          },
          custom_data: { content_name: '{{CONTENT_NAME}}', content_category: body.funnel_name },
        })
      } catch (err) {
        console.error('CAPI forward failed (non-fatal):', err)
      }
    }
  }
}

import { ctxFromEnv, hashExternalId, sendCapiEvent } from './capi'
export { forwardToCapi }
