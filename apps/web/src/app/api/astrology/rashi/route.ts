import type { NextRequest } from 'next/server'
import { computeRashi } from '@/lib/astrology/rashiReading'
import { singlePersonRequestSchema } from '@/lib/astrology/schema'
import { astrologyPost } from '@/lib/astrology/server/handler'

export const runtime = 'nodejs'

/** POST /api/astrology/rashi — public, no login, nothing stored. */
export function POST(request: NextRequest) {
  return astrologyPost(request, 'rashi', singlePersonRequestSchema, computeRashi)
}
