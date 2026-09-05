'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Template = {
  id: number
  slug: string
  label_en: string
  label_hi: string | null
  label_mai: string | null
  active: boolean
}

type Generation = {
  id: string
  template_label: string
  language: string
  status: string
  generated_at: string
  expires_at: string | null
}

const FIELD_GROUPS = [
  {
    label: 'Personal',
    fields: [
      { key: 'name',           label: 'Full name' },
      { key: 'age',            label: 'Age' },
      { key: 'gender',         label: 'Gender' },
      { key: 'marital_status', label: 'Marital status' },
      { key: 'mother_tongue',  label: 'Mother tongue' },
      { key: 'height',         label: 'Height' },
      { key: 'diet',           label: 'Diet' },
      { key: 'smoking',        label: 'Smoking habits' },
      { key: 'drinking',       label: 'Drinking habits' },
    ],
  },
  {
    label: 'Community',
    fields: [
      { key: 'religion',        label: 'Religion' },
      { key: 'caste',           label: 'Caste' },
      { key: 'sub_caste',       label: 'Sub-caste' },
      { key: 'self_gotra',      label: 'Gotra' },
      { key: 'maternal_gotra',  label: 'Maternal gotra' },
      { key: 'mool',            label: 'Mool' },
      { key: 'gram',            label: 'Gram' },
    ],
  },
  {
    label: 'Education & Career',
    fields: [
      { key: 'education',   label: 'Education' },
      { key: 'profession',  label: 'Profession & employer' },
    ],
  },
  {
    label: 'Location',
    fields: [
      { key: 'native_place',      label: 'Native place' },
      { key: 'current_location',  label: 'Current city' },
    ],
  },
  {
    label: 'About',
    fields: [
      { key: 'about_me',     label: 'Personal description' },
      { key: 'family_about', label: 'Family background' },
      { key: 'family',       label: 'Family details' },
    ],
  },
  {
    label: 'Other',
    fields: [
      { key: 'photo',    label: 'Profile photo' },
      { key: 'contact',  label: 'Contact details' },
      { key: 'income',   label: 'Income range' },
      { key: 'astrology', label: 'Birth & astrology details' },
      { key: 'kundli',   label: 'Kundli link' },
      { key: 'address',  label: 'Address' },
    ],
  },
]

const DEFAULT_FIELDS = [
  'name', 'age', 'gender', 'marital_status', 'mother_tongue', 'religion', 'caste',
  'self_gotra', 'mool', 'gram', 'height', 'diet', 'education', 'profession',
  'native_place', 'current_location', 'about_me', 'family_about', 'photo',
  'family',
]

const LANG_OPTIONS = [
  { value: 'en',  label: 'English' },
  { value: 'hi',  label: 'Hindi' },
  { value: 'mai', label: 'Maithili' },
  { value: 'sa',  label: 'Sanskrit' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BiodataContent() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [history, setHistory] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(DEFAULT_FIELDS))
  const [language, setLanguage] = useState('en')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/biodata/templates').then(r => r.json()),
      fetch('/api/biodata/history').then(r => r.json()),
    ]).then(([tJson, hJson]) => {
      if (tJson.ok) {
        setTemplates(tJson.templates)
        if (tJson.templates.length > 0) setSelectedTemplate(tJson.templates[0].id)
      }
      if (hJson.ok) setHistory(hJson.generations)
    }).catch(() => setError('Could not load biodata options')).finally(() => setLoading(false))
  }, [])

  function toggleField(key: string) {
    setSelectedFields(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function generate() {
    if (!selectedTemplate) return
    setGenerating(true)
    setError('')
    const res = await fetch('/api/biodata/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: selectedTemplate,
        language,
        fields_included: [...selectedFields],
      }),
    })
    const json = await res.json()
    if (json.ok) {
      router.push(`/biodata/preview/${json.generation_id}`)
    } else {
      setError(json.message ?? 'Could not generate biodata')
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-paper">
        <div className="wrap py-10">
          <div className="max-w-2xl mx-auto animate-pulse space-y-4">
            <div className="h-8 bg-paper-3 rounded w-1/3" />
            <div className="card p-6 space-y-3">
              <div className="h-5 bg-paper-3 rounded w-1/2" />
              <div className="h-4 bg-paper-3 rounded w-2/3" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="wrap py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="font-serif text-3xl text-ink">Biodata</h1>
            <p className="text-sm text-ink-soft mt-1">
              Create a beautiful, branded marriage biodata that is ready to print or share on WhatsApp — free for every member.
            </p>
          </div>

          {error && (
            <div className="rounded-mj-sm bg-error-soft border border-error/30 px-4 py-3 text-error-fg text-sm">
              {error}
            </div>
          )}

          {/* Template selection */}
          <div className="card p-5 space-y-3">
            <h2 className="font-serif text-maroon text-[16px]">Template</h2>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(t => {
                const active = selectedTemplate === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    aria-pressed={active}
                    className={`relative flex gap-3 items-start border-2 rounded-mj-sm p-4 text-left transition-all ${
                      active
                        ? 'border-gold bg-gold/[0.06] shadow-mj-xs'
                        : 'border-paper-3 hover:border-gold/50'
                    }`}
                  >
                    {/* Mini document thumbnail */}
                    <span className="shrink-0 w-9 h-11 rounded-[3px] bg-cream border-2 border-maroon/70 flex flex-col items-center justify-start pt-1 gap-0.5 overflow-hidden" aria-hidden="true">
                      <span className="block w-5 h-[3px] rounded-full bg-maroon/70" />
                      <span className="block w-6 h-px bg-gold/50" />
                      <span className="block w-6 h-px bg-gold/50" />
                      <span className="block w-4 h-px bg-gold/50" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-maroon text-[14px] leading-tight">{t.label_en}</span>
                      {t.label_mai && (
                        <span className="block text-xs text-ink-soft mt-0.5">{t.label_mai}</span>
                      )}
                    </span>
                    {active && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gold flex items-center justify-center" aria-hidden="true">
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="#5A0E19" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Language */}
          <div className="card p-5 space-y-3">
            <h2 className="font-serif text-maroon text-[16px]">Language</h2>
            <div className="flex flex-wrap gap-2">
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLanguage(l.value)}
                  aria-pressed={language === l.value}
                  className={`chip ${language === l.value ? 'chip-on' : ''}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {language !== 'en' && (
              <p className="text-xs text-ink-soft">
                Section headings will appear in your selected language. Profile text is shown as entered.
              </p>
            )}
          </div>

          {/* Field selection */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-maroon text-[16px]">Fields to include</h2>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedFields(new Set(FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key))))}
                  className="text-maroon underline"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFields(new Set(['name', 'age', 'gender']))}
                  className="text-maroon underline"
                >
                  Minimal
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {FIELD_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {group.fields.map(f => (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFields.has(f.key)}
                          onChange={() => toggleField(f.key)}
                          className="w-4 h-4 accent-maroon rounded"
                        />
                        <span className="text-sm text-ink">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            disabled={generating || !selectedTemplate || selectedFields.size === 0}
            className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? 'Opening preview…' : 'Preview & Share Biodata'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="card p-5 space-y-3">
              <h2 className="font-serif text-maroon text-[16px]">Recent downloads</h2>
              <div className="space-y-2">
                {history.map(gen => (
                  <div key={gen.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-ink">{gen.template_label}</span>
                      <span className="text-ink-soft ml-2 text-xs">{gen.language.toUpperCase()}</span>
                      <span className="text-ink-soft ml-2 text-xs">{formatDate(gen.generated_at)}</span>
                    </div>
                    <a
                      href={`/biodata/preview/${gen.id}`}
                      className="text-maroon underline text-xs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reopen
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
