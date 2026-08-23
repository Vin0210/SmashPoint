export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', note: 'Pay at the venue when you arrive.' },
  { id: 'gcash', label: 'GCash', number: '0917-000-1234', name: 'SmashPoint Sports' },
  { id: 'maya', label: 'Maya', number: '0918-000-5678', name: 'SmashPoint Sports' },
  { id: 'gotyme', label: 'GoTyme', number: '0123-4567-8901', name: 'SmashPoint Sports' },
]

export const PAYMENT_LABELS = {
  unpaid: 'Unpaid',
  pending_verification: 'Verifying',
  paid: 'Paid',
}
