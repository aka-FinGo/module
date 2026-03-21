import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️  Supabase env variables topilmadi! .env faylini tekshiring.')
}

export const supabase = createClient(
  SUPABASE_URL      || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
)

// Jadval nomlari — boshqa loyihalar bilan adashmaylik
export const TABLES = {
  modules: 'm_modules',
  orders:  'm_orders',
}