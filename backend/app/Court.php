<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Court extends Model
{
    protected $fillable = [
        'name', 'surface', 'hourly_rate', 'peak_rate', 'open_time', 'close_time', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function photos()
    {
        return $this->hasMany(CourtPhoto::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Effective hourly rate for a given date+time.
     * Peak = weekends (all day) or weekdays from 17:00.
     */
    public function rateFor(\Carbon\Carbon $slotStart)
    {
        $isWeekend = in_array($slotStart->dayOfWeek, [\Carbon\Carbon::SATURDAY, \Carbon\Carbon::SUNDAY]);
        $isEvening = $slotStart->hour >= 17;

        if (($isWeekend || $isEvening) && $this->peak_rate > 0) {
            return $this->peak_rate;
        }

        return $this->hourly_rate;
    }
}
