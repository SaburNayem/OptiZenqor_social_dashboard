import { useState } from 'react'

export function AdminLoginForm({
  loginState,
  resetState,
  setLoginState,
  onSubmit,
  onPasswordReset,
  onClearResetFeedback = () => {},
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label>
        <span>Email</span>
        <input
          type="email"
          value={loginState.email}
          onChange={(event) => {
            onClearResetFeedback()
            setLoginState((current) => ({ ...current, email: event.target.value }))
          }}
        />
      </label>
      <label>
        <span>Password</span>
        <div className="password-field">
          <input
            type={isPasswordVisible ? 'text' : 'password'}
            value={loginState.password}
            onChange={(event) => {
              onClearResetFeedback()
              setLoginState((current) => ({ ...current, password: event.target.value }))
            }}
          />
          <button
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            className="password-visibility-button"
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        </div>
      </label>
      <div className="login-form-actions">
        <button
          className="forgot-password-button"
          type="button"
          disabled={resetState.loading}
          onClick={onPasswordReset}
        >
          {resetState.loading ? 'Sending reset link...' : 'Forgot password?'}
        </button>
      </div>
      <button type="submit" disabled={loginState.loading}>
        {loginState.loading ? 'Signing in...' : 'Sign in'}
      </button>
      {resetState.notice ? (
        <p className="success-text" role="status">
          {resetState.notice}
        </p>
      ) : null}
      {resetState.error ? (
        <p className="error-text" role="alert">
          {resetState.error}
        </p>
      ) : null}
      {loginState.error ? <p className="error-text">{loginState.error}</p> : null}
    </form>
  )
}
