export const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Session token is dead (expired, invalidated by a password reset, etc.).
    // Wipe it and return to the sign-in screen instead of failing silently.
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
    if (res.status === 401 && !publicPaths.some((p) => path.startsWith(p))) {
      clearSession()
      window.location.hash = ''
      window.location.reload()
      throw new Error('Your session has expired. Please sign in again.')
    }

    const firstError =
      data.errors && typeof data.errors === 'object'
        ? Object.values(data.errors)[0][0]
        : data.message || `Request failed (${res.status})`
    throw new Error(firstError)
  }

  return data
}

export function saveSession({ user, token }) {
  localStorage.setItem('pb_token', token)
  localStorage.setItem('pb_user', JSON.stringify(user))
}

export function getSession() {
  const token = localStorage.getItem('pb_token')
  if (!token) return null
  try {
    return { token, user: JSON.parse(localStorage.getItem('pb_user')) }
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('pb_token')
  localStorage.removeItem('pb_user')
}
