'use client'

import { useState, useEffect } from 'react'

type Plan = {
  plan: string
  label_en: string
  label_mai: string | null
  price_paise: number
  duration_days: number
  grace_period_days: number
  is_active: boolean
}

export default function AdminConfigPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, Partial<Plan>>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, { ok: boolean; text: string }>>({})

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(j => { if (j.ok) setPlans(j.plans) })
      .finally(() => setLoading(false))
  }, [])

  function edit(plan: string, field: keyof Plan, val: string) {
    setEdits(prev => ({
      ...prev,
      [plan]: { ...prev[plan], [field]: field.includes('paise') || field.includes('days') ? parseInt(val, 10) : val },
    }))
  }

  async function save(plan: string) {
    const changes = edits[plan]
    if (!changes || Object.keys(changes).length === 0) return
    setSaving(plan)
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, ...changes }),
    })
    const json = await res.json()
    setMessages(m => ({ ...m, [plan]: { ok: json.ok, text: json.ok ? 'Saved.' : (json.message ?? 'Error') } }))
    if (json.ok) {
      setPlans(ps => ps.map(p => p.plan === plan ? { ...p, ...changes } as Plan : p))
      setEdits(e => { const next = { ...e }; delete next[plan]; return next })
    }
    setSaving(null)
  }

  const fieldVal = (plan: Plan, field: keyof Plan) =>
    (edits[plan.plan]?.[field] ?? plan[field]) as string | number

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="font-serif text-2xl text-ink mb-2">Plan Configuration</h1>
      <p className="text-xs text-ink-soft mb-6">
        Membership price and duration are managed here, not in code. Changes take effect for new payments immediately.
      </p>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : plans.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No active plans found.</div>
      ) : (
        <div className="space-y-5">
          {plans.map(plan => (
            <div key={plan.plan} className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">{plan.plan}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-paper-3 text-ink-soft'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="text-xs text-ink-soft">Label (English)</span>
                  <input
                    type="text"
                    value={fieldVal(plan, 'label_en') as string}
                    onChange={e => edit(plan.plan, 'label_en', e.target.value)}
                    className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon/50"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-soft">Label (Maithili)</span>
                  <input
                    type="text"
                    value={fieldVal(plan, 'label_mai') as string ?? ''}
                    onChange={e => edit(plan.plan, 'label_mai', e.target.value)}
                    className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon/50"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-soft">Price (paise)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={fieldVal(plan, 'price_paise') as number}
                      onChange={e => edit(plan.plan, 'price_paise', e.target.value)}
                      className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon/50"
                    />
                    <span className="text-xs text-ink-soft shrink-0">
                      = ₹{((fieldVal(plan, 'price_paise') as number) / 100).toFixed(0)}
                    </span>
                  </div>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-soft">Duration (days)</span>
                  <input
                    type="number"
                    min={1}
                    value={fieldVal(plan, 'duration_days') as number}
                    onChange={e => edit(plan.plan, 'duration_days', e.target.value)}
                    className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon/50"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-soft">Grace period (days)</span>
                  <input
                    type="number"
                    min={0}
                    value={fieldVal(plan, 'grace_period_days') as number}
                    onChange={e => edit(plan.plan, 'grace_period_days', e.target.value)}
                    className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon/50"
                  />
                </label>
              </div>

              {messages[plan.plan] && (
                <p className={`text-xs ${messages[plan.plan].ok ? 'text-green-600' : 'text-red-600'}`}>
                  {messages[plan.plan].text}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => save(plan.plan)}
                  disabled={saving === plan.plan || !edits[plan.plan]}
                  className="btn-primary text-sm py-2 px-4 disabled:opacity-60"
                >
                  {saving === plan.plan ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
