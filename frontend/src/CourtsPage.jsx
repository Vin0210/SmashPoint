import { useEffect, useState } from 'react'
import { api } from './api'
import BookingModal from './BookingModal'
import { peso, fmtRange, fmtDate } from './format'
import {
  IconBall,
  IconHome,
  IconSun,
  IconClock,
  IconCalendar,
  IconCheck,
  IconAlert,
  IconGrid,
  IconX,
  IconArrowRight,
} from './icons'

function todayStr(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export default function CourtsPage({ token, onBooked }) {
  const [courts, setCourts] = useState([])
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [date, setDate] = useState(todayStr())
  // null = loading, [] = loaded but empty
  const [slots, setSlots] = useState(null)
  const [error, setError] = useState('')
  const [bookingSlot, setBookingSlot] = useState(null)
  // { court, index } while the photo lightbox is open
  const [gallery, setGallery] = useState(null)

  useEffect(() => {
    api('/courts')
      .then((list) => setCourts(list.filter((c) => c.is_active)))
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!selectedCourt || !date) return
    let cancelled = false
    api(`/availability?court_id=${selectedCourt.id}&date=${date}`)
      .then((d) => {
        if (cancelled) return
        setError('')
        setSlots(d.slots)
      })
      .catch((e) => {
        if (cancelled) return
        setSlots([])
        setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [selectedCourt, date])

  function refresh() {
    if (!selectedCourt || !date) return
    api(`/availability?court_id=${selectedCourt.id}&date=${date}`)
      .then((d) => setSlots(d.slots))
      .catch(() => {})
  }

  function handleBooked() {
    refresh()
    onBooked()
  }

  function selectCourt(c) {
    setSelectedCourt(c)
    setSlots(null)
  }

  const freeCount = slots?.filter((s) => s.state === 'free').length ?? 0

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Find your court</h1>
          <p className="page-sub">
            Pick a court, choose an hour, and you&apos;re in.
          </p>
        </div>
      </header>

      {error && !selectedCourt && (
        <div className="alert" role="alert">
          <IconAlert size={16} />
          {error}
        </div>
      )}

      <div className="court-grid">
        {courts.map((c) => {
          const selected = selectedCourt?.id === c.id
          const Indoor = c.surface === 'indoor'
          return (
            <div
              key={c.id}
              className={`card court-card ${selected ? 'selected' : ''}`}
              onClick={() => selectCourt(c)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  selectCourt(c)
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
            >
              <div className={`court-top ${Indoor ? 'indoor' : 'outdoor'}`}>
                {c.photos && c.photos.length > 0 && (
                  <img
                    className="court-cover"
                    src={c.photos[0].url}
                    alt={c.name}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span className="chip">
                  {Indoor ? <IconHome size={13} /> : <IconSun size={13} />}
                  {Indoor ? 'Indoor' : 'Outdoor'}
                </span>
                <span className="top-actions">
                  {c.photos && c.photos.length > 0 && (
                    <button
                      type="button"
                      className="photo-chip"
                      onClick={(e) => {
                        e.stopPropagation()
                        setGallery({ court: c, index: 0 })
                      }}
                      aria-label={`View ${c.photos.length} photos of ${c.name}`}
                    >
                      <IconGrid size={12} />
                      {c.photos.length}
                    </button>
                  )}
                  {selected && (
                    <span className="check-badge"><IconCheck size={14} /></span>
                  )}
                </span>
              </div>
              <div className="court-body">
                <h3>{c.name}</h3>
                <div className="rate-row">
                  <strong>{peso(c.hourly_rate)}</strong>
                  <span className="per">/ hour</span>
                  {Number(c.peak_rate) > 0 && (
                    <span className="rate-peak">Peak {peso(c.peak_rate)}</span>
                  )}
                </div>
                <div className="hours">
                  <IconClock size={15} />
                  Open {fmtRange(c.open_time, c.close_time)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {courts.length === 0 && !error && (
        <div className="empty-state" style={{ marginTop: 20 }}>
          <span className="es-icon"><IconBall size={22} /></span>
          <strong>No courts available yet</strong>
          <p>Please check back soon — new courts are on the way.</p>
        </div>
      )}

      {selectedCourt && (
        <section className="slots-section" aria-label={`Availability for ${selectedCourt.name}`}>
          <div className="section-head">
            <div className="section-title">
              <h2>{selectedCourt.name}</h2>
              <p className="section-sub">{fmtDate(date)} · prices per hour</p>
            </div>
            <div className="date-bar">
              {selectedCourt.photos && selectedCourt.photos.length > 0 && (
                <button
                  className="btn sm"
                  onClick={() => setGallery({ court: selectedCourt, index: 0 })}
                >
                  <IconGrid size={14} />
                  Photos ({selectedCourt.photos.length})
                </button>
              )}
              <button
                className={`date-chip ${date === todayStr() ? 'active' : ''}`}
                onClick={() => setDate(todayStr())}
              >
                Today
              </button>
              <button
                className={`date-chip ${date === todayStr(1) ? 'active' : ''}`}
                onClick={() => setDate(todayStr(1))}
              >
                Tomorrow
              </button>
              <label className="date-input">
                <IconCalendar size={15} />
                <input
                  type="date"
                  value={date}
                  min={todayStr()}
                  aria-label="Pick a date"
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="alert" role="alert">
              <IconAlert size={16} />
              {error}
            </div>
          )}

          {slots === null ? (
            <div className="slot-grid" aria-label="Loading availability">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skel-slot" />
              ))}
            </div>
          ) : slots.length > 0 ? (
            <>
              <div className="legend">
                <span><i className="dot free" /> Available ({freeCount})</span>
                <span><i className="dot booked" /> Booked</span>
                <span><i className="dot past" /> Passed</span>
                <span><i className="dot peak" /> Peak rate</span>
              </div>
              <div className="slot-grid">
                {slots.map((s) => (
                  <button
                    key={s.start_time}
                    className={`slot ${s.state} ${s.peak && s.state === 'free' ? 'peak' : ''}`}
                    disabled={s.state !== 'free'}
                    onClick={() => setBookingSlot(s)}
                  >
                    <span className="slot-time">
                      {fmtRange(s.start_time, s.end_time)}
                    </span>
                    {s.state === 'free' ? (
                      <span className="slot-price">
                        {peso(s.price)}
                        {s.peak && <em className="tag-peak">Peak</em>}
                      </span>
                    ) : (
                      <span className="slot-note">{s.state === 'booked' ? 'Taken' : 'Closed'}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            !error && (
              <div className="empty-state">
                <span className="es-icon"><IconCalendar size={20} /></span>
                <strong>No slots scheduled</strong>
                <p>This court has no hours listed for the selected day.</p>
              </div>
            )
          )}
        </section>
      )}

      {!selectedCourt && courts.length > 0 && (
        <p className="muted small" style={{ marginTop: 18 }}>
          Select a court above to see available hours.
        </p>
      )}

      {bookingSlot && (
        <BookingModal
          court={selectedCourt}
          date={date}
          slot={bookingSlot}
          token={token}
          onClose={() => setBookingSlot(null)}
          onBooked={handleBooked}
        />
      )}

      {gallery && gallery.court.photos && gallery.court.photos.length > 0 && (
        <Lightbox
          photos={gallery.court.photos}
          index={gallery.index}
          title={gallery.court.name}
          onClose={() => setGallery(null)}
          onIndex={(i) => setGallery({ court: gallery.court, index: i })}
        />
      )}
    </div>
  )
}

function Lightbox({ photos, index, title, onClose, onIndex }) {
  const last = photos.length - 1

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex(index >= last ? 0 : index + 1)
      if (e.key === 'ArrowLeft') onIndex(index <= 0 ? last : index - 1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, last, onClose, onIndex])

  return (
    <div
      className="modal-backdrop lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Photos of ${title}`}
    >
      <div className="lightbox" onClick={(ev) => ev.stopPropagation()}>
        <div className="lb-head">
          <strong>{title}</strong>
          <span className="lb-count">{index + 1} / {photos.length}</span>
          <button type="button" className="icon-btn lb-close" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <div className="lb-stage">
          {photos.length > 1 && (
            <button
              type="button"
              className="lb-nav prev"
              onClick={() => onIndex(index <= 0 ? last : index - 1)}
              aria-label="Previous photo"
            >
              <IconArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <img
            key={photos[index].url}
            src={photos[index].url}
            alt={`${title} photo ${index + 1}`}
          />
          {photos.length > 1 && (
            <button
              type="button"
              className="lb-nav next"
              onClick={() => onIndex(index >= last ? 0 : index + 1)}
              aria-label="Next photo"
            >
              <IconArrowRight size={20} />
            </button>
          )}
        </div>

        {photos.length > 1 && (
          <div className="lb-thumbs">
            {photos.map((ph, i) => (
              <button
                key={ph.id ?? ph.url}
                type="button"
                className={`lb-thumb ${i === index ? 'active' : ''}`}
                onClick={() => onIndex(i)}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={ph.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
