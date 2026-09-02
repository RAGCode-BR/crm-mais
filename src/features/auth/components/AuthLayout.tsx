import { ShieldCheck } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

type AuthLayoutProps = PropsWithChildren<{
  title: string
  description: string
  footer?: ReactNode
}>

export function AuthLayout({ children, description, footer, title }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              C+
            </span>
            CRM+
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>

          {children}

          {footer ? (
            <div className="mt-7 text-center text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </section>

      <aside className="hidden border-l border-border bg-card p-12 lg:flex lg:items-end">
        <div className="max-w-lg">
          <ShieldCheck className="mb-6 size-8 text-primary" aria-hidden="true" />
          <p className="text-2xl font-medium leading-9">
            Segurança multiempresa aplicada no banco, do primeiro acesso à operação comercial.
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Cada consulta respeita a organização ativa e o papel do usuário por meio de políticas
            RLS.
          </p>
        </div>
      </aside>
    </main>
  )
}
