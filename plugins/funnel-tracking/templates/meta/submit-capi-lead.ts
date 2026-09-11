// Ausschnitt für die Submit-Function: Lead per CAPI, dedupliziert gegen den Browser-Pixel.
// Import: import { capiAllowed, ctxFromEnv, hashEmail, hashExternalId, hashName, hashPhone, sendCapiEvent } from './_lib/capi'
// Einsetzen NACH dem gelungenen Schreiben in den Lead-Store (Airtable o. ä.), VOR dem 200.
// Der Browser schickt event_id (newEventId("lead")), tracking_consent, fbp, fbc, session_id, source_url mit.
// Platzhalter: {{CONTENT_NAME}}, {{LEAD_VALUE}} (geschätzter Wert je Lead in EUR).

import { capiAllowed, ctxFromEnv, hashEmail, hashExternalId, hashName, hashPhone, sendCapiEvent } from './capi'

interface LeadBody {
  email: string
  vorname: string
  nachname: string
  session_id?: string
  fbp?: string | null
  fbc?: string | null
  event_id?: string
  tracking_consent?: boolean
  source_url?: string
}

export async function sendLeadToCapi(body: LeadBody, phoneE164: string, unqualified: boolean, headers: Record<string, string | undefined>) {
  // CAPI am Consent-Schalter (capiAllowed, Server-Pendant zum Pixel) und nur für echte
  // Leads. Duplikate und DQs zählen nicht als Conversion, sonst optimiert Meta auf
  // Leads, die nie ausgeliefert werden.
  const consentForTracking = capiAllowed(body.tracking_consent)
  const eventId = body.event_id
  if (!consentForTracking || !eventId || unqualified) return
  const ctx = ctxFromEnv()
  if (!ctx) return
  await sendCapiEvent(ctx, {
    event_name: 'Lead',
    event_id: eventId,
    event_source_url: body.source_url,
    user_data: {
      em: [hashEmail(body.email)].filter(Boolean) as string[],
      ph: [hashPhone(phoneE164)].filter(Boolean) as string[],
      fn: [hashName(body.vorname)].filter(Boolean) as string[],
      ln: [hashName(body.nachname)].filter(Boolean) as string[],
      external_id: [hashExternalId(body.session_id)].filter(Boolean) as string[],
      fbp: body.fbp || undefined,
      fbc: body.fbc || undefined,
      client_ip_address: headers['x-forwarded-for']?.split(',')[0]?.trim(),
      client_user_agent: headers['user-agent'],
    },
    custom_data: {
      value: Number('{{LEAD_VALUE}}'),
      currency: 'EUR',
      content_name: '{{CONTENT_NAME}}',
    },
  }).catch((err) => console.error('CAPI-Send fehlgeschlagen', err))
}
