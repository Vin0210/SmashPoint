<?php

namespace App\Console\Commands;

use App\Booking;
use App\Mail\BookingReminder;
use App\Services\SmsSender;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Swift_SwiftException;

class SendBookingReminders extends Command
{
    protected $signature = 'bookings:remind {--minutes= : Override reminder window in minutes}';

    protected $description = 'Email and text customers whose booking starts soon';

    public function handle(SmsSender $sms)
    {
        $window = (int) ($this->option('minutes') ?: config('bookings.reminder_minutes', 60));
        $now = Carbon::now();

        // Confirmed bookings happening today whose start time falls inside
        // [now, now + window] and which have not been reminded yet.
        $bookings = Booking::with('user', 'court')
            ->where('status', Booking::STATUS_CONFIRMED)
            ->whereDate('booking_date', $now->toDateString())
            ->whereNull('reminder_sent_at')
            ->get()
            ->filter(function ($b) use ($now, $window) {
                $start = Carbon::parse($b->booking_date->toDateString().' '.$b->start_time);

                return $start->gte($now) && $start->lte($now->copy()->addMinutes($window));
            });

        if ($bookings->isEmpty()) {
            $this->info('No bookings need a reminder right now.');

            return;
        }

        foreach ($bookings as $booking) {
            $start = Carbon::parse($booking->booking_date->toDateString().' '.$booking->start_time);
            $mins = $now->diffInMinutes($start);
            $when = $mins <= 1 ? 'starting now' : 'in '.$mins.' minute'.($mins == 1 ? '' : 's');

            // Email
            $emailed = false;
            try {
                Mail::to($booking->user->email)->send(new BookingReminder($booking));
                $emailed = true;
            } catch (Swift_SwiftException $e) {
                \Log::error('Reminder email failed for booking '.$booking->reference.': '.$e->getMessage());
            }

            // SMS
            $texted = false;
            if ($booking->user->phone) {
                $msg = 'SmashPoint reminder: booking '.$booking->reference
                    .' at '.$booking->court->name.' starts '.$when.' ('
                    .$start->format('g:i A').'). See you on the court!';
                $texted = $sms->send($booking->user->phone, $msg);
            }

            $booking->forceFill(['reminder_sent_at' => $now])->save();

            $this->line(sprintf(
                '%s | %s | email:%s sms:%s',
                $booking->reference,
                $booking->user->email,
                $emailed ? 'sent' : 'FAILED',
                $booking->user->phone ? ($texted ? 'sent' : 'logged/failed') : 'no phone'
            ));
        }

        $this->info('Done. Reminded '.$bookings->count().' booking(s).');
    }
}
