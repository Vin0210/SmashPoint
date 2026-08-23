export const peso = (n) => `₱${Number(n).toFixed(2)}`

function parts(t) {
  const [h, m] = String(t).slice(0, 5).split(':').map(Number)
  return {
    time: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`,
    ampm: h >= 12 ? 'PM' : 'AM',
  }
}

export function fmtTime(t) {
  const p = parts(t)
  return `${p.time} ${p.ampm}`
}

/* "07:00:00", "09:30:00" -> "7:00 – 9:30 AM"; crosses meridian -> "11:00 AM – 12:30 PM" */
export function fmtRange(a, b) {
  const s = parts(a)
  const e = parts(b)
  if (s.ampm === e.ampm) return `${s.time} – ${e.time} ${e.ampm}`
  return `${s.time} ${s.ampm} – ${e.time} ${e.ampm}`
}

export function fmtDate(iso, opts) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(
    undefined,
    opts ?? { weekday: 'long', month: 'long', day: 'numeric' },
  )
}
