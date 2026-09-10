import { Building2, ContactRound, GitBranch, ListTodo, Search, Target } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'
import { cn } from '@/lib/utils/cn'

import { useGlobalSearch } from '../search.hooks'
import type { SearchEntityType } from '../search.types'
import { groupSearchResults, searchEntityLabels } from '../search.utils'

const icons = {
  company: Building2,
  contact: ContactRound,
  lead: Target,
  opportunity: GitBranch,
  task: ListTodo,
} satisfies Record<SearchEntityType, typeof Search>

export function GlobalSearchPalette({
  onOpenChange,
  open,
}: {
  onOpenChange(open: boolean): void
  open: boolean
}) {
  const { activeOrganization } = useOrganization()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const navigate = useNavigate()
  const search = useGlobalSearch(activeOrganization?.organizationId, query)
  const results = search.data ?? []
  const groups = groupSearchResults(results)
  const orderedResults = groups.flatMap(([, group]) => group)
  const closePalette = useCallback(() => {
    setQuery('')
    setActiveIndex(0)
    onOpenChange(false)
  }, [onOpenChange])

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) closePalette()
        else onOpenChange(true)
      }
      if (event.key === 'Escape' && open) closePalette()
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [closePalette, onOpenChange, open])

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0)
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = paletteRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', trapFocus)
      previousFocusRef.current?.focus()
    }
  }, [open])

  const select = (index: number) => {
    const selected = orderedResults[index]
    if (!selected) return
    closePalette()
    navigate(selected.path)
  }

  if (!open) return null
  return (
    <div
      aria-label="Busca global"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[10vh]"
      onMouseDown={(event) => event.currentTarget === event.target && closePalette()}
      role="dialog"
    >
      <div
        className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        ref={paletteRef}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          <input
            aria-activedescendant={
              orderedResults[activeIndex] ? `global-result-${activeIndex}` : undefined
            }
            aria-controls="global-search-results"
            aria-label="Pesquisar em todo o CRM"
            autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                if (orderedResults.length)
                  setActiveIndex((current) => Math.min(current + 1, orderedResults.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActiveIndex((current) => Math.max(current - 1, 0))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                select(activeIndex)
              }
            }}
            placeholder="Busque empresas, contatos, leads, oportunidades e tarefas..."
            ref={inputRef}
            role="combobox"
            value={query}
          />
          <kbd className="hidden rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>
        <div className="overflow-y-auto p-2" id="global-search-results" role="listbox">
          {query.trim().length < 2 ? (
            <StatePanel>
              <Search className="mx-auto mb-3 size-7" />
              Digite pelo menos 2 caracteres para pesquisar.
            </StatePanel>
          ) : search.isLoading ? (
            <StatePanel kind="loading">Pesquisando no CRM...</StatePanel>
          ) : search.error ? (
            <StatePanel kind="error">{search.error.message}</StatePanel>
          ) : results.length === 0 ? (
            <StatePanel>Nenhum resultado encontrado para “{query.trim()}”.</StatePanel>
          ) : (
            groups.map(([entityType, group]) => (
              <section className="py-1" key={entityType}>
                <h2 className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {searchEntityLabels[entityType]}
                </h2>
                {group.map((result) => {
                  const index = orderedResults.indexOf(result)
                  const Icon = icons[result.entityType]
                  return (
                    <button
                      aria-selected={activeIndex === index}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                        activeIndex === index ? 'bg-muted' : 'hover:bg-muted/60',
                      )}
                      id={`global-result-${index}`}
                      key={`${result.entityType}-${result.entityId}`}
                      onClick={() => select(index)}
                      onMouseEnter={() => setActiveIndex(index)}
                      role="option"
                      type="button"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{result.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </section>
            ))
          )}
        </div>
        <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:flex">
          <span>↑↓ navegar</span>
          <span>Enter abrir</span>
          <span>Esc fechar</span>
        </div>
      </div>
    </div>
  )
}
