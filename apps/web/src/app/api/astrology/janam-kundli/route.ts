import type { NextRequest } from 'next/server'
import { computeJanamKundli } from '@/lib/astrology/janamKundli'
import { janamKundliRequestSchema } from '@/lib/astrology/schema'
import { astrologyPost } from '@/lib/astrology/server/handler'

export const runtime = 'nodejs'

/** POST /api/astrology/janam-kundli — public, no login, nothing stored. */
export function POST(request: NextRequest) {
  return astrologyPost(request, 'janam-kundli', janamKundliRequestSchema, computeJanamKundli)
}
