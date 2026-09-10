import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SettingsBackLink() {
  return (
    <Link
      className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
      to="/configuracoes"
    >
      <ArrowLeft className="size-4" /> Configurações
    </Link>
  )
}
