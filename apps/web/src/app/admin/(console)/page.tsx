'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Stats = {
  pending_photos: number
  pending_profiles: number
  open_reports: number
  unresolved_flags: number
  active_memberships: number
  total_accounts: number
}

function StatCard({ label, value, href, warn }: { label: string; value: number; href: string; warn?: boolean }) {
  return (
    <Link href={href} className="card p-5 flex flex-col gap-1 hover:shadow-mj-sm transition-shadow">
      <span className={`text-3xl font-bold ${warn && value > 0 ? 'text-maroon' : 'text-ink'}`}>
        {value}
      </span>
      <span className="text-sm text-ink-soft">{label}</span>
    </Link>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(j => { if (j.ok) setStats(j.stats); else setError(j.message ?? 'Failed') })
      .catch(() => setError('Could not load stats'))
  }, [])

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="font-serif text-2xl text-ink mb-6">Dashboard</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-24 bg-paper-3" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Pending photos" value={stats.pending_photos} href="/admin/photos" warn />
          <StatCard label="Pending profiles" value={stats.pending_profiles} href="/admin/profiles" warn />
          <StatCard label="Open reports" value={stats.open_reports} href="/admin/reports" warn />
          <StatCard label="Unresolved flags" value={stats.unresolved_flags} href="/admin/flags" warn />
          <StatCard label="Active memberships" value={stats.active_memberships} href="/admin/config" />
          <StatCard label="Total accounts" value={stats.total_accounts} href="/admin/accounts" />
        </div>
      )}
    </div>
  )
}
