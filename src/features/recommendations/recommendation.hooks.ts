import { useQuery } from '@tanstack/react-query'
import { loadCommercialRecommendations } from './recommendation.service'

export const useCommercialRecommendations = (organizationId?: string) =>
  useQuery({
    queryKey: ['recommendations', organizationId],
    queryFn: () => loadCommercialRecommendations(organizationId!),
    enabled: Boolean(organizationId),
  })
