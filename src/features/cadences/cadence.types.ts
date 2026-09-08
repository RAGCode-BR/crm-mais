import type { Option, Paginated } from '@/features/crm/crm.types'
import type {
  Cadence,
  CadenceEnrollment,
  CadenceEnrollmentStatus,
  CadenceStatus,
  CadenceStep,
} from '@/types/database/cadence'
import type { TaskType } from '@/types/database/engagement'

export type CadenceStepInput = {
  dayNumber: number
  type: TaskType
  title: string
  description: string
}

export type CadenceInput = {
  name: string
  description: string
  status: CadenceStatus
  steps: CadenceStepInput[]
}

export type CadenceFilters = { search: string; status: string }
export type CadenceEnrollmentFilters = { page: number; pageSize: number; status: string }

export type CadenceSummary = Cadence & {
  stepCount: number
  activeEnrollmentCount: number
  completedEnrollmentCount: number
}

export type CadenceEnrollmentRow = CadenceEnrollment & {
  leadName: string
  leadDescription: string
  assigneeName: string
}

export type CadenceDetails = {
  cadence: Cadence
  steps: CadenceStep[]
  enrollments: Paginated<CadenceEnrollmentRow>
}

export type CadenceLookups = {
  members: Option[]
  leads: Array<Option & { description: string }>
}

export type EnrollLeadsInput = { leadIds: string[]; assignedMemberId: string }
export type SetEnrollmentStatusInput = {
  enrollmentId: string
  status: Extract<CadenceEnrollmentStatus, 'active' | 'paused' | 'removed'>
}
