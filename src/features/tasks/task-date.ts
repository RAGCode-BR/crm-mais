export function todayBounds(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function toDateTimeLocal(value?: string | null) {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function isTaskOverdue(dueAt: string | null, status: string) {
  return Boolean(
    dueAt && status !== 'completed' && status !== 'cancelled' && new Date(dueAt) < new Date(),
  )
}
