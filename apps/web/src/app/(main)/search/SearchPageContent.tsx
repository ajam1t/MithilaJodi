'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { type SearchCard } from '@/types/profile'
import { ProfileCard3D } from '@/components/ProfileCard3D'
import { LocationPicker } from '@/components/LocationPicker'
import { Button, EmptyState, Skeleton, useToast } from '@/components/ui'

type Filters = {
  gender: string
  age_min: string
  age_max: string
  gotra: string
  mool: string
  gram: string
  caste: string
  religion: string
  diet: string
  height_min: string
  height_max: string
  marital_status: string
  marriage_timeline: string
  /** india_locations.id, as a string so it round-trips through the URL. */
  loc_id: string
  radius_km: string
  q: string
  sort: string
}

const EMPTY_FILTERS: Filters = {
  gender: 'any',
  age_min: '',
  age_max: '',
  gotra: '',
  mool: '',
  gram: '',
  caste: '',
  religion: '',
  diet: '',
  height_min: '',
  height_max: '',
  marital_status: '',
  marriage_timeline: '',
  loc_id: '',
  radius_km: '120',
  q: '',
  sort: 'match',
}

const FILTER_LABELS: Partial<Record<keyof Filters, string>> = {
  gender: 'Gender',
  age_min: 'Age ≥',
  age_max: 'Age ≤',
  gotra: 'Gotra',
  mool: 'Mool',
  gram: 'Gram',
  caste: 'Caste',
  religion: 'Religion',
  diet: 'Diet',
  height_min: 'Ht ≥',
  height_max: 'Ht ≤',
  marital_status: 'Marital status',
  marriage_timeline: 'Timeline',
  loc_id: 'Near',
  q: 'Search',
}

/** What the API reports back when it had to loosen a filter to find anyone. */
type Relaxation = { filter: string; label: string; from: string; to: string }

const TIMELINE_OPTIONS = [
  { value: '', label: 'Any timeline' },
  { value: 'within_3_months', label: 'Within 3 months' },
  { value: 'within_6_months', label: 'Within 6 months' },
  { value: 'within_1_year', label: 'Within a year' },
  { value: 'within_2_years', label: 'Within 2 years' },
  { value: 'no_rush', label: 'No fixed timeline' },
]

function prettyValue(v: string): string {
  return v.replace(/_/g, '-')
}

function buildParams(filters: Filters, page: number): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.gender !== 'any') p.set('gender', filters.gender)
  if (filters.age_min) p.set('age_min', filters.age_min)
  if (filters.age_max) p.set('age_max', filters.age_max)
  if (filters.gotra.trim()) p.set('gotra', filters.gotra.trim())
  if (filters.mool.trim()) p.set('mool', filters.mool.trim())
  if (filters.gram.trim()) p.set('gram', filters.gram.trim())
  if (filters.caste.trim()) p.set('caste', filters.caste.trim())
  if (filters.religion.trim()) p.set('religion', filters.religion.trim())
  if (filters.diet) p.set('diet', filters.diet)
  if (filters.height_min) p.set('height_min', filters.height_min)
  if (filters.height_max) p.set('height_max', filters.height_max)
  if (filters.marital_status.trim()) p.set('marital_status', filters.marital_status.trim())
  if (filters.marriage_timeline) p.set('marriage_timeline', filters.marriage_timeline)
  if (filters.loc_id) {
    p.set('loc_id', filters.loc_id)
    // Only meaningful alongside a location, so it is never sent on its own.
    if (filters.radius_km) p.set('radius_km', filters.radius_km)
  }
  if (filters.q.trim()) p.set('q', filters.q.trim())
  if (filters.sort !== 'match') p.set('sort', filters.sort)
  if (page > 1) p.set('page', String(page))
  return p
}

function FiltersPanel({
  filters,
  onChange,
  onApply,
  onReset,
  locName,
  onLocChange,
  showing,
}: {
  filters: Filters
  onChange: (k: keyof Filters, v: string) => void
  onApply: () => void
  onReset: () => void
  locName: string
  onLocChange: (id: number | null, name: string) => void
  /** Gender the API actually applied, so the panel can say what is shown. */
  showing: string | null
}) {
  const field = (label: string, key: keyof Filters, type = 'text', placeholder = '') => (
    <div>
      <label className="field-label">{label}</label>
      <input
        type={type}
        value={filters[key]}
        placeholder={placeholder}
        onChange={e => onChange(key, e.target.value)}
        className="input py-2 text-sm"
      />
    </div>
  )

  const select = (label: string, key: keyof Filters, options: { value: string; label: string }[]) => (
    <div>
      <label className="field-label">{label}</label>
      <select
        value={filters[key]}
        onChange={e => onChange(key, e.target.value)}
        className="select py-2 text-sm"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-maroon text-[16px]">Filters</h2>
        <button type="button" onClick={onReset}
          className="text-xs text-maroon hover:underline">Reset</button>
      </div>

      {/* No Gender control: Mithila Jodi matches brides with grooms, so the
          server derives this from your own profile. A select here would be a
          control that silently does nothing. The API reports what it applied
          via `showing`, so this states the truth rather than guessing. */}
      {showing && (
        <p className="rounded-mj-sm border border-gold/35 bg-gold/[0.06] px-3 py-2 text-[12.5px] text-ink-soft leading-snug">
          Showing <span className="font-semibold text-maroon">{showing === 'female' ? 'brides' : 'grooms'}</span>.
          Mithila Jodi matches brides with grooms.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {field('Age min', 'age_min', 'number', '18')}
        {field('Age max', 'age_max', 'number', '60')}
      </div>

      <div>
        <LocationPicker
          compact
          label="Near"
          value={filters.loc_id ? Number(filters.loc_id) : null}
          initialName={locName}
          placeholder="City or district"
          onChange={onLocChange}
        />
        {filters.loc_id && (
          <div className="mt-2">
            <label className="field-label">Within</label>
            <select
              value={filters.radius_km}
              onChange={e => onChange('radius_km', e.target.value)}
              className="select py-2 text-sm"
            >
              <option value="40">40 km — same city</option>
              <option value="120">120 km — nearby towns</option>
              <option value="250">250 km — same region</option>
              <option value="600">600 km — wider</option>
            </select>
          </div>
        )}
      </div>

      {field('Gotra', 'gotra', 'text', 'e.g. Kashyap')}
      {field('Mool', 'mool', 'text', 'e.g. Saurath')}
      {field('Gram', 'gram', 'text', 'e.g. Madhubani')}
      {field('Caste', 'caste', 'text', 'e.g. Brahmin')}
      {field('Marital status', 'marital_status', 'text', 'e.g. Never married')}

      {select('Marriage timeline', 'marriage_timeline', TIMELINE_OPTIONS)}

      {select('Diet', 'diet', [
        { value: '', label: 'Any diet' },
        { value: 'vegetarian', label: 'Vegetarian' },
        { value: 'non_vegetarian', label: 'Non-vegetarian' },
        { value: 'eggetarian', label: 'Eggetarian' },
        { value: 'vegan', label: 'Vegan' },
      ])}

      <div className="grid grid-cols-2 gap-2">
        {field('Height min', 'height_min', 'number', '150')}
        {field('Height max', 'height_max', 'number', '190')}
      </div>

      {select('Sort by', 'sort', [
        { value: 'match', label: 'Best match' },
        { value: 'newest', label: 'Recently updated' },
        { value: 'completeness', label: 'Most complete' },
        { value: 'age_asc', label: 'Younger first' },
        { value: 'age_desc', label: 'Older first' },
      ])}

      <button type="button" onClick={onApply}
        className="btn-primary w-full justify-center text-sm py-2">
        Apply filters
      </button>
    </aside>
  )
}

export default function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const [filters, setFilters] = useState<Filters>(() => ({
    gender: searchParams.get('gender') ?? 'any',
    age_min: searchParams.get('age_min') ?? '',
    age_max: searchParams.get('age_max') ?? '',
    gotra: searchParams.get('gotra') ?? '',
    mool: searchParams.get('mool') ?? '',
    gram: searchParams.get('gram') ?? '',
    caste: searchParams.get('caste') ?? '',
    religion: searchParams.get('religion') ?? '',
    diet: searchParams.get('diet') ?? '',
    height_min: searchParams.get('height_min') ?? '',
    height_max: searchParams.get('height_max') ?? '',
    marital_status: searchParams.get('marital_status') ?? '',
    marriage_timeline: searchParams.get('marriage_timeline') ?? '',
    loc_id: searchParams.get('loc_id') ?? '',
    radius_km: searchParams.get('radius_km') ?? '120',
    q: searchParams.get('q') ?? '',
    sort: searchParams.get('sort') ?? 'match',
  }))

  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))
  const [results, setResults] = useState<SearchCard[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [relaxed, setRelaxed] = useState<Relaxation[]>([])
  const [noProfile, setNoProfile] = useState(false)
  const [showing, setShowing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searched, setSearched] = useState(false)
  const [locName, setLocName] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // Re-hydrate the location chip's display name when the page is opened from a
  // shared or bookmarked URL, which carries the id but not the name.
  useEffect(() => {
    const id = searchParams.get('loc_id')
    if (!id) return
    fetch(`/api/locations?ids=${id}`)
      .then(r => r.json())
      .then(j => { if (j.ok && j.results?.[0]) setLocName(j.results[0].name_en) })
      .catch(() => { /* the id still filters correctly; only the label is missing */ })
  }, [searchParams])

  const runSearch = useCallback(async (f: Filters, p: number) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError('')

    try {
      const params = buildParams(f, p)
      const res = await fetch(`/api/search?${params}`, { signal: abortRef.current.signal })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.message ?? 'Search failed. Please try again.')
        return
      }
      setResults(json.results ?? [])
      setHasMore(json.has_more ?? false)
      setTotal(json.total ?? (json.results?.length ?? 0))
      setRelaxed(json.relaxed ?? [])
      setNoProfile(json.scoring === 'no_profile')
      setShowing(json.showing ?? null)
      setSearched(true)
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    runSearch(filters, page)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters() {
    const newPage = 1
    setPage(newPage)
    setShowFilters(false)
    const params = buildParams(filters, newPage)
    router.replace(`/search?${params}`, { scroll: false })
    runSearch(filters, newPage)
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
    setLocName('')
    setPage(1)
    router.replace('/search', { scroll: false })
    runSearch(EMPTY_FILTERS, 1)
  }

  function changePage(delta: number) {
    const newPage = Math.max(1, page + delta)
    setPage(newPage)
    const params = buildParams(filters, newPage)
    router.replace(`/search?${params}`, { scroll: false })
    runSearch(filters, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeFilter(key: keyof Filters) {
    const next = { ...filters, [key]: EMPTY_FILTERS[key] }
    if (key === 'loc_id') setLocName('')
    setFilters(next)
    setPage(1)
    const params = buildParams(next, 1)
    router.replace(params.toString() ? `/search?${params}` : '/search', { scroll: false })
    runSearch(next, 1)
  }

  // radius_km is deliberately not a chip: on its own it means nothing, and it
  // is already shown as a select underneath the location field.
  const activeChips = (Object.keys(filters) as (keyof Filters)[])
    .filter(k => k !== 'sort' && k !== 'radius_km' && k !== 'gender'
      && filters[k] !== '' && filters[k] !== EMPTY_FILTERS[k])
    .map(k => ({
      key: k,
      label: k === 'loc_id'
        ? `Near: ${locName || 'selected place'}${filters.radius_km ? ` (${filters.radius_km} km)` : ''}`
        : `${FILTER_LABELS[k] ?? k}: ${prettyValue(filters[k])}`,
    }))

  // Send interest directly from a search card. Throws on failure so the card
  // does not show a false "Sent!" state; the message is surfaced to the user.
  async function handleSendInterest(profileId: string) {
    const res = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_profile_id: profileId }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.ok) {
      toast(json.message ?? 'Could not send interest. Please try again.', { type: 'error' })
      throw new Error(json.message ?? 'send interest failed')
    }
    toast('Interest sent', { type: 'success' })
  }

  // Shortlist directly from a search card.
  async function handleShortlist(profileId: string) {
    const res = await fetch(`/api/shortlists/${profileId}`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.ok) {
      toast(json.message ?? 'Could not shortlist. Please try again.', { type: 'error' })
      throw new Error(json.message ?? 'shortlist failed')
    }
    toast('Added to shortlist', { type: 'success' })
  }

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      {/* Search bar */}
      <div className="bg-cream border-b border-paper-3">
        <div className="wrap py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="search"
                value={filters.q}
                onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                placeholder="Search by name, gotra, mool, gram…"
                className="w-full border border-ink/20 rounded-mj-sm pl-4 pr-10 py-2.5 text-sm text-ink focus:outline-none focus:border-maroon bg-white"
              />
            </div>
            <button
              type="button"
              onClick={applyFilters}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className="lg:hidden btn-ghost px-3 py-2.5 text-sm"
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="wrap py-6">
        <div className="flex gap-6">
          {/* Filters — desktop sidebar */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="card p-4 sticky top-20">
              <FiltersPanel
                filters={filters}
                onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
                onApply={applyFilters}
                onReset={resetFilters}
                locName={locName}
                showing={showing}
                onLocChange={(id, name) => {
                  setLocName(name)
                  setFilters(f => ({ ...f, loc_id: id ? String(id) : '' }))
                }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden card p-4 mb-4">
                <FiltersPanel
                  filters={filters}
                  onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
                  onApply={applyFilters}
                  onReset={resetFilters}
                  locName={locName}
                  showing={showing}
                  onLocChange={(id, name) => {
                    setLocName(name)
                    setFilters(f => ({ ...f, loc_id: id ? String(id) : '' }))
                  }}
                />
              </div>
            )}

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activeChips.map(chip => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => removeFilter(chip.key)}
                    className="chip chip-on gap-1.5 pr-2"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label}
                    <span aria-hidden="true" className="text-cream/80">×</span>
                  </button>
                ))}
                <button type="button" onClick={resetFilters} className="text-xs text-maroon hover:underline ml-1">
                  Clear all
                </button>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full max-w-[320px] mx-auto rounded-mj-lg overflow-hidden border border-paper-3 bg-cream shadow-mj-sm">
                    <div className="gold-strip" />
                    <div className="aspect-[4/3] skeleton rounded-none" />
                    <div className="p-4 space-y-2.5">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-1.5 pt-1">
                        <Skeleton className="h-5 w-16 rounded-pill" />
                        <Skeleton className="h-5 w-20 rounded-pill" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Skeleton className="h-9" />
                        <Skeleton className="h-9" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="rounded-mj-sm bg-error-soft border border-error/30 px-4 py-3 text-error-fg text-sm">
                {error}
              </div>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <EmptyState
                title="No profiles match your filters"
                description={
                  relaxed.length > 0
                    ? 'We also tried widening your filters and still found nobody. The community is still small — try again in a few days, or clear the filters to see everyone.'
                    : 'Try broadening your search — fewer criteria will surface more matches.'
                }
                action={<Button variant="ghost" size="sm" onClick={resetFilters}>Clear all filters</Button>}
              />
            )}

            {/* Nothing matched the filters as given, so the API loosened them one
                at a time. Saying exactly what it changed is the difference
                between a helpful fallback and results that look wrong. */}
            {!loading && relaxed.length > 0 && results.length > 0 && (
              <div className="mb-4 rounded-mj-sm border border-gold/45 bg-gold/[0.07] px-4 py-3">
                <p className="text-[13.5px] font-semibold text-maroon">
                  No one matched everything you asked for — here is what is nearby.
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {relaxed.map(r => (
                    <li key={r.filter} className="text-[12.5px] text-ink-soft">
                      <span className="text-ink">{r.label}</span>: widened from{' '}
                      <span className="line-through opacity-70">{r.from}</span> to{' '}
                      <span className="text-ink font-medium">{r.to}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scores need a profile to compare against. Without one the results
                are still correct, just unranked — say so rather than showing
                blank rings. */}
            {!loading && noProfile && results.length > 0 && (
              <div className="mb-4 rounded-mj-sm border border-paper-3 bg-cream px-4 py-3 text-[13px] text-ink-soft">
                Complete your own profile to see match scores and have these results ranked for you.{' '}
                <Link href="/profile/edit" className="text-maroon font-semibold hover:underline">Complete profile →</Link>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-ink-soft">
                    <span className="text-ink font-semibold">{total}</span>{' '}
                    {total === 1 ? 'profile' : 'profiles'} found
                    {total > results.length && <> · showing {results.length}</>}
                  </p>
                  <p className="text-xs text-ink-soft">Page {page}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {results.map(p => (
                    <div key={p.id} className="flex justify-center">
                      <ProfileCard3D
                        profile={p}
                        onShortlist={handleShortlist}
                        onSendInterest={handleSendInterest}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-paper-3">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => changePage(-1)}
                    className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-ink-soft">Page {page}</span>
                  <button
                    type="button"
                    disabled={!hasMore || loading}
                    onClick={() => changePage(1)}
                    className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}

            {!searched && !loading && (
              <EmptyState
                title="Find your match"
                description="Use the filters to narrow your search by gotra, mool, gram, age, and more."
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
