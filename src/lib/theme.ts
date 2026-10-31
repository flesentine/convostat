import { useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'convostat-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches
      ? 'dark'
      : 'light'
  }
  return theme
}

function apply(theme: Theme): void {
  const resolved = resolve(theme)
  document.documentElement.dataset.theme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#141412' : '#f7f5f1')
  }
}

export function useTheme(): {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
} {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored
      }
    } catch {
      /* ignore */
    }
    return 'system'
  })

  useEffect(() => {
    apply(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
    if (theme !== 'system') return
    const media = window.matchMedia(DARK_QUERY)
    const listener = () => apply('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  return {
    theme,
    resolved: resolve(theme),
    setTheme: setThemeState,
  }
}
