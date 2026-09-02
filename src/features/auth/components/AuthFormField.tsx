import type { InputHTMLAttributes } from 'react'

import { Input } from '@/components/ui/Input'

type AuthFormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  label: string
}

export function AuthFormField({ error, id, label, ...props }: AuthFormFieldProps) {
  const inputId = id ?? props.name
  const errorId = error && inputId ? `${inputId}-error` : undefined

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={inputId}>
        {label}
      </label>
      <Input aria-describedby={errorId} aria-invalid={Boolean(error)} id={inputId} {...props} />
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
