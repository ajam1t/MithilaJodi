'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui'
import { WhatsAppOptIn } from '@/components/whatsapp/WhatsAppConnect'

type Consent = {
  type: string
  version: string
  consented: boolean
  created_at: string
  withdrawn_at: string | null
}

const CONSENT_LABELS: Record<string, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  data_processing: 'Data Processing',
  marketing: 'Marketing Communications',
  third_party_sharing: 'Third-Party Sharing',
}

const REQUIRED_TYPES = ['terms', 'privacy', 'data_processing']

function latestByType(consents: Consent[]): Map<string, Consent> {
  const map = new Map<string, Consent>()
  for (const c of consents) {
    if (!map.has(c.type)) map.set(c.type, c)
  }
  return map
}

export default function SettingsContent() {
  const router = useRouter()
  const toast = useToast()
  const [consents, setConsents] = useState<Consent[]>([])
  const [loadingConsents, setLoadingConsents] = useState(true)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const [withdrawMsg, setWithdrawMsg] = useState<Record<string, string>>({})
  const [pwCurrent, setPwCurrent]       = useState('')
  const [pwNew, setPwNew]               = useState('')
  const [pwConfirm, setPwConfirm]       = useState('')
  const [pwShowCurrent, setPwShowCurrent] = useState(false)
  const [pwShowNew, setPwShowNew]       = useState(false)
  const [pwLoading, setPwLoading]       = useState(false)
  const [pwError, setPwError]           = useState('')
  const [pwSuccess, setPwSuccess]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetch('/api/legal/consents')
      .then(r => r.json())
      .then(j => { if (j.ok) setConsents(j.consents) })
      .finally(() => setLoadingConsents(false))
  }, [])

  async function withdraw(type: string) {
    setWithdrawing(type)
    const res = await fetch('/api/legal/consents/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    const json = await res.json()
    if (json.ok) {
      setConsents(cs => cs.map(c => c.type === type && c.consented && !c.withdrawn_at
        ? { ...c, withdrawn_at: new Date().toISOString() }
        : c
      ))
      setWithdrawMsg(m => ({ ...m, [type]: 'Consent withdrawn.' }))
    } else {
      setWithdrawMsg(m => ({ ...m, [type]: json.message ?? 'Error withdrawing consent.' }))
    }
    setWithdrawing(null)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!pwCurrent) { setPwError('Enter your current password'); return }
    if (pwNew.length < 8) { setPwError('New password must be at least 8 characters'); return }
    if (pwNew !== pwConfirm) { setPwError('New passwords do not match'); return }
    setPwError('')
    setPwSuccess(false)
    setPwLoading(true)
    try {
      const res = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      })
      const json = await res.json()
      if (!json.ok) { setPwError(json.message ?? 'Could not change password. Please try again.'); return }
      setPwSuccess(true)
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
    } catch {
      setPwError('Network error. Please try again.')
    } finally {
      setPwLoading(false)
    }
  }

  async function requestExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export', { method: 'POST' })
      if (!res.ok) { toast('Export failed. Please try again.', { type: 'error' }); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mithila-jodi-data-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Export failed. Please check your connection and try again.', { type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  async function deleteAccount() {
    if (deleteText !== 'DELETE') { setDeleteError('Please type DELETE to confirm.'); return }
    setDeleting(true)
    setDeleteError('')
    const res = await fetch('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    })
    const json = await res.json()
    if (json.ok) {
      router.push('/login?deactivated=1')
    } else {
      setDeleteError(json.message ?? 'Could not deactivate account. Please try again.')
      setDeleting(false)
    }
  }

  const byType = latestByType(consents)

  return (
    <div className="wrap py-8 max-w-2xl">
      <h1 className="font-serif text-2xl text-ink mb-8">Account Settings</h1>

      {/* Consents */}
      <section className="card p-6 mb-6">
        <h2 className="font-serif text-lg text-ink mb-1">My Consents</h2>
        <p className="text-xs text-ink-soft mb-5">
          Required consents cannot be withdrawn. You may withdraw optional consents at any time.
        </p>

        {loadingConsents ? (
          <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(CONSENT_LABELS).map(([type, label]) => {
              const c = byType.get(type)
              const active = c?.consented && !c.withdrawn_at
              const required = REQUIRED_TYPES.includes(type)
              return (
                <div key={type} className="flex items-center justify-between gap-4 py-2 border-b border-paper-3 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{label}</p>
                    <p className="text-xs text-ink-soft">
                      {active
                        ? `Consented ${new Date(c!.created_at).toLocaleDateString('en-IN')}`
                        : c?.withdrawn_at
                          ? `Withdrawn ${new Date(c.withdrawn_at).toLocaleDateString('en-IN')}`
                          : 'Not consented'}
                    </p>
                    {withdrawMsg[type] && <p className="text-xs text-maroon mt-0.5">{withdrawMsg[type]}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-success-soft text-success-fg' : 'bg-paper-3 text-ink-soft'}`}>
                      {active ? 'Active' : c?.withdrawn_at ? 'Withdrawn' : 'None'}
                    </span>
                    {!required && active && (
                      <button
                        type="button"
                        onClick={() => withdraw(type)}
                        disabled={withdrawing === type}
                        className="text-xs text-terra hover:underline disabled:opacity-50"
                      >
                        {withdrawing === type ? 'Withdrawing…' : 'Withdraw'}
                      </button>
                    )}
                    {required && (
                      <span className="text-xs text-ink-soft italic">Required</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-paper-3">
          <p className="text-xs text-ink-soft">
            To review the documents you consented to, see our{' '}
            <Link href="/legal/terms" target="_blank" className="text-maroon hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" target="_blank" className="text-maroon hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </section>

      {/* WhatsApp sharing */}
      <section className="card p-6 mb-6">
        <h2 className="font-serif text-lg text-ink mb-1">WhatsApp</h2>
        <p className="text-sm text-ink-soft mb-4">
          Control whether matched members may request your WhatsApp.
        </p>
        <WhatsAppOptIn />
      </section>

      {/* Change Password */}
      <section className="card p-6 mb-6">
        <h2 className="font-serif text-lg text-ink mb-1">Change Password</h2>
        <p className="text-sm text-ink-soft mb-5">
          Don&apos;t have a password yet?{' '}
          <Link href="/forgot-password" className="text-maroon hover:underline">Use forgot password</Link> to set one.
        </p>
        <form onSubmit={changePassword} noValidate className="space-y-4 max-w-sm">
          <label className="block">
            <span className="text-sm font-medium text-ink">Current password</span>
            <div className="mt-1.5 relative">
              <input
                type={pwShowCurrent ? 'text' : 'password'}
                value={pwCurrent} autoComplete="current-password"
                onChange={e => { setPwError(''); setPwSuccess(false); setPwCurrent(e.target.value) }}
                className="block w-full px-4 py-2.5 pr-12 border border-ink/20 rounded-mj focus:ring-2 focus:ring-maroon/30 focus:outline-none bg-white text-ink text-sm"
              />
              <button type="button" onClick={() => setPwShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs">
                {pwShowCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">New password</span>
            <div className="mt-1.5 relative">
              <input
                type={pwShowNew ? 'text' : 'password'}
                value={pwNew} autoComplete="new-password"
                onChange={e => { setPwError(''); setPwSuccess(false); setPwNew(e.target.value) }}
                className="block w-full px-4 py-2.5 pr-12 border border-ink/20 rounded-mj focus:ring-2 focus:ring-maroon/30 focus:outline-none bg-white text-ink text-sm"
              />
              <button type="button" onClick={() => setPwShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs">
                {pwShowNew ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Confirm new password</span>
            <input
              type={pwShowNew ? 'text' : 'password'}
              value={pwConfirm} autoComplete="new-password"
              onChange={e => { setPwError(''); setPwSuccess(false); setPwConfirm(e.target.value) }}
              className="mt-1.5 block w-full px-4 py-2.5 border border-ink/20 rounded-mj focus:ring-2 focus:ring-maroon/30 focus:outline-none bg-white text-ink text-sm"
            />
          </label>
          {pwError   && <p className="text-sm text-terra">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-success-fg">Password changed successfully.</p>}
          <button type="submit" disabled={pwLoading} className="btn btn-primary text-sm py-2 px-5 disabled:opacity-60">
            {pwLoading ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* Data Export */}
      <section className="card p-6 mb-6">
        <h2 className="font-serif text-lg text-ink mb-1">Download My Data</h2>
        <p className="text-sm text-ink-soft mb-4 leading-relaxed">
          Under the Digital Personal Data Protection Act, 2023, you have the right to access your personal data. Download a copy of your data in JSON format.
        </p>
        <button
          type="button"
          onClick={requestExport}
          disabled={exporting}
          className="btn btn-secondary text-sm py-2 px-4 disabled:opacity-60"
        >
          {exporting ? 'Preparing export…' : 'Download my data'}
        </button>
      </section>

      {/* Account Deactivation */}
      <section className="card p-6 border-2 border-error/30">
        <h2 className="font-serif text-lg text-error-fg mb-1">Deactivate Account</h2>
        <p className="text-sm text-ink-soft mb-4 leading-relaxed">
          Deactivating your account will hide your profile and prevent you from logging in. Your data is retained per our{' '}
          <Link href="/legal/privacy" target="_blank" className="text-maroon hover:underline">Privacy Policy</Link>{' '}
          and is never deleted solely because your account is deactivated. This action can be reversed by contacting us.
        </p>

        {!deleteConfirm ? (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="text-sm text-error border border-error/40 rounded-mj-sm px-4 py-2 hover:bg-error-soft transition-colors"
          >
            Deactivate my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-error-fg">
              Are you sure? Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={e => { setDeleteError(''); setDeleteText(e.target.value) }}
              placeholder="Type DELETE"
              className="input w-full max-w-xs"
            />
            {deleteError && <p className="text-xs text-error">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
                className="text-sm bg-terra text-cream rounded-mj-sm px-4 py-2 hover:bg-maroon disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deactivating…' : 'Confirm deactivation'}
              </button>
              <button
                type="button"
                onClick={() => { setDeleteConfirm(false); setDeleteText(''); setDeleteError('') }}
                className="text-sm text-ink-soft hover:text-ink hover:underline px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
