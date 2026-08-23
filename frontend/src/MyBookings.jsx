import { useEffect, useState } from 'react'
import { api } from './api'
import { PAYMENT_LABELS } from './payments'
import { peso, fmtRange } from './format'
import { IconClock, IconCalendar, IconBall, IconX, IconAlert } from './icons'

function hoursUntil(b) {
  const start = new Date(`${b.booking_date.slice(0, 10)}T${b.start_time.slice(0, 5)}:00`)
  return (start - new Date()) / 3600000
}

function dateParts(iso) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return {
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    day: d.getDate(),
  }
}

export default function MyBookings({ token, refreshKey }) {
  const [upcoming, setUpcoming] = useState([])
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [payTarget, setPayTarget] = useState(null)
  const [reference, setReference] = useState('')

  function load() {
    api('/bookings', { token })
      .then((d) => {
        setUpcoming(d.upcoming)
        setHistory(d.history)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(load, [token, refreshKey])

  async function cancel(id) {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return
    try {
      await api(`/bookings/${id}/cancel`, { method: 'PATCH', token })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function submitPayment(e) {
    e.preventDefault()
    setError('')
    try {
      await api(`/bookings/${payTarget.id}/pay`, {
        method: 'PATCH',
        token,
        body: { payment_reference: reference.trim() },
      })
      setPayTarget(null)
      setReference('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const canCancel = (b) => b.status === 'confirmed' && hoursUntil(b) > 2

  const renderCard = (b, isUpcoming) => {
    const { month, day } = dateParts(b.booking_date)
    return (
      <div key={b.id} className={`card booking-card ${b.status}`}>
        <div className="date-tile" aria-hidden="true">
          <span className="dt-month">{month}</span>
          <span className="dt-day">{day}</span>
        </div>
        <div className="booking-info">
          <div className="booking-title">
            <strong>{b.court.name}</strong>
            <span className="ref-tag">{b.reference}</span>
          </div>
          <div className="booking-time">
            <IconClock size={14} />
            {fmtRange(b.start_time, b.end_time)}
          </div>
          <div className="booking-method cap">
            {(b.payment_method || '—').replace('_', ' ')}
          </div>
        </div>
        <div className="booking-right">
          <strong className="amount">{peso(b.total_price)}</strong>
          <span className={`badge pay-${b.payment_status}`}>{PAYMENT_LABELS[b.payment_status]}</span>
          {isUpcoming && b.status === 'confirmed' && (
            <>
              {['gcash', 'maya', 'gotyme'].includes(b.payment_method) &&
                b.payment_status === 'unpaid' && (
                  <button className="btn primary sm" onClick={() => setPayTarget(b)}>
                    Pay
                  </button>
                )}
              {canCancel(b) ? (
                <button
                  className="btn danger sm"
                  onClick={() => cancel(b.id)}
                  aria-label={`Cancel booking ${b.reference}`}
                >
                  Cancel
                </button>
              ) : (
                <span className="locked-note">Locked · less than 2h</span>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>My bookings</h1>
          <p className="page-sub">Track your reservations and payments.</p>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <IconAlert size={16} />
          {error}
        </div>
      )}

      <div className="section-head" style={{ marginTop: 0 }}>
        <div className="section-title">
          <h2>Upcoming<span className="count-pill">{upcoming.length}</span></h2>
        </div>
      </div>
      {upcoming.length === 0 && !error ? (
        <div className="empty-state">
          <span className="es-icon"><IconBall size={22} /></span>
          <strong>No upcoming bookings</strong>
          <p>Head to the Courts tab to reserve your next game.</p>
        </div>
      ) : (
        <div className="booking-list">{upcoming.map((b) => renderCard(b, true))}</div>
      )}

      <div className="section-head">
        <div className="section-title">
          <h2>History<span className="count-pill">{history.length}</span></h2>
        </div>
      </div>
      {history.length === 0 ? (
        <div className="empty-state">
          <span className="es-icon"><IconCalendar size={20} /></span>
          <strong>Nothing here yet</strong>
          <p>Your past games will show up here.</p>
        </div>
      ) : (
        <div className="booking-list">{history.map((b) => renderCard(b, false))}</div>
      )}

      {payTarget && (
        <div className="modal-backdrop" onClick={() => setPayTarget(null)}>
          <form
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Submit payment"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitPayment}
          >
            <div className="modal-head">
              <div>
                <h3>Submit payment</h3>
                <p>{payTarget.court.name} · ref {payTarget.reference}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setPayTarget(null)} aria-label="Close">
                <IconX size={17} />
              </button>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span className="form-label" style={{ display: 'block' }}>E-wallet reference number</span>
              <input
                className="plain-input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                autoFocus
                placeholder="e.g. 1234-5678-9012"
                required
              />
            </div>
            <p className="muted small">Our staff will verify your payment shortly after submission.</p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setPayTarget(null)}>Close</button>
              <button type="submit" className="btn primary">Submit payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
