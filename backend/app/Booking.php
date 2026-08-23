<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CANCELLED = 'cancelled';

    const PAY_UNPAID = 'unpaid';
    const PAY_PENDING = 'pending_verification';
    const PAY_PAID = 'paid';

    protected $fillable = [
        'user_id', 'court_id', 'booking_date', 'start_time', 'end_time',
        'total_price', 'status', 'notes', 'reference',
        'payment_method', 'payment_status', 'payment_reference',
        'reminder_sent_at',
    ];

    protected $dates = [
        'booking_date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function court()
    {
        return $this->belongsTo(Court::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }

    public static function generateReference()
    {
        do {
            $code = 'PB-' . strtoupper(str_random(6));
        } while (self::where('reference', $code)->exists());

        return $code;
    }
}
