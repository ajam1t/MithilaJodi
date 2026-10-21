import 'server-only'
import { NextRequest } from 'next/server'
import { cancelRequest, decideRequest } from '@/lib/memberRequests'

type RouteContext = { params: Promise<{ id: string }> }

/** The owner answers: { action: 'approve' | 'decline' | 'revoke' }. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  return decideRequest('contact', id, request)
}

/** The requester cancels a request that is still waiting. */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  return cancelRequest('contact', id)
}
