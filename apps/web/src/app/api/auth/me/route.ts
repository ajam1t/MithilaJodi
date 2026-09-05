import { NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'

export async function GET() {
  const account = await getSessionAccount()
  if (!account) {
    // 200, not 401: this endpoint answers "who is signed in", and "nobody" is a
    // valid answer. Returning 401 made every logged-out visitor generate a console
    // error on the homepage. Callers already branch on `ok`.
    return NextResponse.json({ ok: false, account: null })
  }
  return NextResponse.json({
    ok: true,
    account: {
      id: account.id,
      mobile: account.mobile,
      role: account.role,
    },
  })
}
