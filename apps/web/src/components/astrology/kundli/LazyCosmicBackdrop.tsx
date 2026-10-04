'use client'

import dynamic from 'next/dynamic'

/**
 * Client-only, code-split canvas. The static CSS starfield (.kd-stars) shows
 * until it loads, and stays as the fallback if JavaScript never runs.
 */
export const LazyCosmicBackdrop = dynamic(() => import('./CosmicBackdrop'), { ssr: false, loading: () => null })
