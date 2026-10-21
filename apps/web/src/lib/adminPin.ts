import 'server-only'
import bcrypt from 'bcryptjs'
import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/*
 * The Command Centre PIN — a step before the admin password, checked on the
 * server. Passing it sets a short-lived signed cookie (scoped to the admin
 * auth API); POST /api/admin/auth/login refuses to check a password without
 * it, so the PIN cannot be skipped by editing the page.
 *
 * The PIN is ADMIN_LOGIN_PIN (Vercel env) when set; otherwise the built-in one,
 * stored here only as a bcrypt hash. Change it by setting ADMIN_LOGIN_PIN.
 */

const BUILT_IN_PIN_HASH = '$2a$12$HVEWvWcSYTbmV.Ymybr5gekjFGyM6GUL607fjebTy3609rz82Dn32'
export const PIN_COOKIE = 'mj_admin_pin'
export const PIN_TTL_SECONDS = 10 * 60

export async function checkPin(pin: string): Promise<boolean> {
  if (!/^\d{4,8}$/.test(pin)) return false
  const configured = process.env.ADMIN_LOGIN_PIN?.trim()
  if (configured) {
    const a = Buffer.from(pin), b = Buffer.from(configured)
    return a.length === b.length && timingSafeEqual(a, b)
  }
  return bcrypt.compare(pin, BUILT_IN_PIN_HASH)
}

function key(): string {
  // Any server-only secret works; the service-role key never leaves the server.
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('No server secret configured')
  return createHmac('sha256', secret).update('mj-admin-pin-v1').digest('hex')
}

/** A cookie value proving the PIN was entered, valid for PIN_TTL_SECONDS. */
export function pinPassToken(): string {
  const exp = Math.floor(Date.now() / 1000) + PIN_TTL_SECONDS
  const sig = createHmac('sha256', key()).update(String(exp)).digest('base64url')
  return `${exp}.${sig}`
}

export function hasPinPass(request: NextRequest): boolean {
  const raw = request.cookies.get(PIN_COOKIE)?.value
  if (!raw) return false
  const [expStr, sig] = raw.split('.')
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Date.now() / 1000 || !sig) return false
  const want = createHmac('sha256', key()).update(expStr).digest('base64url')
  const a = Buffer.from(sig), b = Buffer.from(want)
  return a.length === b.length && timingSafeEqual(a, b)
}
