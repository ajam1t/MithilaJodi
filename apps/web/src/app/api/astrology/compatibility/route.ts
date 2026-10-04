import type { NextRequest } from 'next/server'
import { computeCompatibility } from '@/lib/astrology/compatibility'
import { kundliMatchRequestSchema } from '@/lib/astrology/schema'
import { astrologyPost } from '@/lib/astrology/server/handler'

export const runtime = 'nodejs'

/** POST /api/astrology/compatibility — public, no login, nothing stored. */
export function POST(request: NextRequest) {
  return astrologyPost(request, 'compatibility', kundliMatchRequestSchema, computeCompatibility)
}
