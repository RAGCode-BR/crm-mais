import type { Option } from './crm.types'

export const PAGE_SIZE = 10

export const companyStatusOptions: Option[] = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' },
  { value: 'archived', label: 'Arquivada' },
]

export const leadStatusOptions: Option[] = [
  { value: 'new', label: 'Novo' },
  { value: 'researching', label: 'Em pesquisa' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'unqualified', label: 'Desqualificado' },
  { value: 'converted', label: 'Convertido' },
  { value: 'archived', label: 'Arquivado' },
]

export const temperatureOptions: Option[] = [
  { value: 'cold', label: 'Frio' },
  { value: 'warm', label: 'Morno' },
  { value: 'hot', label: 'Quente' },
]

export const roleCanWrite = (role?: string) =>
  role === 'owner' || role === 'admin' || role === 'manager' || role === 'sales'

export const statusLabel = (value: string) =>
  [...companyStatusOptions, ...leadStatusOptions].find((option) => option.value === value)?.label ??
  value

export const temperatureLabel = (value: string) =>
  temperatureOptions.find((option) => option.value === value)?.label ?? value
