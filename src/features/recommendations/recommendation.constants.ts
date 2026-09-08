export const recommendationPriorities = [
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
]

export const recommendationCategories = [
  { value: 'lead', label: 'Leads' },
  { value: 'task', label: 'Tarefas' },
  { value: 'opportunity', label: 'Oportunidades' },
]

export const recommendationPriorityLabel = (priority: string) =>
  recommendationPriorities.find(({ value }) => value === priority)?.label ?? priority
