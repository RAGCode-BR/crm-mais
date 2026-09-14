import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type PropsWithChildren } from 'react'

import { Button } from '@/components/ui/Button'

type State = { hasError: boolean }

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Erro não tratado na aplicação:', error, info.componentStack)
  }

  override render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <section className="max-w-lg text-center" role="alert">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200">
            <AlertTriangle aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-5 text-sm font-medium text-primary">Erro inesperado</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Não foi possível carregar a aplicação
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tente recarregar a página. Se o problema continuar, informe à equipe responsável o
            horário em que ele ocorreu.
          </p>
          <div className="mt-7 flex justify-center">
            <Button onClick={() => window.location.reload()}>
              <RotateCcw aria-hidden="true" className="size-4" /> Recarregar
            </Button>
          </div>
        </section>
      </main>
    )
  }
}
