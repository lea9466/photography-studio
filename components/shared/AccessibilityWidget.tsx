'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'stg_a11y'
const SIZE_STEPS = [100, 112, 125, 150]

type Prefs = {
  size: number
  contrast: boolean
  links: boolean
  font: boolean
  spacing: boolean
  motion: boolean
}

const DEFAULTS: Prefs = {
  size: 0,
  contrast: false,
  links: false,
  font: false,
  spacing: false,
  motion: false,
}

type ToggleKey = Exclude<keyof Prefs, 'size'>

const TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: 'contrast', label: 'ניגודיות גבוהה' },
  { key: 'links', label: 'הדגשת קישורים' },
  { key: 'font', label: 'גופן קריא' },
  { key: 'spacing', label: 'ריווח שורות ואותיות' },
  { key: 'motion', label: 'עצירת אנימציות' },
]

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Prefs>
    const size = Number(parsed.size)
    return {
      size: Number.isInteger(size) && size >= 0 && size < SIZE_STEPS.length ? size : 0,
      contrast: parsed.contrast === true,
      links: parsed.links === true,
      font: parsed.font === true,
      spacing: parsed.spacing === true,
      motion: parsed.motion === true,
    }
  } catch {
    return DEFAULTS
  }
}

// The preferences have to reach <html> (rem-based font size + page-wide CSS
// hooks in globals.css). That is the one place this component touches DOM
// outside its own tree — through the root element's dataset/style only.
function applyPrefs(prefs: Prefs) {
  const root = document.documentElement
  root.style.fontSize = prefs.size > 0 ? `${SIZE_STEPS[prefs.size]}%` : ''
  for (const { key } of TOGGLES) {
    if (prefs[key]) root.setAttribute(`data-a11y-${key}`, '')
    else root.removeAttribute(`data-a11y-${key}`)
  }
}

function AccessibilityIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="4.5" r="2.2" />
      <path d="M4 8.2c0-.6.5-1 1-1h14c.6 0 1 .5 1 1s-.5 1-1 1h-4.8v3.6l2.1 6.9c.2.6-.2 1.2-.8 1.3-.5.1-1-.2-1.2-.7L12 14.9l-1.3 5.4c-.1.5-.7.8-1.2.7-.6-.1-1-.7-.8-1.3l2.1-6.9V9.2H5c-.6 0-1-.4-1-1z" />
    </svg>
  )
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  const [ready, setReady] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = readPrefs()
    setPrefs(saved)
    applyPrefs(saved)
    setReady(true)
  }, [])

  const update = useCallback((next: Prefs) => {
    setPrefs(next)
    applyPrefs(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // storage blocked — preferences just won't persist
    }
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!ready) return null

  const isDefault = JSON.stringify(prefs) === JSON.stringify(DEFAULTS)

  return (
    <div data-a11y-ui dir="rtl">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label="תפריט נגישות"
        aria-expanded={open}
        aria-controls="a11y-panel"
        className="fixed left-3 top-1/2 z-[9998] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#7c3aed] text-white shadow-lg transition hover:bg-[#6d28d9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
      >
        <AccessibilityIcon />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-label="הגדרות נגישות"
          tabIndex={-1}
          className="fixed left-[68px] top-1/2 z-[9998] w-64 max-w-[calc(100vw-5rem)] -translate-y-1/2 rounded-2xl border border-[#e7e2dc] bg-white p-4 text-[#2b2623] shadow-2xl outline-none"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">נגישות</h2>
            <button
              type="button"
              onClick={close}
              aria-label="סגירת תפריט הנגישות"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-[#f3efea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7c3aed]"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between rounded-xl bg-[#f6f3ef] px-3 py-2">
            <span className="text-sm" id="a11y-size-label">
              גודל טקסט
            </span>
            <div role="group" aria-labelledby="a11y-size-label" className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ ...prefs, size: Math.max(0, prefs.size - 1) })}
                disabled={prefs.size === 0}
                aria-label="הקטנת טקסט"
                className="h-8 w-8 rounded-full bg-white text-lg shadow-sm disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7c3aed]"
              >
                <span aria-hidden="true">−</span>
              </button>
              <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
                {SIZE_STEPS[prefs.size]}%
              </span>
              <button
                type="button"
                onClick={() =>
                  update({ ...prefs, size: Math.min(SIZE_STEPS.length - 1, prefs.size + 1) })
                }
                disabled={prefs.size === SIZE_STEPS.length - 1}
                aria-label="הגדלת טקסט"
                className="h-8 w-8 rounded-full bg-white text-lg shadow-sm disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7c3aed]"
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {TOGGLES.map(({ key, label }) => (
              <li key={key}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  onClick={() => update({ ...prefs, [key]: !prefs[key] })}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7c3aed] ${
                    prefs[key] ? 'bg-[#7c3aed] text-white' : 'bg-[#f6f3ef] hover:bg-[#ece7e1]'
                  }`}
                >
                  <span>{label}</span>
                  <span aria-hidden="true">{prefs[key] ? '✓' : ''}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => update(DEFAULTS)}
              disabled={isDefault}
              className="underline underline-offset-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7c3aed]"
            >
              איפוס
            </button>
            <Link href="/accessibility" className="underline underline-offset-2">
              הצהרת נגישות
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
