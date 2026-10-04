import type { NextRequest } from 'next/server'
import { computeVivahMuhurat } from '@/lib/astrology/vivahMuhurat'
import { vivahMuhuratRequestSchema } from '@/lib/astrology/schema'
import { astrologyPost } from '@/lib/astrology/server/handler'

export const runtime = 'nodejs'

/** POST /api/astrology/vivah-muhurat — public, no login, nothing stored. */
export function POST(request: NextRequest) {
  return astrologyPost(request, 'vivah-muhurat', vivahMuhuratRequestSchema, computeVivahMuhurat)
}
