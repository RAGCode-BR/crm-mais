import { Spinner } from '@/components/ui/Spinner'

export function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner />
        Verificando sua sessão...
      </div>
    </main>
  )
}
