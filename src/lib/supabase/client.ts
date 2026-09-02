import { createClient } from '@supabase/supabase-js'

import { supabaseConfig } from '@/lib/env'
import type { Database } from '@/types/database.types'

/**
 * The client remains null until local public credentials are configured.
 * Privileged keys must only exist in trusted backend/Edge Function environments.
 */
export const supabase = supabaseConfig
  ? createClient<Database>(
      supabaseConfig.VITE_SUPABASE_URL,
      supabaseConfig.VITE_SUPABASE_PUBLISHABLE_KEY,
    )
  : null
