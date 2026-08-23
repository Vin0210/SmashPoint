import { useState } from 'react'
import { api, saveSession } from './api'
import {
  LogoMark,
  IconCheck,
  IconUser,
  IconArrowRight,
  IconAlert,
  IconClock,
} from './icons'

export default function AuthPage({ onAuth }) {
  // 'login' | 'register' | 'forgot' | 'forgot-sent'
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'forgot') {
        await api('/forgot-password', { method: 'POST', body: { email: form.email } })
        setMode('forgot-sent')
        return
      }
      const path = mode === 'login' ? '/login' : '/register'
      const session = await api(path, { method: 'POST', body: form })
      saveSession(session)
      onAuth(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth-hero">
        <div className="auth-brand">
          <LogoMark size={42} />
          <span>
            SmashPoint
            <small>Pickleball Courts</small>
          </span>
        </div>

        <div className="auth-hero-copy">
          <h1>
            Book your court.
            <br />
            <em>Own the game.</em>
          </h1>
          <p>
            Premium indoor and outdoor pickleball courts with real-time
            availability. Reserve in seconds — play within the hour.
          </p>
          <ul className="auth-points">
            <li>
              <span className="pt-icon"><IconCheck size={14} /></span>
              Live court availability, updated in real time
            </li>
            <li>
              <span className="pt-icon"><IconCheck size={14} /></span>
              Instant confirmation with a booking reference
            </li>
            <li>
              <span className="pt-icon"><IconCheck size={14} /></span>
              Pay your way — cash or e-wallet
            </li>
          </ul>
        </div>

        <div className="auth-hero-foot">
          <IconClock size={15} />
          Open daily · 7:00 AM – 10:00 PM
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-box">
          {mode === 'forgot' || mode === 'forgot-sent' ? (
            <>
              <button type="button" className="back-link" onClick={() => setMode('login')}>
                ← Back to sign in
              </button>
              {mode === 'forgot' ? (
                <>
                  <h2>Forgot password?</h2>
                  <p className="auth-sub">
                    Enter your account email and we&apos;ll send you a 6-digit reset code.
                  </p>
                  <form onSubmit={submit} className="auth-form">
                    <label className="field">
                      <span className="form-label">Email</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        required
                        placeholder="you@mail.com"
                      />
                    </label>
                    {error && (
                      <div className="alert" role="alert">
                        <IconAlert size={16} />
                        {error}
                      </div>
                    )}
                    <button className="btn primary block" disabled={busy}>
                      {busy ? 'Sending…' : 'Send reset code'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2>Check your inbox</h2>
                  <p className="auth-sub">
                    If an account exists for <strong>{form.email}</strong>, a 6-digit
                    reset code is on its way. Open the reset page from the menu, enter
                    the code and choose a new password. The code expires in 60 minutes.
                  </p>
                  <a className="btn primary block" href="#/reset-password">
                    Enter reset code
                  </a>
                  <button className="btn block" style={{ marginTop: 8 }} onClick={() => setMode('login')}>
                    Back to sign in
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="auth-sub">
                {mode === 'login'
                  ? 'Sign in to book courts and manage your reservations.'
                  : 'Join SmashPoint and get on the court in under a minute.'}
              </p>

              <div className="segmented" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`seg-btn ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => setMode('login')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={`seg-btn ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
              </div>

              <form onSubmit={submit} className="auth-form">
                {mode === 'register' && (
                  <>
                    <label className="field">
                      <span className="form-label">Name</span>
                      <span className="field-icon"><IconUser size={16} /></span>
                      <input value={form.name} onChange={set('name')} required placeholder="Jane Doe" />
                    </label>
                    <label className="field">
                      <span className="form-label">Phone (optional)</span>
                      <input value={form.phone} onChange={set('phone')} placeholder="012-345-6789" />
                    </label>
                  </>
                )}
                <label className="field">
                  <span className="form-label">Email</span>
                  <input type="email" value={form.email} onChange={set('email')} required placeholder="you@mail.com" />
                </label>
                <label className="field">
                  <span className="form-label">Password</span>
                  <input type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="••••••" />
                </label>

                {error && (
                  <div className="alert" role="alert">
                    <IconAlert size={16} />
                    {error}
                  </div>
                )}

                <button className="btn primary block" disabled={busy}>
                  {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                  {!busy && <IconArrowRight size={16} />}
                </button>
              </form>

              {mode === 'login' && (
                <p style={{ textAlign: 'center', marginTop: 14 }}>
                  <button type="button" className="link-btn" onClick={() => setMode('forgot')}>
                    Forgot password?
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
