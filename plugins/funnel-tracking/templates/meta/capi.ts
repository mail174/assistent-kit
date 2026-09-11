import { createHash } from 'crypto'

const GRAPH_VERSION = 'v21.0'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export interface CapiUserData {
  em?: string[]
  ph?: string[]
  fn?: string[]
  ln?: string[]
  fbp?: string
  fbc?: string
  external_id?: string[]
  client_ip_address?: string
  client_user_agent?: string
}

export interface CapiSendOptions {
  event_name: string
  event_id: string
  event_time?: number
  action_source?: 'website' | 'app' | 'phone_call' | 'chat' | 'email' | 'physical_store' | 'system_generated' | 'other'
  event_source_url?: string
  user_data: CapiUserData
  custom_data?: Record<string, unknown>
}

export interface CapiContext {
  pixel_id: string
  access_token: string
  test_event_code?: string
}

export function ctxFromEnv(): CapiContext | null {
  const pixel_id = process.env.META_PIXEL_ID
  const access_token = process.env.META_CAPI_TOKEN
  if (!pixel_id || !access_token) return null
  return {
    pixel_id,
    access_token,
    test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
  }
}

/**
 * Consent-Schalter für CAPI, Server-Pendant zu VITE_META_CONSENT im Browser.
 * META_CONSENT_MODE "client": nur senden, wenn der Browser tracking_consent=true meldet.
 * Ungesetzt oder "off": immer senden. Je Repo bewusst entscheiden.
 */
export function capiAllowed(clientFlag: boolean | undefined, mode = process.env.META_CONSENT_MODE): boolean {
  return mode === 'client' ? Boolean(clientFlag) : true
}

export function hashEmail(v?: string | null): string | undefined {
  if (!v) return undefined
  return sha256(v)
}

export function hashPhone(v?: string | null): string | undefined {
  if (!v) return undefined
  return sha256(v.replace(/[\s()\-]/g, ''))
}

export function hashName(v?: string | null): string | undefined {
  if (!v) return undefined
  return sha256(v)
}

export function hashExternalId(session_id?: string | null): string | undefined {
  if (!session_id) return undefined
  return sha256(session_id)
}

export async function sendCapiEvent(
  ctx: CapiContext,
  ev: CapiSendOptions,
): Promise<{ ok: boolean; status: number; body: string }> {
  const payload = {
    data: [{
      event_name: ev.event_name,
      event_time: ev.event_time ?? Math.floor(Date.now() / 1000),
      event_id: ev.event_id,
      action_source: ev.action_source ?? 'website',
      event_source_url: ev.event_source_url,
      user_data: ev.user_data,
      custom_data: ev.custom_data,
    }],
    ...(ctx.test_event_code ? { test_event_code: ctx.test_event_code } : {}),
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${ctx.pixel_id}/events?access_token=${encodeURIComponent(ctx.access_token)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error('CAPI send failed:', res.status, text.slice(0, 500))
  }
  return { ok: res.ok, status: res.status, body: text }
}
