import { useState } from 'react'
import { api, clearSession } from './api'
import { LogoMark, IconCheck, IconAlert } from './icons'

function readHashQuery() {
  const hash = window.location.hash.replace(/^#/, '')
  const qIndex = hash.indexOf('?')
  return new URLSearchParams(qIndex >= 0 ? hash.slice(qIndex + 1) : window.location.search)
}

export default function ResetPasswordPage() {
  const [params] = useState(readHashQuery)
  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Opening a reset page means account-recovery mode: any saved session
  // must not carry over to the sign-in screen afterwards.
  clearSession()

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await api('/reset-password', {
        method: 'POST',
        body: { email, code, password, password_confirmation: confirm },
      })
      clearSession()
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="reset-wrap">
      <div className="auth-box card" style={{ width: 420 }}>
        <div className="reset-brand">
          <LogoMark size={38} />
          <strong>SmashPoint</strong>
        </div>

        {done ? (
          <div className="success-view">
            <div className="success-check"><IconCheck size={28} /></div>
            <h2>Password reset</h2>
            <p className="auth-sub">You can now sign in with your new password.</p>
            <a className="btn primary block" href="./">Go to sign in</a>
          </div>
        ) : (
          <>
            <h2>Reset your password</h2>
            <p className="auth-sub">
              Enter the 6-digit code we emailed you, then choose a new password.
            </p>
            <form onSubmit={submit} className="auth-form">
              <label className="field">
                <span className="form-label">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </label>
              <label className="field">
                <span className="form-label">6-digit code</span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="e.g. 483920"
                  style={{ letterSpacing: 8, fontSize: '1.2rem', textAlign: 'center' }}
                />
              </label>
              <label className="field">
                <span className="form-label">New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="field">
                <span className="form-label">Confirm new password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repeat it"
                />
              </label>
              {error && (
                <div className="alert" role="alert">
                  <IconAlert size={16} />
                  {error}
                </div>
              )}
              <button className="btn primary block" disabled={busy}>
                {busy ? 'Saving…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
