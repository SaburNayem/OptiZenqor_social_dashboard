import { useState } from 'react'
import { API_BASE_URL } from '../../services/apiClient'
import { AdminLoginForm } from '../../components/forms/AdminLoginForm'
import { useAdminSession } from '../../hooks/useAdminSession'

export function AdminLoginPage() {
  const { login } = useAdminSession()
  const [loginState, setLoginState] = useState({ email: '', password: '', loading: false, error: '' })
  const [resetState, setResetState] = useState({
    loading: false,
    completing: false,
    step: 'idle',
    error: '',
    notice: '',
  })
  const [resetDraft, setResetDraft] = useState({ otp: '', password: '', confirmPassword: '' })

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
        completing: false,
        step: 'idle',
        error: 'Enter your admin email first so we can send a reset link.',
        notice: '',
      })
      return
    }

    if (!API_BASE_URL) {
      setResetState({
        loading: false,
        completing: false,
        step: 'idle',
        error: 'Password reset requires VITE_API_BASE_URL to be configured.',
        notice: '',
      })
      return
    }

    setResetState((current) => ({ ...current, loading: true, error: '', notice: '' }))

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
        completing: false,
        step: 'verify',
        error: '',
        notice: payload.message || 'If that admin account exists, a password reset code has been sent.',
      })
    } catch (error) {
      setResetState({
        loading: false,
        completing: false,
        step: 'idle',
        error: error instanceof Error ? error.message : 'Password reset request failed.',
        notice: '',
      })
    }
  }

  async function handlePasswordResetComplete() {
    const email = loginState.email.trim()
    const otp = resetDraft.otp.trim()
    const password = resetDraft.password

    if (!otp || !password) {
      setResetState((current) => ({
        ...current,
        error: 'Enter the reset code and your new password.',
        notice: '',
      }))
      return
    }

    if (password.length < 8) {
      setResetState((current) => ({
        ...current,
        error: 'New password must be at least 8 characters.',
        notice: '',
      }))
      return
    }

    if (password !== resetDraft.confirmPassword) {
      setResetState((current) => ({
        ...current,
        error: 'New password and confirmation must match.',
        notice: '',
      }))
      return
    }

    if (!API_BASE_URL) {
      setResetState((current) => ({
        ...current,
        error: 'Password reset requires VITE_API_BASE_URL to be configured.',
        notice: '',
      }))
      return
    }

    setResetState((current) => ({ ...current, completing: true, error: '', notice: '' }))

    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })

      let payload = {}
      try {
        payload = await response.json()
      } catch {
        payload = {}
      }

      if (!response.ok) {
        throw new Error(payload.message || 'Password reset failed.')
      }

      setLoginState((current) => ({ ...current, password: '', error: '' }))
      setResetDraft({ otp: '', password: '', confirmPassword: '' })
      setResetState({
        loading: false,
        completing: false,
        step: 'idle',
        error: '',
        notice: payload.message || 'Password reset completed. Sign in with your new password.',
      })
    } catch (error) {
      setResetState((current) => ({
        ...current,
        completing: false,
        error: error instanceof Error ? error.message : 'Password reset failed.',
        notice: '',
      }))
    }
  }

  function cancelPasswordReset() {
    setResetDraft({ otp: '', password: '', confirmPassword: '' })
    setResetState({ loading: false, completing: false, step: 'idle', error: '', notice: '' })
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
          resetDraft={resetDraft}
          setLoginState={setLoginState}
          setResetDraft={setResetDraft}
          onSubmit={handleLogin}
          onPasswordReset={handlePasswordReset}
          onPasswordResetComplete={handlePasswordResetComplete}
          onCancelPasswordReset={cancelPasswordReset}
          onClearResetFeedback={clearResetFeedback}
        />
      </section>
    </main>
  )
}
