import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { taskViews } from '../task.constants'

export function TaskViewNav() {
  return (
    <nav
      aria-label="Visões de tarefas"
      className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
    >
      {taskViews.map((view) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
          end={view.value === 'mine'}
          key={view.value}
          to={view.path}
        >
          {view.label}
        </NavLink>
      ))}
    </nav>
  )
}
