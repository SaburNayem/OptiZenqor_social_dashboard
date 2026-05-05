import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  API_BASE_URL,
  clearStoredSession,
  createApiClient,
  readStoredSession,
  writeStoredSession,
} from '../services/apiClient'

const AdminSessionContext = createContext(null)

export function AdminSessionProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(readStoredSession()?.accessToken))
  const bootstrappedTokenRef = useRef(null)

  const apiClient = useMemo(
    () =>
      createApiClient({
        getSession: () => session,
        onSessionRefresh: (nextSession) => {
          setSession(nextSession)
          writeStoredSession(nextSession)
        },
        onUnauthorized: () => {
          clearStoredSession()
          setSession(null)
        },
      }),
    [session],
  )

  useEffect(() => {
    let cancelled = false

    async function bootstrapSession() {
      if (!session?.accessToken) {
        bootstrappedTokenRef.current = null
        setIsBootstrapping(false)
        return
      }

      if (bootstrappedTokenRef.current === session.accessToken) {
        setIsBootstrapping(false)
        return
      }

      setIsBootstrapping(true)
      try {
        const payload = await apiClient.request('/admin/auth/me')
        if (cancelled) {
          return
        }
        bootstrappedTokenRef.current = session.accessToken
        const nextSession = {
          ...(readStoredSession() ?? {}),
          admin: payload.data,
        }
        setSession(nextSession)
        writeStoredSession(nextSession)
      } catch {
        if (cancelled) {
          return
        }
        bootstrappedTokenRef.current = null
        clearStoredSession()
        setSession(null)
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [apiClient, session?.accessToken])

  const login = useCallback(async ({ email, password }) => {
    if (!API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL is missing. Add it to your .env file before signing in.')
    }

    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || 'Login failed.')
    }

    const nextSession = {
      accessToken: payload.data?.accessToken ?? payload.data?.token ?? '',
      refreshToken: payload.data?.refreshToken ?? '',
      admin: payload.data?.session ?? null,
    }
    setSession(nextSession)
    writeStoredSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(async () => {
    try {
      if (session?.accessToken) {
        await apiClient.request('/admin/auth/logout', { method: 'POST' })
      }
    } finally {
      clearStoredSession()
      setSession(null)
    }
  }, [apiClient, session?.accessToken])

  const value = useMemo(
    () => ({
      session,
      setSession,
      isBootstrapping,
      apiRequest: (endpoint, options = {}) => apiClient.request(endpoint, options),
      login,
      logout,
    }),
    [apiClient, isBootstrapping, login, logout, session],
  )

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}

export { AdminSessionContext }
