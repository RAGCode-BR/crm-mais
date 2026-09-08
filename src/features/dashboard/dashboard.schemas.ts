import { z } from 'zod'

export const dashboardPeriodSchema = z
  .object({
    from: z.string().date('Data inicial inválida.'),
    to: z.string().date('Data final inválida.'),
  })
  .refine(({ from, to }) => from <= to, {
    message: 'A data inicial deve ser anterior à data final.',
    path: ['to'],
  })
  .refine(
    ({ from, to }) =>
      (new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) /
        86_400_000 <=
      366,
    { message: 'Selecione um período de até 366 dias.', path: ['to'] },
  )
