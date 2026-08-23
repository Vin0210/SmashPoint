import { useRef, useState } from 'react'
import { api } from './api'
import { IconCheck, IconAlert } from './icons'

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

export default function ProfilePage({ token, user, onUserUpdated }) {
  const fileInput = useRef(null)

  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
  })
  const [detailsBusy, setDetailsBusy] = useState(false)
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [pwBusy, setPwBusy] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  const [photoError, setPhotoError] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)

  const set = (k) => (e) => {
    setDetailsSaved(false)
    setForm({ ...form, [k]: e.target.value })
  }
  const setPwField = (k) => (e) => {
    setPwSaved(false)
    setPw({ ...pw, [k]: e.target.value })
  }

  async function saveDetails(e) {
    e.preventDefault()
    setDetailsError('')
    setDetailsBusy(true)
    try {
      const d = await api('/profile', { method: 'PATCH', token, body: form })
      onUserUpdated(d.user)
      setDetailsSaved(true)
      setTimeout(() => setDetailsSaved(false), 2500)
    } catch (err) {
      setDetailsError(err.message)
    } finally {
      setDetailsBusy(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwError('')
    if (pw.password !== pw.password_confirmation) {
      setPwError('New passwords do not match.')
      return
    }
    if (pw.password === pw.current_password) {
      setPwError('The new password must be different from the current one.')
      return
    }
    setPwBusy(true)
    try {
      await api('/profile/password', { method: 'PATCH', token, body: pw })
      setPw({ current_password: '', password: '', password_confirmation: '' })
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwBusy(false)
    }
  }

  async function onPickPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    setPhotoBusy(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const d = await api('/profile/photo', { method: 'POST', token, body: fd })
      onUserUpdated(d.user)
    } catch (err) {
      setPhotoError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>My profile</h1>
          <p className="page-sub">Keep your details up to date.</p>
        </div>
      </header>

      <div className="profile-grid">
        {/* --- photo card --- */}
        <section className="card profile-photo-card">
          <div className={`avatar-xl ${photoBusy ? 'busy' : ''}`}>
            {user.photo_url ? (
              <img src={user.photo_url} alt={`${user.name}'s avatar`} />
            ) : (
              <span>{initials(user.name)}</span>
            )}
          </div>

          <h3 className="profile-name">{user.name}</h3>
          <p className="muted small">{user.email}</p>
          <span className={`badge ${user.role === 'admin' ? 'badge-active' : 'badge-inactive'}`}>
            {user.role === 'admin' ? 'Administrator' : 'Player'}
          </span>

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={onPickPhoto}
            hidden
          />
          <button
            className="btn sm"
            onClick={() => fileInput.current.click()}
            disabled={photoBusy}
            style={{ marginTop: 14 }}
          >
            {photoBusy ? 'Uploading…' : user.photo_url ? 'Change photo' : 'Upload photo'}
          </button>
          <p className="muted small" style={{ marginTop: 8 }}>JPG, PNG, GIF or WebP · max 2 MB</p>
          {photoError && (
            <div className="alert" role="alert" style={{ marginTop: 10 }}>
              <IconAlert size={15} />
              {photoError}
            </div>
          )}
        </section>

        {/* --- right column: details + password --- */}
        <div className="profile-col">
          <form className="card" onSubmit={saveDetails}>
            <h3 className="card-title">Personal details</h3>
            <div className="form-grid">
              <label className="fg-field span-2">
                <span className="form-label">Full name</span>
                <input value={form.name} onChange={set('name')} required />
              </label>
              <label className="fg-field span-2">
                <span className="form-label">Email</span>
                <input type="email" value={form.email} onChange={set('email')} required />
              </label>
              <label className="fg-field">
                <span className="form-label">Phone</span>
                <input value={form.phone || ''} onChange={set('phone')} placeholder="012-345-6789" />
              </label>
              <label className="fg-field span-2">
                <span className="form-label">Address</span>
                <textarea
                  rows={3}
                  value={form.address || ''}
                  onChange={set('address')}
                  placeholder="Street, barangay, city…"
                />
              </label>
            </div>

            {detailsError && (
              <div className="alert" role="alert">
                <IconAlert size={16} />
                {detailsError}
              </div>
            )}

            <div className="form-foot">
              {detailsSaved && (
                <span className="saved-note"><IconCheck size={14} /> Saved</span>
              )}
              <button className="btn primary" disabled={detailsBusy}>
                {detailsBusy ? 'Saving…' : 'Save details'}
              </button>
            </div>
          </form>

          <form className="card" onSubmit={savePassword}>
            <h3 className="card-title">Change password</h3>
            <div className="form-grid">
              <label className="fg-field span-2">
                <span className="form-label">Current password</span>
                <input type="password" value={pw.current_password} onChange={setPwField('current_password')} required />
              </label>
              <label className="fg-field">
                <span className="form-label">New password</span>
                <input type="password" value={pw.password} onChange={setPwField('password')} required minLength={6} />
              </label>
              <label className="fg-field">
                <span className="form-label">Confirm new password</span>
                <input type="password" value={pw.password_confirmation} onChange={setPwField('password_confirmation')} required minLength={6} />
              </label>
            </div>

            {pwError && (
              <div className="alert" role="alert">
                <IconAlert size={16} />
                {pwError}
              </div>
            )}

            <div className="form-foot">
              {pwSaved && (
                <span className="saved-note"><IconCheck size={14} /> Password updated</span>
              )}
              <button className="btn primary" disabled={pwBusy}>
                {pwBusy ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
