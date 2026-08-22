'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { type SearchCard } from '@/components/ProfileCard'
import { ProfileCard3D } from '@/components/ProfileCard3D'

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
  q: '',
  sort: 'newest',
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
  if (filters.q.trim()) p.set('q', filters.q.trim())
  if (filters.sort !== 'newest') p.set('sort', filters.sort)
  if (page > 1) p.set('page', String(page))
  return p
}

function FiltersPanel({
  filters,
  onChange,
  onApply,
  onReset,
}: {
  filters: Filters
  onChange: (k: keyof Filters, v: string) => void
  onApply: () => void
  onReset: () => void
}) {
  const field = (label: string, key: keyof Filters, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1">{label}</label>
      <input
        type={type}
        value={filters[key]}
        placeholder={placeholder}
        onChange={e => onChange(key, e.target.value)}
        className="w-full border border-ink/20 rounded-mj-sm px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-maroon"
      />
    </div>
  )

  const select = (label: string, key: keyof Filters, options: { value: string; label: string }[]) => (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1">{label}</label>
      <select
        value={filters[key]}
        onChange={e => onChange(key, e.target.value)}
        className="w-full border border-ink/20 rounded-mj-sm px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-maroon bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink text-sm">Filters</h2>
        <button type="button" onClick={onReset}
          className="text-xs text-maroon hover:underline">Reset</button>
      </div>

      {select('Gender', 'gender', [
        { value: 'any', label: 'Any' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ])}

      <div className="grid grid-cols-2 gap-2">
        {field('Age min', 'age_min', 'number', '18')}
        {field('Age max', 'age_max', 'number', '60')}
      </div>

      {field('Gotra', 'gotra', 'text', 'e.g. Kashyap')}
      {field('Mool', 'mool', 'text', 'e.g. Saurath')}
      {field('Gram', 'gram', 'text', 'e.g. Madhubani')}
      {field('Caste', 'caste', 'text', 'e.g. Brahmin')}

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
    q: searchParams.get('q') ?? '',
    sort: searchParams.get('sort') ?? 'newest',
  }))

  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))
  const [results, setResults] = useState<SearchCard[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searched, setSearched] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

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

  return (
    <main className="min-h-screen bg-paper">
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
                />
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-center">
                    <div className="w-full max-w-[360px] rounded-mj overflow-hidden shadow-mj-sm animate-pulse">
                      <div className="h-2 bg-gold/30" />
                      <div className="bg-paper flex flex-col items-center gap-3 pt-8 pb-6 px-5" style={{ height: 420 }}>
                        <div className="w-24 h-24 rounded-full bg-cream" />
                        <div className="h-5 bg-cream rounded w-32" />
                        <div className="h-3 bg-cream rounded w-24" />
                      </div>
                      <div className="h-10 bg-maroon-deep" />
                      <div className="h-1.5 bg-gold/30" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="rounded-mj-sm bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <div className="text-center py-16">
                <p className="font-serif text-2xl text-ink mb-2">No profiles found</p>
                <p className="text-ink-soft text-sm max-w-xs mx-auto">
                  Try broadening your filters — fewer criteria will surface more results.
                </p>
                <button type="button" onClick={resetFilters} className="mt-4 btn-ghost text-sm">
                  Clear all filters
                </button>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="text-xs text-ink-soft mb-3">
                  Page {page}{hasMore ? ' — more results available' : ' — end of results'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {results.map(p => (
                    <div key={p.id} className="flex justify-center">
                      <ProfileCard3D profile={p} />
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
              <div className="text-center py-16">
                <p className="font-serif text-2xl text-ink mb-2">Find your match</p>
                <p className="text-ink-soft text-sm max-w-xs mx-auto">
                  Use the filters to narrow your search by gotra, mool, gram, age, and more.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
