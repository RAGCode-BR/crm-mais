import { AlertTriangle } from 'lucide-react'

export function AuthUnconfigured() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="max-w-lg text-center" role="alert">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200">
          <AlertTriangle aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-5 text-sm font-medium text-primary">Configuração ausente</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          A conexão com o Supabase não foi configurada
        </h1>
        <p className="mt-3 text-muted-foreground">
          As variáveis de ambiente do Supabase não foram definidas neste ambiente. Configure
          `VITE_SUPABASE_URL` e a chave pública antes de acessar o sistema.
        </p>
      </section>
    </main>
  )
}
