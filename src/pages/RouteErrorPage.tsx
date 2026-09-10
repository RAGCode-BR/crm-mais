import { AlertTriangle, House, RotateCcw } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/Button'

export function RouteErrorPage() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : null

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="max-w-lg text-center" role="alert">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200">
          <AlertTriangle aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-5 text-sm font-medium text-primary">
          {status ? `Erro ${status}` : 'Erro inesperado'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-3 text-muted-foreground">
          Tente novamente. Se o problema continuar, informe à equipe responsável o horário em que
          ele ocorreu.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => window.location.reload()}>
            <RotateCcw aria-hidden="true" className="size-4" /> Tentar novamente
          </Button>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
            to="/"
          >
            <House aria-hidden="true" className="size-4" /> Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  )
}
