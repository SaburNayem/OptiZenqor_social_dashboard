import { useState } from 'react'
import { API_BASE_URL } from '../../services/apiClient'
import { AdminLoginForm } from '../../components/forms/AdminLoginForm'
import { useAdminSession } from '../../hooks/useAdminSession'

export function AdminLoginPage() {
  const { login } = useAdminSession()
  const [loginState, setLoginState] = useState({ email: '', password: '', loading: false, error: '' })
  const [resetState, setResetState] = useState({ loading: false, error: '', notice: '' })

  async function handleLogin(event) {
    event.preventDefault()
    setLoginState((current) => ({ ...current, loading: true, error: '' }))

    try {
      await login({
        email: loginState.email,
        password: loginState.password,
      })
    } catch (error) {
      setLoginState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Login failed.',
      }))
    } finally {
      setLoginState((current) => ({ ...current, loading: false }))
    }
  }

  async function handlePasswordReset() {
    const email = loginState.email.trim()

    if (!email) {
      setResetState({
        loading: false,
        error: 'Enter your admin email first so we can send a reset link.',
        notice: '',
      })
      return
    }

    if (!API_BASE_URL) {
      setResetState({
        loading: false,
        error: 'Password reset requires VITE_API_BASE_URL to be configured.',
        notice: '',
      })
      return
    }

    setResetState({ loading: true, error: '', notice: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      let payload = {}
      try {
        payload = await response.json()
      } catch {
        payload = {}
      }

      if (!response.ok) {
        throw new Error(payload.message || 'Password reset request failed.')
      }

      setResetState({
        loading: false,
        error: '',
        notice: payload.message || 'If that admin account exists, a reset link has been sent.',
      })
    } catch (error) {
      setResetState({
        loading: false,
        error: error instanceof Error ? error.message : 'Password reset request failed.',
        notice: '',
      })
    }
  }

  function clearResetFeedback() {
    setResetState((current) =>
      current.error || current.notice ? { ...current, error: '', notice: '' } : current,
    )
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-copy">
          <p className="eyebrow">OptiZenqor Admin</p>
          <h1>Control the platform from live PostgreSQL data.</h1>
          <p>
            This dashboard uses authenticated backend APIs only and renders live operational data.
          </p>
          {!API_BASE_URL ? (
            <p className="error-text">
              Missing `VITE_API_BASE_URL`. Create a `.env` file so the dashboard can connect to your backend.
            </p>
          ) : null}
        </div>

        <AdminLoginForm
          loginState={loginState}
          resetState={resetState}
          setLoginState={setLoginState}
          onSubmit={handleLogin}
          onPasswordReset={handlePasswordReset}
          onClearResetFeedback={clearResetFeedback}
        />
      </section>
    </main>
  )
}
