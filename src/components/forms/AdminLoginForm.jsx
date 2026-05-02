export function AdminLoginForm({ loginState, setLoginState, onSubmit }) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label>
        <span>Email</span>
        <input
          type="email"
          value={loginState.email}
          onChange={(event) =>
            setLoginState((current) => ({ ...current, email: event.target.value }))
          }
        />
      </label>
      <label>
        <span>Password</span>
        <input
          type="password"
          value={loginState.password}
          onChange={(event) =>
            setLoginState((current) => ({ ...current, password: event.target.value }))
          }
        />
      </label>
      <button type="submit" disabled={loginState.loading}>
        {loginState.loading ? 'Signing in...' : 'Sign in'}
      </button>
      {loginState.error ? <p className="error-text">{loginState.error}</p> : null}
    </form>
  )
}
