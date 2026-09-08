import { Pause, Play, UserMinus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { cadenceEnrollmentStatusLabel } from '../cadence.constants'
import { useSetCadenceEnrollmentStatus } from '../cadence.hooks'
import type { CadenceEnrollmentRow } from '../cadence.types'

export function EnrollmentList({
  canWrite,
  enrollments,
  organizationId,
}: {
  canWrite: boolean
  enrollments: CadenceEnrollmentRow[]
  organizationId: string
}) {
  const mutation = useSetCadenceEnrollmentStatus(organizationId)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Progresso</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td className="px-4 py-3">
                  <Link className="font-medium hover:underline" to={`/leads/${enrollment.lead_id}`}>
                    {enrollment.leadName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{enrollment.leadDescription}</p>
                </td>
                <td className="px-4 py-3">{enrollment.assigneeName}</td>
                <td className="px-4 py-3">
                  Etapa {enrollment.current_step_position ?? '—'}
                  <p className="text-xs text-muted-foreground">
                    {enrollment.next_step_due_at
                      ? `Próxima: ${new Date(enrollment.next_step_due_at).toLocaleDateString('pt-BR')}`
                      : 'Sem próxima tarefa'}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {cadenceEnrollmentStatusLabel(enrollment.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {canWrite && enrollment.status === 'active' ? (
                      <Button
                        aria-label="Pausar"
                        className="size-9 px-0"
                        disabled={mutation.isPending}
                        onClick={() =>
                          mutation.mutate({ enrollmentId: enrollment.id, status: 'paused' })
                        }
                        variant="ghost"
                      >
                        <Pause className="size-4" />
                      </Button>
                    ) : null}
                    {canWrite && enrollment.status === 'paused' ? (
                      <Button
                        aria-label="Retomar"
                        className="size-9 px-0"
                        disabled={mutation.isPending}
                        onClick={() =>
                          mutation.mutate({ enrollmentId: enrollment.id, status: 'active' })
                        }
                        variant="ghost"
                      >
                        <Play className="size-4" />
                      </Button>
                    ) : null}
                    {canWrite &&
                    (enrollment.status === 'active' || enrollment.status === 'paused') ? (
                      <Button
                        aria-label="Remover"
                        className="size-9 px-0 text-red-600"
                        disabled={mutation.isPending}
                        onClick={() =>
                          mutation.mutate({ enrollmentId: enrollment.id, status: 'removed' })
                        }
                        variant="ghost"
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mutation.error ? (
        <p className="border-t border-border p-3 text-sm text-red-600">{mutation.error.message}</p>
      ) : null}
    </div>
  )
}
