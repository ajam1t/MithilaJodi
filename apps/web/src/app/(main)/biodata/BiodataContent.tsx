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
    ],
  },
  {
    label: 'Other',
    fields: [
      { key: 'photo',    label: 'Profile photo' },
      { key: 'contact',  label: 'Contact details' },
    ],
  },
]

const DEFAULT_FIELDS = [
  'name', 'age', 'gender', 'marital_status', 'mother_tongue', 'religion', 'caste',
  'self_gotra', 'mool', 'gram', 'height', 'diet', 'education', 'profession',
  'native_place', 'current_location', 'about_me', 'family_about', 'photo',
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
      <main className="min-h-screen bg-paper">
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
              Choose a template and fields, then save as PDF from your browser.
            </p>
          </div>

          {error && (
            <div className="rounded-mj-sm bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Template selection */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-ink text-sm">Template</h2>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`border-2 rounded-mj-sm p-4 text-left transition-colors ${
                    selectedTemplate === t.id
                      ? 'border-maroon bg-maroon/5'
                      : 'border-paper-3 hover:border-ink/20'
                  }`}
                >
                  <p className="font-semibold text-ink text-sm">{t.label_en}</p>
                  {t.label_mai && (
                    <p className="text-xs text-ink-soft mt-0.5">{t.label_mai}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-ink text-sm">Language</h2>
            <div className="flex gap-3">
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLanguage(l.value)}
                  className={`px-4 py-2 rounded-mj-sm text-sm border transition-colors ${
                    language === l.value
                      ? 'border-maroon bg-maroon text-white'
                      : 'border-paper-3 text-ink hover:border-ink/20'
                  }`}
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
              <h2 className="font-semibold text-ink text-sm">Fields to include</h2>
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
            {generating ? 'Opening preview…' : 'Preview & Download as PDF'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-ink text-sm">Recent downloads</h2>
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
