const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

export const API_BASE_URL = configuredBaseUrl
export const SESSION_STORAGE_KEY = 'optizenqor_admin_session'

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is missing. Add it to your .env file to connect the dashboard.')
  }
}

export function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeStoredSession(session) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, message: 'Invalid API response.', data: null, raw: payload }
  }
  return {
    success: payload.success !== false,
    message: payload.message ?? 'Request completed.',
    data: payload.data ?? payload,
    raw: payload,
  }
}

export function extractItems(payload) {
  const data = payload?.data
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(payload?.items)) {
    return payload.items
  }
  if (Array.isArray(payload?.results)) {
    return payload.results
  }
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key]
      }
    }
  }
  return []
}

export function createApiClient({ getSession, onSessionRefresh, onUnauthorized }) {
  async function request(endpoint, options = {}, allowRefresh = true) {
    assertApiBaseUrl()
    const session = getSession()
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    }

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
    const payload = await response.json().catch(() => ({}))

    if (response.status === 401 && allowRefresh && session?.refreshToken) {
      const refreshedSession = await refresh(session.refreshToken)
      if (refreshedSession) {
        onSessionRefresh(refreshedSession)
        return request(endpoint, options, false)
      }
    }

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || payload.error || `Request failed with ${response.status}`)
    }

    return normalizePayload(payload)
  }

  async function refresh(refreshToken) {
    assertApiBaseUrl()
    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Unable to refresh session.')
      }
      return {
        accessToken: payload.data?.accessToken ?? payload.data?.token ?? '',
        refreshToken: payload.data?.refreshToken ?? refreshToken,
        admin: payload.data?.session ?? null,
      }
    } catch {
      onUnauthorized()
      return null
    }
  }

  return { request, refresh }
}
