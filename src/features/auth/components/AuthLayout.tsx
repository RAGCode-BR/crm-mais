import type { PropsWithChildren, ReactNode } from 'react'

import { BrandLogo } from '@/components/shared/BrandLogo'

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
          <BrandLogo className="mb-10" />

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
          <BrandLogo className="mb-6 w-48" />
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
