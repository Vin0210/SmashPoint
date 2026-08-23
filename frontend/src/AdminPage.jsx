import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import { PAYMENT_LABELS } from './payments'
import { peso, fmtRange } from './format'
import {
  IconWallet,
  IconCalendar,
  IconActivity,
  IconTrendingUp,
  IconClock,
  IconX,
  IconAlert,
  IconUsers,
} from './icons'

const todayStr = () => new Date().toISOString().slice(0, 10)

/* ---------------- Stats cards ---------------- */
function Stats({ token, refreshKey }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api('/admin/stats', { token })
      .then((s) => {
        if (cancelled) return
        setStats(s)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [token, refreshKey])

  if (error) {
    return (
      <div className="alert" role="alert">
        <IconAlert size={16} />
        {error}
      </div>
    )
  }
  if (!stats) return <div className="spinner" aria-label="Loading stats" />

  const cards = [
    { label: 'Collected today', value: peso(stats.revenue_paid_today), icon: IconWallet, tone: 'tone-lime' },
    { label: 'Due today', value: peso(stats.revenue_due_today), icon: IconClock, tone: 'tone-amber' },
    { label: 'Bookings today', value: stats.bookings_today, icon: IconCalendar, tone: 'tone-blue' },
    { label: 'Occupancy today', value: `${stats.occupancy_today}%`, icon: IconActivity, tone: 'tone-green' },
    { label: 'Next 7 days', value: stats.bookings_next_7_days, icon: IconTrendingUp, tone: 'tone-violet' },
  ]

  return (
    <div className="stat-grid">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="card stat-card">
          <span className={`stat-icon ${tone}`}><Icon size={21} /></span>
          <div className="stat-meta">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Schedule / bookings table ---------------- */
function Schedule({ token, onMutate }) {
  const [rows, setRows] = useState([])
  const [date, setDate] = useState(todayStr())
  const [status, setStatus] = useState('active')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (status !== 'all') params.set('status', status)
    api(`/admin/bookings?${params.toString()}`, { token })
      .then(setRows)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [token, date, status])

  async function setPayment(b, payment_status) {
    setBusyId(b.id)
    try {
      await api(`/admin/bookings/${b.id}/payment`, {
        method: 'PATCH',
        token,
        body: { payment_status },
      })
      load()
      if (onMutate) onMutate()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function cancelBooking(b) {
    if (!window.confirm(`Cancel booking ${b.reference}?`)) return
    setBusyId(b.id)
    try {
      await api(`/bookings/${b.id}/cancel`, { method: 'PATCH', token })
      load()
      if (onMutate) onMutate()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="section-head">
        <div className="section-title">
          <h2>Schedule</h2>
          <p className="section-sub">Review bookings and update payment status.</p>
        </div>
        <div className="filter-row" style={{ margin: 0 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert" role="alert">
          <IconAlert size={16} />
          {error}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <div className="empty-state">
          <strong>No bookings for this view</strong>
          <p>Try a different date or status filter.</p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Ref</th><th>Court</th><th>Customer</th><th>Time</th><th>Total</th><th>Payment</th><th></th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className={b.status}>
                  <td className="mono">{b.reference}</td>
                  <td className="cell-main">{b.court.name}</td>
                  <td>
                    {b.user.name}
                    {b.user.phone && <span className="muted small block">{b.user.phone}</span>}
                  </td>
                  <td>{fmtRange(b.start_time, b.end_time)}</td>
                  <td className="cell-main">{peso(b.total_price)}</td>
                  <td>
                    <span className={`badge pay-${b.payment_status}`}>{PAYMENT_LABELS[b.payment_status]}</span>
                    <span className="muted small block cap">{(b.payment_method || '—').replace('_', ' ')}</span>
                    {b.payment_reference && (
                      <span className="muted small mono block">{b.payment_reference}</span>
                    )}
                  </td>
                  <td>
                    {b.status === 'confirmed' && b.payment_status !== 'paid' && (
                      <button
                        className="btn primary sm"
                        disabled={busyId === b.id}
                        onClick={() => setPayment(b, 'paid')}
                      >
                        Mark paid
                      </button>
                    )}
                  </td>
                  <td>
                    {b.status === 'confirmed' && (
                      <button
                        className="btn danger sm"
                        disabled={busyId === b.id}
                        onClick={() => cancelBooking(b)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

/* ---------------- Courts manager ---------------- */
const EMPTY_FORM = {
  name: '',
  surface: 'indoor',
  hourly_rate: '',
  peak_rate: '',
  open_time: '07:00:00',
  close_time: '22:00:00',
}

function PhotosManager({ court, token }) {
  const [photos, setPhotos] = useState(court.photos || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const full = photos.length >= 5

  async function upload(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setError('')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('photo', f)
      const p = await api(`/admin/courts/${court.id}/photos`, { method: 'POST', token, body: fd })
      setPhotos((ps) => [...ps, p])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function remove(p) {
    setError('')
    try {
      await api(`/admin/courts/${court.id}/photos/${p.id}`, { method: 'DELETE', token })
      setPhotos((ps) => ps.filter((x) => x.id !== p.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fg-field span-2" style={{ marginTop: 16 }}>
      <span className="form-label">
        Photos
        <span className="muted small" style={{ marginLeft: 8 }}>
          {photos.length}/5 · first photo becomes the cover
        </span>
      </span>
      <div className="admin-thumbs">
        {photos.map((p) => (
          <div key={p.id} className="thumb-tile">
            <img src={p.url} alt="" loading="lazy" decoding="async" />
            <button
              type="button"
              className="thumb-del"
              onClick={() => remove(p)}
              aria-label={`Delete photo ${photos.indexOf(p) + 1}`}
            >
              <IconX size={12} />
            </button>
          </div>
        ))}
        {!full && (
          <button
            type="button"
            className="thumb-add"
            onClick={() => fileRef.current && fileRef.current.click()}
            disabled={busy}
            aria-label="Add photo"
          >
            {busy ? '…' : '+'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          disabled={full}
          onChange={upload}
        />
      </div>
      {error && (
        <div className="alert" role="alert">
          <IconAlert size={14} />
          {error}
        </div>
      )}
    </div>
  )
}

function CourtEditModal({ court, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: court.name,
    surface: court.surface,
    hourly_rate: court.hourly_rate,
    peak_rate: court.peak_rate,
    open_time: court.open_time.slice(0, 8),
    close_time: court.close_time.slice(0, 8),
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setTime = (k) => (e) =>
    e.target.value && setForm({ ...form, [k]: `${e.target.value}:00` })

  async function save(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api(`/admin/courts/${court.id}`, { method: 'PATCH', token, body: form })
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${court.name}`}
        onClick={(ev) => ev.stopPropagation()}
        onSubmit={save}
      >
        <div className="modal-head">
          <div>
            <h3>Edit court</h3>
            <p>{court.name}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={17} />
          </button>
        </div>

        <div className="form-grid">
          <label className="fg-field span-2">
            <span className="form-label">Court name</span>
            <input value={form.name} onChange={set('name')} required placeholder="e.g. Court A" />
          </label>
          <label className="fg-field">
            <span className="form-label">Surface</span>
            <select value={form.surface} onChange={set('surface')}>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </label>
          <label className="fg-field">
            <span className="form-label">Status</span>
            <div className="fg-static">
              <span className={`badge ${court.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {court.is_active ? 'active' : 'inactive'}
              </span>
            </div>
          </label>
          <label className="fg-field">
            <span className="form-label">Rate/hr (₱)</span>
            <input type="number" step="0.01" min="0" required value={form.hourly_rate} onChange={set('hourly_rate')} />
          </label>
          <label className="fg-field">
            <span className="form-label">Peak rate/hr (₱)</span>
            <input type="number" step="0.01" min="0" placeholder="Optional" value={form.peak_rate} onChange={set('peak_rate')} />
          </label>
          <label className="fg-field">
            <span className="form-label">Opens</span>
            <input type="time" value={form.open_time.slice(0, 5)} onChange={setTime('open_time')} />
          </label>
          <label className="fg-field">
            <span className="form-label">Closes</span>
            <input type="time" value={form.close_time.slice(0, 5)} onChange={setTime('close_time')} />
          </label>
        </div>

        <PhotosManager court={court} token={token} />

        {error && (
          <div className="alert" role="alert">
            <IconAlert size={16} />
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

function CourtRow({ court, token, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  async function toggleActive() {
    setError('')
    try {
      await api(`/admin/courts/${court.id}`, {
        method: 'PATCH',
        token,
        body: { is_active: !court.is_active },
      })
      onSaved()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <tr className={court.is_active ? '' : 'row-inactive'}>
        <td className="cell-main">{court.name}</td>
        <td className="cap">{court.surface}</td>
        <td>
          {peso(court.hourly_rate)}
          {Number(court.peak_rate) > 0 && (
            <span className="muted small"> / {peso(court.peak_rate)} peak</span>
          )}
        </td>
        <td>{fmtRange(court.open_time, court.close_time)}</td>
        <td>
          <span className={`badge ${court.is_active ? 'badge-active' : 'badge-inactive'}`}>
            {court.is_active ? 'active' : 'inactive'}
          </span>
        </td>
        <td className="actions-cell">
          {error && <span className="danger-text">{error}</span>}
          <button className="btn sm" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn sm" onClick={toggleActive}>
            {court.is_active ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>
      {editing && (
        <CourtEditModal
          court={court}
          token={token}
          onClose={() => setEditing(false)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}

function CourtsManager({ token }) {
  const [courts, setCourts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  function load() {
    api('/admin/courts', { token }).then(setCourts).catch((e) => setError(e.message))
  }

  useEffect(load, [token])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function addCourt(e) {
    e.preventDefault()
    setError('')
    try {
      await api('/admin/courts', { method: 'POST', token, body: form })
      setShowAdd(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="section-head">
        <div className="section-title">
          <h2>Courts</h2>
          <p className="section-sub">{courts.length} court{courts.length === 1 ? '' : 's'} configured.</p>
        </div>
        <button className="btn primary sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Close' : '+ Add court'}
        </button>
      </div>

      {error && (
        <div className="alert" role="alert">
          <IconAlert size={16} />
          {error}
        </div>
      )}

      {showAdd && (
        <form className="add-court card" onSubmit={addCourt}>
          <label>
            Name
            <input required placeholder="e.g. Court A" value={form.name} onChange={set('name')} />
          </label>
          <label>
            Surface
            <select value={form.surface} onChange={set('surface')}>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </label>
          <label>
            Rate/hr (₱)
            <input required type="number" step="0.01" placeholder="350" value={form.hourly_rate} onChange={set('hourly_rate')} />
          </label>
          <label>
            Peak rate/hr (₱)
            <input type="number" step="0.01" placeholder="450" value={form.peak_rate} onChange={set('peak_rate')} />
          </label>
          <label>
            Opens
            <input type="time" value={form.open_time.slice(0, 5)} onChange={(e) => setForm({ ...form, open_time: `${e.target.value}:00` })} />
          </label>
          <label>
            Closes
            <input type="time" value={form.close_time.slice(0, 5)} onChange={(e) => setForm({ ...form, close_time: `${e.target.value}:00` })} />
          </label>
          <button className="btn primary">Create court</button>
        </form>
      )}

      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Rate normal/peak</th><th>Hours</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {courts.map((c) => (
              <CourtRow key={c.id} court={c} token={token} onSaved={load} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ---------------- Users manager ---------------- */
const fmtJoined = (d) =>
  new Date(d.replace(' ', 'T')).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

function UsersManager({ token }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [result, setResult] = useState(null)
  const [query, setQuery] = useState('')

  function load() {
    api('/admin/users', { token })
      .then((d) => setUsers(Array.isArray(d) ? d : d.users))
      .catch((e) => setError(e.message))
  }

  useEffect(load, [token])

  async function confirmReset(e) {
    e.preventDefault()
    setBusyId(resetTarget.id)
    setError('')
    try {
      const d = await api(`/admin/users/${resetTarget.id}/reset-password`, { method: 'POST', token })
      setResetTarget(null)
      setResult({ ...d, user: resetTarget })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const q = query.trim().toLowerCase()
  const visible = users.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.address || '').toLowerCase().includes(q),
  )

  return (
    <>
      <div className="section-head">
        <div className="section-title">
          <h2>Users<span className="count-pill">{users.length}</span></h2>
          <p className="section-sub">Accounts registered with SmashPoint.</p>
        </div>
        <div className="filter-row" style={{ margin: 0 }}>
          <input
            type="search"
            placeholder="Search name, email or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users"
            style={{ minWidth: 230 }}
          />
        </div>
      </div>

      {error && (
        <div className="alert" role="alert">
          <IconAlert size={16} />
          {error}
        </div>
      )}

      {visible.length === 0 && !error ? (
        <div className="empty-state">
          <strong>No users found</strong>
          <p>{q ? 'Try a different search term.' : 'No accounts have been created yet.'}</p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>User</th><th>Phone</th><th>Address</th><th>Role</th><th>Bookings</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <span className="avatar avatar-sm">
                        {u.photo_url ? <img src={u.photo_url} alt="" /> : initials(u.name)}
                      </span>
                      <span>
                        <span className="cell-main block">{u.name}</span>
                        <span className="muted small">{u.email}</span>
                      </span>
                    </div>
                  </td>
                  <td>{u.phone || <span className="muted">—</span>}</td>
                  <td className="cell-addr" title={u.address || undefined}>
                    {u.address || <span className="muted">—</span>}
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-active' : 'badge-inactive'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.bookings_count ?? 0}</td>
                  <td>{fmtJoined(u.created_at)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn sm"
                      disabled={busyId === u.id}
                      onClick={() => setResetTarget(u)}
                    >
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* confirm reset */}
      {resetTarget && (
        <form className="modal-backdrop" onClick={() => setResetTarget(null)} onSubmit={confirmReset}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>Reset password?</h3>
                <p>{resetTarget.name} · {resetTarget.email}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setResetTarget(null)} aria-label="Close">
                <IconX size={17} />
              </button>
            </div>
            <p className="small muted">
              A temporary password will be generated and emailed to the user.
              Their current sessions will be signed out immediately.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setResetTarget(null)}>Cancel</button>
              <button type="submit" className="btn danger" disabled={busyId === resetTarget?.id}>
                {busyId ? 'Resetting…' : 'Reset password'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* result with temp password */}
      {result && (
        <div className="modal-backdrop" onClick={() => setResult(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>Password reset</h3>
                <p>{result.user.name} · {result.user.email}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setResult(null)} aria-label="Close">
                <IconX size={17} />
              </button>
            </div>
            <p className="small muted" style={{ marginBottom: 10 }}>
              Share this temporary password with {result.user.name.split(' ')[0]}:
            </p>
            <div className="ref-ticket">{result.temp_password}<small>Temporary password</small></div>
            {!result.emailed && (
              <div className="alert" role="alert" style={{ marginTop: 12 }}>
                <IconAlert size={16} />
                The email could not be sent (mail server not configured). Please relay the password manually.
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                onClick={() => navigator.clipboard?.writeText(result.temp_password)}
              >
                Copy
              </button>
              <button type="button" className="btn primary" onClick={() => setResult(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminPage({ token }) {
  const [tab, setTab] = useState('schedule')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleMutated() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="page-sub">Today&apos;s performance at a glance.</p>
        </div>
        <nav className="topnav">
          <button
            className={`nav-link ${tab === 'schedule' ? 'active' : ''}`}
            onClick={() => setTab('schedule')}
          >
            <IconCalendar size={15} />
            <span>Schedule</span>
          </button>
          <button
            className={`nav-link ${tab === 'courts' ? 'active' : ''}`}
            onClick={() => setTab('courts')}
          >
            <IconActivity size={15} />
            <span>Courts</span>
          </button>
          <button
            className={`nav-link ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            <IconUsers size={15} />
            <span>Users</span>
          </button>
        </nav>
      </header>

      <Stats token={token} refreshKey={refreshKey} />

      <div style={{ height: 18 }} />

      {tab === 'schedule' && <Schedule token={token} onMutate={handleMutated} />}
      {tab === 'courts' && <CourtsManager token={token} />}
      {tab === 'users' && <UsersManager token={token} />}
    </div>
  )
}
