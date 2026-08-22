import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionAccount } from '@/lib/auth'

const NAV = [
  { href: '/admin',           label: 'Dashboard' },
  { href: '/admin/photos',    label: 'Photos' },
  { href: '/admin/profiles',  label: 'Profiles' },
  { href: '/admin/messages',  label: 'Messages' },
  { href: '/admin/reports',   label: 'Reports' },
  { href: '/admin/flags',     label: 'Flags' },
  { href: '/admin/accounts',  label: 'Accounts' },
  { href: '/admin/config',    label: 'Plan Config' },
  { href: '/admin/audit',     label: 'Audit Log' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-ink text-white flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="font-serif text-lg text-white leading-tight">Mithila Jodi</p>
          <p className="text-xs text-white/50 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4 space-y-0.5">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
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
