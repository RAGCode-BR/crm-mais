import { taskSchema } from './task.schemas'

const validTask = {
  title: 'Retornar proposta',
  description: '',
  assignedMemberId: '11000000-0000-4000-8000-000000000001',
  priority: 'high' as const,
  status: 'pending' as const,
  type: 'follow_up' as const,
  dueAt: '2026-09-03T10:00',
  companyId: '',
  contactId: '',
  leadId: '',
  opportunityId: '',
}

describe('taskSchema', () => {
  it('accepts a complete follow-up task', () => {
    expect(taskSchema.safeParse(validTask).success).toBe(true)
  })

  it('requires title, owner and due date', () => {
    const result = taskSchema.safeParse({
      ...validTask,
      title: ' ',
      assignedMemberId: '',
      dueAt: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined()
      expect(result.error.flatten().fieldErrors.assignedMemberId).toBeDefined()
      expect(result.error.flatten().fieldErrors.dueAt).toBeDefined()
    }
  })
})
