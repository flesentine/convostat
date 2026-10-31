import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { NotebookPen, Settings as SettingsIcon, Users } from 'lucide-react'
import { Logo } from './components/Logo'
import { Capture } from './screens/Capture'
import { People } from './screens/People'
import { PersonDetail } from './screens/PersonDetail'
import { Settings } from './screens/Settings'
import { cn } from './lib/utils'

const NAV = [
  { to: '/', label: 'Log', icon: NotebookPen, end: true },
  { to: '/people', label: 'People', icon: Users, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

export default function App() {
  useScrollToTop()

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-bg-elevated px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>

        <nav className="mt-9 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition',
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  )
                }
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-line bg-surface/60 px-3.5 py-3">
          <p className="text-[11px] font-medium text-ink-soft">Local-first</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Your log lives in this browser. Export a backup from Settings now and then.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo compact />
          <span className="text-[11px] text-muted">Local-first</span>
        </div>
      </header>

      <main className="md:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:pb-14 md:pt-10">
          <Routes>
            <Route path="/" element={<Capture />} />
            <Route path="/people" element={<People />} />
            <Route path="/people/:id" element={<PersonDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition',
                    isActive ? 'text-accent' : 'text-muted hover:text-ink',
                  )
                }
              >
                <Icon size={20} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function useScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-semibold text-ink">Page not found</p>
      <p className="mt-1 text-sm text-muted">That route does not exist.</p>
      <NavLink
        to="/"
        className="mt-4 inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink"
      >
        Back to logging
      </NavLink>
    </div>
  )
}
