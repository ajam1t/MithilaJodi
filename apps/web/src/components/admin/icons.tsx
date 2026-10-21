/** Line icons for the console (24px grid, 1.8 stroke). Decorative — labels always sit beside them. */
const P: Record<string, string> = {
  dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  members: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.9M15.5 3.6a3.5 3.5 0 0 1 0 6.8',
  analytics: 'M3 20h18M6 16v-4M11 16V6M16 16v-7M21 16v-2',
  features: 'M12 3l2.1 5.4L20 10l-5.9 1.6L12 17l-2.1-5.4L4 10l5.9-1.6zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  content: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  community: 'M4 5h16v11H9l-5 4zM8 10h8M8 13h5',
  system: 'M3 12h4l2.5-6 5 12 2.5-6h4',
  security: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4',
  settings: 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
  photo: 'M4 6h16v13H4zM4 15l4.5-4.5 4 4L15 12l5 5M15.5 9.5h.01',
  approve: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M3 20v-1a5 5 0 0 1 5-5h2M15 18l2 2 4-4',
  report: 'M5 21V4h11l-1.5 4L16 12H5',
  flag: 'M12 3l9.5 17h-19zM12 10v4M12 17h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-4-4',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  menu: 'M4 7h16M4 12h10M4 17h16',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3',
  out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  plus: 'M12 5v14M5 12h14',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z',
  funnel: 'M3 5h18l-7 8v6l-4 2v-8z',
  db: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  audit: 'M9 4h6v3H9zM6 5H5v16h14V5h-1M8 12h8M8 16h5',
  close: 'M6 6l12 12M18 6 6 18',
  chev: 'm9 6 6 6-6 6',
}

export type IconName = keyof typeof P

export function Icon({ name, size = 18, className }: { name: IconName | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={P[name] ?? P.dashboard} />
    </svg>
  )
}

/** The icon for each top-level nav group, by its label. */
export const GROUP_ICON: Record<string, IconName> = {
  Dashboard: 'dashboard', Members: 'members', Analytics: 'analytics', Features: 'features', Content: 'content',
  Community: 'community', System: 'system', Security: 'security', Settings: 'settings',
}
