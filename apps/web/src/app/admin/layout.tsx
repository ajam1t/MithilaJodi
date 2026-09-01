import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionAccount } from '@/lib/auth'

// Admin pages are all client components and cannot export metadata
// themselves, so without this they inherited index:true from the root
// layout — robots.txt was their only protection.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const NAV = [
  { href: '/admin',           label: 'Dashboard' },
  { href: '/admin/photos',    label: 'Photos' },
  { href: '/admin/profiles',  label: 'Profiles' },
  { href: '/admin/messages',  label: 'Messages' },
  { href: '/admin/reports',   label: 'Reports' },
  { href: '/admin/flags',     label: 'Flags' },
  { href: '/admin/accounts',  label: 'Accounts' },
  { href: '/admin/master-data', label: 'Master Data' },
  { href: '/admin/showcase',  label: 'Search Showcase' },
  { href: '/admin/blog',      label: 'Blog Posts' },
  { href: '/admin/blog/categories', label: 'Blog Categories' },
  { href: '/admin/team',      label: 'Team Members' },
  { href: '/admin/config',    label: 'Plan Config' },
  { href: '/admin/audit',     label: 'Audit Log' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-paper">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="w-full lg:w-52 shrink-0 bg-ink text-white flex flex-col lg:min-h-screen">
        <div className="px-4 py-3 lg:py-5 border-b border-white/10 flex items-center justify-between lg:block">
          <div>
            <p className="font-serif text-lg text-white leading-tight">Mithila Jodi</p>
            <p className="text-xs text-white/50 mt-0.5">Admin Panel</p>
          </div>
          <p className="text-xs text-white/40 capitalize lg:hidden">{session.role}</p>
        </div>
        <nav className="flex lg:flex-col lg:flex-1 gap-0.5 overflow-x-auto lg:overflow-visible px-2 lg:px-0 py-2 lg:py-4 border-b border-white/10 lg:border-b-0">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-mj-sm lg:rounded-none px-3 lg:px-4 py-2 lg:py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block px-4 py-4 border-t border-white/10">
          <p className="text-xs text-white/40 truncate">{session.mobile}</p>
          <p className="text-xs text-white/30 mt-0.5 capitalize">{session.role}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
