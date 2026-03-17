import { createBrowserClient } from '@supabase/ssr'

function parseCookies(cookieString: string) {
  const out: Record<string, string> = {}
  cookieString
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .forEach((c) => {
      const idx = c.indexOf('=')
      if (idx === -1) return
      const name = c.slice(0, idx)
      const value = c.slice(idx + 1)
      out[name] = value
    })
  return out
}

function serializeCookie(
  name: string,
  value: string,
  options?: {
    path?: string
    maxAge?: number
    expires?: Date
    sameSite?: 'lax' | 'strict' | 'none'
    secure?: boolean
  },
) {
  let str = `${name}=${value}`
  str += `; Path=${options?.path ?? '/'}`
  if (typeof options?.maxAge === 'number') str += `; Max-Age=${options.maxAge}`
  if (options?.expires) str += `; Expires=${options.expires.toUTCString()}`
  str += `; SameSite=${(options?.sameSite ?? 'lax').toUpperCase()}`
  if (options?.secure ?? window.location.protocol === 'https:') str += `; Secure`
  return str
}

// Browser client that persists auth session in cookies so middleware/server can read it.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const parsed = parseCookies(typeof document === 'undefined' ? '' : document.cookie ?? '')
          return Object.entries(parsed).map(([name, value]) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookie(name, value, {
              path: options?.path,
              maxAge: options?.maxAge,
              expires: options?.expires ? new Date(options.expires) : undefined,
              sameSite: (options?.sameSite as any) ?? 'lax',
              secure: options?.secure,
            })
          })
        },
      },
    },
  )
}
