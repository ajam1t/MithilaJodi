import type { NextRequest } from 'next/server'
import { computeNakshatra } from '@/lib/astrology/nakshatraReading'
import { singlePersonRequestSchema } from '@/lib/astrology/schema'
import { astrologyPost } from '@/lib/astrology/server/handler'

export const runtime = 'nodejs'

/** POST /api/astrology/nakshatra — public, no login, nothing stored. Same single-person input as Janam Kundli. */
export function POST(request: NextRequest) {
  return astrologyPost(request, 'nakshatra', singlePersonRequestSchema, computeNakshatra)
}
