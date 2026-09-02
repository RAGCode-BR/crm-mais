import type { ReactNode } from 'react'

export function FormField({
  children,
  error,
  label,
  required,
}: {
  children: ReactNode
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
      {error ? (
        <span className="text-xs font-normal text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}
