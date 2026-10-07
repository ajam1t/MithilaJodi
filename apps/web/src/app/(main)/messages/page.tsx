import { redirect } from 'next/navigation'

/** The conversation list is the Inbox's Messages tab; threads stay at /messages/[id]. */
export default function MessagesRedirect() {
  redirect('/inbox')
}
