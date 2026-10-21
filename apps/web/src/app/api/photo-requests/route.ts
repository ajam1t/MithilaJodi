import 'server-only'
import { NextRequest } from 'next/server'
import { createRequest, listRequests } from '@/lib/memberRequests'

/*
 * Photo requests — the rules live in lib/memberRequests.ts.
 *   GET  ?box=received|sent   the signed-in member's requests
 *   POST { owner_profile_id } ask
 */

export async function GET(request: NextRequest) {
  return listRequests('photo', request)
}

export async function POST(request: NextRequest) {
  return createRequest('photo', request)
}
