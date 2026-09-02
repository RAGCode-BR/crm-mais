import { AlertCircle, CheckCircle2 } from 'lucide-react'

type AuthNoticeProps = {
  message: string
  tone?: 'error' | 'success'
}

export function AuthNotice({ message, tone = 'error' }: AuthNoticeProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div
      className={
        tone === 'success'
          ? 'flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
          : 'flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
      }
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
