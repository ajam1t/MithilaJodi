import type { NextRequest } from 'next/server'
import { computeBabyNames } from '@/lib/astrology/babyNames'
import { singlePersonRequestSchema } from '@/lib/astrology/schema'
import { astrologyPost } from '@/lib/astrology/server/handler'

export const runtime = 'nodejs'

/** POST /api/astrology/baby-names — public, no login, nothing stored. */
export function POST(request: NextRequest) {
  return astrologyPost(request, 'baby-names', singlePersonRequestSchema, computeBabyNames)
}
