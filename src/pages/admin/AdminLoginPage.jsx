import { useState } from 'react'
import { AdminLoginForm } from '../../components/forms/AdminLoginForm'
import { useAdminSession } from '../../hooks/useAdminSession'

export function AdminLoginPage() {
  const { login } = useAdminSession()
  const [loginState, setLoginState] = useState({ email: '', password: '', loading: false, error: '' })

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

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-copy">
          <p className="eyebrow">OptiZenqor Admin</p>
          <h1>Control the platform from live PostgreSQL data.</h1>
          <p>
            This dashboard uses authenticated backend APIs only. No starter stats,
            no mock charts, and no local runtime dashboards.
          </p>
        </div>

        <AdminLoginForm
          loginState={loginState}
          setLoginState={setLoginState}
          onSubmit={handleLogin}
        />
      </section>
    </main>
  )
}
