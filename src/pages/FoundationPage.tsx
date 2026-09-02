import { CheckCircle2, Database, Layers3, ShieldCheck } from 'lucide-react'

import { isSupabaseConfigured } from '@/lib/env'

const foundations = [
  {
    title: 'Frontend modular',
    description: 'React, TypeScript, Vite e roteamento prontos para receber os módulos.',
    icon: Layers3,
  },
  {
    title: 'Camada de dados',
    description: 'TanStack Query configurado com padrões seguros de cache e tentativas.',
    icon: Database,
  },
  {
    title: 'Segurança por padrão',
    description: 'Credenciais locais ignoradas e nenhuma chave privilegiada no navegador.',
    icon: ShieldCheck,
  },
]

export function FoundationPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
            Bloco 0 · Fundação técnica
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            CRM+ preparado para evoluir por domínio.
          </h1>
          <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">
            A base técnica está organizada. As funcionalidades comerciais serão implementadas
            incrementalmente, somente nos blocos autorizados.
          </p>
        </div>

        <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {foundations.map(({ title, description, icon: Icon }) => (
            <article key={title} className="bg-card p-6">
              <Icon className="mb-5 size-5 text-primary" aria-hidden="true" />
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </section>

        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Supabase:{' '}
          <span className={isSupabaseConfigured ? 'text-emerald-700' : 'text-amber-700'}>
            {isSupabaseConfigured
              ? 'variáveis locais configuradas'
              : 'aguardando variáveis locais para conexão'}
          </span>
        </p>
      </div>
    </main>
  )
}
