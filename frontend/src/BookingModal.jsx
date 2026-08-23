import { useEffect, useState } from 'react'
import { api } from './api'
import { PAYMENT_METHODS } from './payments'
import { peso, fmtRange, fmtDate } from './format'
import { IconX, IconCheck, IconAlert, IconInfo } from './icons'

const PAY_BRAND = {
  cash: { mono: '₱', cls: 'cash' },
  gcash: { mono: 'G', cls: 'gcash' },
  maya: { mono: 'M', cls: 'maya' },
  gotyme: { mono: 'Go', cls: 'gotyme' },
}

export default function BookingModal({ court, date, slot, token, onClose, onBooked }) {
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const selected = PAYMENT_METHODS.find((m) => m.id === method)
  const isEwallet = ['gcash', 'maya', 'gotyme'].includes(method)

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

  async function confirm() {
    setError('')
    if (isEwallet && reference.trim() === '') {
      setError('Enter the reference number from your e-wallet receipt.')
      return
    }
    setBusy(true)
    try {
      const data = await api('/bookings', {
        method: 'POST',
        token,
        body: {
          court_id: court.id,
          booking_date: date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          payment_method: method,
          payment_reference: reference.trim() || null,
        },
      })
      setDone(data.booking)
      onBooked()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Confirm booking" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="success-view">
            <div className="success-check"><IconCheck size={30} /></div>
            <h3>You&apos;re booked!</h3>
            <p className="success-sub">Show this reference code at the venue.</p>
            <div className="ref-ticket">
              {done.reference}
              <small>Booking reference</small>
            </div>
            <dl className="summary">
              <div><dt>Court</dt><dd>{court.name}</dd></div>
              <div><dt>Date</dt><dd>{fmtDate(date)}</dd></div>
              <div><dt>Time</dt><dd>{fmtRange(slot.start_time, slot.end_time)}</dd></div>
              <div><dt>Total</dt><dd>{peso(done.total_price)}</dd></div>
              <div>
                <dt>Payment</dt>
                <dd className="cap">
                  {selected.label}
                  {isEwallet ? ' — verifying' : ' — pay at venue'}
                </dd>
              </div>
            </dl>
            <button className="btn primary block" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <div>
                <h3>Confirm booking</h3>
                <p>{court.name} · {fmtDate(date)}</p>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <IconX size={17} />
              </button>
            </div>

            <div className="receipt">
              <div className="receipt-row"><span>Time</span><strong>{fmtRange(slot.start_time, slot.end_time)}</strong></div>
              <div className="receipt-row">
                <span>Rate</span>
                <strong>
                  {peso(slot.price)}/hr{slot.peak && <em className="tag-peak">Peak</em>}
                </strong>
              </div>
              <hr className="receipt-sep" />
              <div className="receipt-total"><span>Total due</span><strong>{peso(slot.price)}</strong></div>
            </div>

            <span className="pay-label">Payment method</span>
            <div className="pay-options">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className={`pay-option ${method === m.id ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                  <span className={`pay-mono ${PAY_BRAND[m.id]?.cls ?? 'cash'}`}>
                    {PAY_BRAND[m.id]?.mono ?? '•'}
                  </span>
                  {m.label}
                </label>
              ))}
            </div>

            {selected.note && !isEwallet && (
              <div className="alert info">
                <IconInfo size={16} />
                {selected.note}
              </div>
            )}

            {isEwallet && (
              <div className="ewallet-box">
                <p className="small">
                  Send <strong>{peso(slot.price)}</strong> to <strong>{selected.name}</strong>
                  <br />
                  {selected.label}: <strong>{selected.number}</strong>
                </p>
                <input
                  placeholder="Enter reference number"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <p className="muted small" style={{ marginTop: 8 }}>
                  Payment will be marked &ldquo;verifying&rdquo; until our staff confirms it.
                </p>
              </div>
            )}

            {error && (
              <div className="alert" role="alert">
                <IconAlert size={16} />
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="btn primary" onClick={confirm} disabled={busy}>
                {busy ? 'Booking…' : 'Confirm & Book'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
