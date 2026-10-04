import type { NextRequest } from 'next/server'
import { computeManglik } from '@/lib/astrology/manglikReading'
import { singlePersonRequestSchema } from '@/lib/astrology/schema'
import { astrologyPost } from '@/lib/astrology/server/handler'

export const runtime = 'nodejs'

/** POST /api/astrology/manglik — public, no login, nothing stored. */
export function POST(request: NextRequest) {
  return astrologyPost(request, 'manglik', singlePersonRequestSchema, computeManglik)
}
