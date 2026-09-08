import { useMutation } from '@tanstack/react-query'

import { requestCommercialAi } from './ai.service'

export const useCommercialAi = () => useMutation({ mutationFn: requestCommercialAi })
