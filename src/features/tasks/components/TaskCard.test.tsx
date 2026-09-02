import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Task } from '@/types/database/engagement'
import { TaskCard } from './TaskCard'

const task: Task = {
  id: '60000000-0000-4000-8000-000000000001',
  organization_id: '10000000-0000-4000-8000-000000000001',
  company_id: null,
  contact_id: null,
  lead_id: null,
  opportunity_id: null,
  assigned_member_id: '11000000-0000-4000-8000-000000000001',
  title: 'Retornar proposta',
  description: 'Confirmar condições comerciais.',
  priority: 'high',
  status: 'pending',
  type: 'follow_up',
  due_at: '2020-01-01T12:00:00.000Z',
  completed_at: null,
  created_at: '2020-01-01T10:00:00.000Z',
  updated_at: '2020-01-01T10:00:00.000Z',
  created_by: null,
}

const maps = {
  companies: new Map<string, string>(),
  contacts: new Map<string, string>(),
  leads: new Map<string, string>(),
  opportunities: new Map<string, string>(),
}

describe('TaskCard', () => {
  it('shows an overdue task with a discreet warning and completes it', async () => {
    const user = userEvent.setup()
    const onStatus = vi.fn()
    render(
      <MemoryRouter>
        <TaskCard canWrite maps={maps} onStatus={onStatus} task={task} />
      </MemoryRouter>,
    )

    expect(screen.getByText('· atrasada')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /concluir/i }))
    expect(onStatus).toHaveBeenCalledWith(task.id, 'completed')
  })

  it('does not expose actions to a read-only user', () => {
    render(
      <MemoryRouter>
        <TaskCard canWrite={false} maps={maps} onStatus={vi.fn()} task={task} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: /concluir/i })).not.toBeInTheDocument()
  })
})
