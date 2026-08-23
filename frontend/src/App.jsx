import { useEffect, useState } from 'react'
import { getSession, saveSession, clearSession, api } from './api'
import AuthPage from './AuthPage'
import CourtsPage from './CourtsPage'
import MyBookings from './MyBookings'
import AdminPage from './AdminPage'
import ProfilePage from './ProfilePage'
import ResetPasswordPage from './ResetPasswordPage'
import {
  LogoMark,
  IconGrid,
  IconCalendar,
  IconActivity,
  IconLogout,
  IconUser,
} from './icons'
import './App.css'

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

function isResetRoute() {
  return window.location.hash.startsWith('#/reset-password')
}

export default function App() {
  const [session, setSession] = useState(getSession())
  // Saved sessions are re-validated against /me on boot: a password reset
  // or admin reset invalidates tokens server-side, and stale sessions
  // must not open the app.
  const [booted, setBooted] = useState(() => !getSession())
  const [tab, setTab] = useState('courts')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!session || booted) return
    let cancelled = false
    api('/me', { token: session.token })
      .then((me) => {
        if (cancelled) return
        const fresh = { ...session, user: me.user ?? me }
        setSession(fresh)
        saveSession(fresh)
        setBooted(true)
      })
      .catch(() => {
        if (cancelled) return
        clearSession()
        setSession(null)
        setBooted(true)
      })
    return () => {
      cancelled = true
    }
  }, [session, booted])

  if (isResetRoute()) {
    return <ResetPasswordPage />
  }

  if (!booted) {
    return (
      <div className="boot-screen" role="status" aria-label="Loading SmashPoint">
        <LogoMark size={52} />
        <span className="boot-ring" />
      </div>
    )
  }

  if (!session) {
    return <AuthPage onAuth={setSession} />
  }

  async function logout() {
    try {
      await api('/logout', { method: 'POST', token: session.token })
    } catch {
      // token may already be invalid; clear locally anyway
    }
    clearSession()
    setSession(null)
    setTab('courts')
  }

  function updateUser(user) {
    const next = { ...session, user }
    localStorage.setItem('pb_user', JSON.stringify(user))
    setSession(next)
  }

  const isAdmin = session.user.role === 'admin'

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="brand"
            onClick={() => setTab(isAdmin ? 'admin' : 'courts')}
            aria-label="SmashPoint home"
          >
            <LogoMark size={36} />
            <span className="brand-name">
              SmashPoint
              <small>Pickleball Courts</small>
            </span>
          </button>

          <nav className="topnav" aria-label="Main navigation">
            {!isAdmin && (
              <>
                <button
                  className={`nav-link ${tab === 'courts' ? 'active' : ''}`}
                  onClick={() => setTab('courts')}
                >
                  <IconGrid size={16} />
                  <span>Courts</span>
                </button>
                <button
                  className={`nav-link ${tab === 'bookings' ? 'active' : ''}`}
                  onClick={() => setTab('bookings')}
                >
                  <IconCalendar size={16} />
                  <span>My Bookings</span>
                </button>
              </>
            )}
            {isAdmin && (
              <button
                className={`nav-link ${tab === 'admin' ? 'active' : ''}`}
                onClick={() => setTab('admin')}
              >
                <IconActivity size={16} />
                <span>Dashboard</span>
              </button>
            )}
            <button
              className={`nav-link ${tab === 'profile' ? 'active' : ''}`}
              onClick={() => setTab('profile')}
            >
              <IconUser size={16} />
              <span>Profile</span>
            </button>
          </nav>

          <div className="user-chip">
            <button
              type="button"
              className="avatar as-button"
              title="Open profile"
              onClick={() => setTab('profile')}
            >
              {session.user.photo_url ? (
                <img src={session.user.photo_url} alt={session.user.name} />
              ) : (
                initials(session.user.name)
              )}
            </button>
            <span className="user-meta">
              <strong>{session.user.name}</strong>
              <small>{isAdmin ? 'Administrator' : 'Player'}</small>
            </span>
            <button className="icon-btn" onClick={logout} title="Log out" aria-label="Log out">
              <IconLogout size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {tab === 'profile' ? (
          <ProfilePage
            token={session.token}
            user={session.user}
            onUserUpdated={updateUser}
          />
        ) : isAdmin ? (
          <AdminPage token={session.token} />
        ) : tab === 'courts' ? (
          <CourtsPage
            token={session.token}
            onBooked={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <MyBookings token={session.token} refreshKey={refreshKey} />
        )}
      </main>
    </div>
  )
}
