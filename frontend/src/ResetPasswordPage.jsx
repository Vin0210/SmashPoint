import { useState } from 'react'
import { api, clearSession } from './api'
import { LogoMark, IconCheck, IconAlert } from './icons'

function readResetContext() {
  // Link format 1: #/reset-password/<token>/<email>   (no "?" — survives
  // mail clients that truncate everything after a question mark)
  const raw = window.location.hash.replace(/^#/, '')
  const pathOnly = raw.split('?')[0]
  const segs = pathOnly.split('/').filter(Boolean)
  if (segs[0] === 'reset-password' && segs.length >= 3) {
    return { token: segs[1], email: decodeURIComponent(segs.slice(2).join('/')) }
  }
  // Link format 2 (legacy): #/reset-password?token=...&email=...
  const qIndex = raw.indexOf('?')
  const query = new URLSearchParams(qIndex >= 0 ? raw.slice(qIndex + 1) : window.location.search)
  return { token: query.get('token') || '', email: query.get('email') || '' }
}

export default function ResetPasswordPage() {
  const [ctx] = useState(readResetContext)
  const token = ctx.token
  const emailParam = ctx.email
  const validLink = Boolean(token && emailParam)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Opening a reset link means account-recovery mode: any saved session
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
        body: { token, email: emailParam, password, password_confirmation: confirm },
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

        {!validLink ? (
          <>
            <h2>Invalid link</h2>
            <p className="auth-sub">
              This password reset link is missing its token. Please request a new one.
            </p>
            <a className="btn block" href="./">Back to sign in</a>
          </>
        ) : done ? (
          <div className="success-view">
            <div className="success-check"><IconCheck size={28} /></div>
            <h2>Password reset</h2>
            <p className="auth-sub">You can now sign in with your new password.</p>
            <a className="btn primary block" href="./">Go to sign in</a>
          </div>
        ) : (
          <>
            <h2>Set a new password</h2>
            <p className="auth-sub">Resetting the password for <strong>{emailParam}</strong>.</p>
            <form onSubmit={submit} className="auth-form">
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
