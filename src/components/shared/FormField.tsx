import type { ReactNode } from 'react'

export function FormField({
  children,
  description,
  error,
  label,
  required,
}: {
  children: ReactNode
  description?: string
  error?: string
  label: string
  required?: boolean
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {description && !error ? (
        <span className="text-xs font-normal text-muted-foreground">{description}</span>
      ) : null}
      {error ? (
        <span className="text-xs font-normal text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}
