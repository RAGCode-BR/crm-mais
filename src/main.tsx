import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import { AppProviders } from '@/app/providers/AppProviders'
import '@/styles/globals.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Elemento raiz da aplicação não encontrado.')
}

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
)
