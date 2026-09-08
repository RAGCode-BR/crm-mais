import { render, screen } from '@testing-library/react'
import { Target } from 'lucide-react'
import { BarChart } from './BarChart'
import { MetricCard } from './MetricCard'

describe('dashboard components', () => {
  it('formats commercial currency metrics', () => {
    render(<MetricCard format="currency" icon={Target} label="Valor do pipeline" value={12500} />)
    expect(screen.getByText('Valor do pipeline')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*12\.500/)).toBeInTheDocument()
  })

  it('shows the chart empty state without inventing data', () => {
    render(<BarChart data={[]} description="Distribuição" title="Oportunidades por etapa" />)
    expect(screen.getByText('Ainda não há dados para este gráfico.')).toBeInTheDocument()
  })
})
