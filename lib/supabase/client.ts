import { createBrowserClient } from '@supabase/ssr'

// NOTE: This file is for client-side code
// DO NOT use environment variables with `NEXT_PUBLIC_` prefix here

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const createClient = () => supabase;
