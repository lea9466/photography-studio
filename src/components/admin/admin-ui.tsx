'use client'

import { forwardRef } from 'react'

const inputClass =
  'admin-input mt-2 w-full'

export function AdminField({
  label,
  name,
  defaultValue = '',
  type = 'text',
  required,
  hint,
  placeholder,
  rows,
  min,
}: {
  label: string
  name: string
  defaultValue?: string | number
  type?: string
  required?: boolean
  hint?: string
  placeholder?: string
  rows?: number
  min?: number
}) {
  return (
    <label className="block text-sm text-foreground/90">
      <span className="font-medium">{label}</span>
      {rows ? (
        <textarea
          name={name}
          rows={rows}
          required={required}
          placeholder={placeholder}
          defaultValue={String(defaultValue)}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          min={min}
          placeholder={placeholder}
          defaultValue={String(defaultValue)}
          className={inputClass}
        />
      )}
      {hint ? (
        <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function AdminSelect({
  label,
  name,
  defaultValue,
  disabled,
  hint,
  children,
}: {
  label: string
  name: string
  defaultValue?: string
  disabled?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm text-foreground/90">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className={inputClass}
      >
        {children}
      </select>
      {hint ? (
        <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function AdminCheckbox({
  name,
  label,
  description,
  defaultChecked,
  disabled,
}: {
  name: string
  label: string
  description?: string
  defaultChecked?: boolean
  disabled?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/25 p-4 transition-colors hover:bg-muted/40">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-foreground"
      />
      <span className="text-sm">
        <span className="font-medium text-foreground">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export function AdminButton({
  children,
  variant = 'primary',
  disabled,
  type = 'button',
  onClick,
  size = 'default',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  size?: 'default' | 'sm'
}) {
  const styles = {
    primary:
      'bg-foreground text-background shadow-sm hover:opacity-90 hover:shadow-md',
    secondary:
      'border border-border bg-card text-foreground hover:bg-muted hover:border-foreground/15',
    danger:
      'border border-red-200/80 bg-red-50/50 text-red-700 hover:bg-red-50 hover:border-red-300',
  }

  const sizes = {
    default: 'px-6 py-2.5 text-sm',
    sm: 'px-4 py-2 text-xs',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full font-medium transition-all disabled:opacity-50 ${sizes[size]} ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

export function AdminMessage({
  ok,
  message,
}: {
  ok: boolean
  message: string
}) {
  if (!message) return null
  return (
    <p
      role="status"
      className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
        ok
          ? 'border border-emerald-200/80 bg-emerald-50/60 text-emerald-900'
          : 'border border-red-200/80 bg-red-50/60 text-red-800'
      }`}
    >
      {message}
    </p>
  )
}

export function AdminFileInput({
  name,
  accept,
  disabled,
  multiple,
  onFileChange,
}: {
  name: string
  accept: string
  disabled?: boolean
  multiple?: boolean
  onFileChange?: (file: File | null) => void
}) {
  return (
    <input
      type="file"
      name={name}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      onChange={(event) => {
        const file = event.target.files?.[0] ?? null
        onFileChange?.(file)
      }}
      className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:cursor-pointer file:rounded-full file:border file:border-border file:bg-card file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-foreground file:transition-colors hover:file:bg-muted"
    />
  )
}

export const AdminCard = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode
    className?: string
    hover?: boolean
  }
>(function AdminCard({ children, className = '', hover = false }, ref) {
  return (
    <div
      ref={ref}
      className={`admin-card p-6 ${hover ? 'admin-card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  )
})

export function AdminPanelToolbar({
  count,
  countLabel,
  action,
}: {
  count: number
  countLabel: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{count}</span>{' '}
        {countLabel}
      </p>
      {action}
    </div>
  )
}

export function AdminEmpty({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="admin-card flex flex-col items-center justify-center px-8 py-16 text-center">
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

export function AdminBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted'
}) {
  const styles = {
    default: 'bg-muted text-foreground/80',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-100 text-red-800',
    muted: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${styles[variant]}`}
    >
      {children}
    </span>
  )
}

export function AdminSectionHeading({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function AdminInfoBox({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'default' | 'warning' | 'info'
  className?: string
}) {
  const styles = {
    default: 'border-border bg-muted/30',
    warning: 'border-amber-200 bg-amber-50/70',
    info: 'border-border bg-card',
  }

  return (
    <div
      className={`rounded-xl border p-4 text-sm leading-relaxed ${styles[variant]} ${className}`}
    >
      {children}
    </div>
  )
}

export function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
