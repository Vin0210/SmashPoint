<?php

namespace App\Http\Controllers\Api;

use Carbon\Carbon;
use App\Booking;
use App\Court;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class BookingController extends Controller
{
    const SLOT_MINUTES = 60;
    const MAX_DAYS_AHEAD = 14;
    const MAX_HOURS = 3;
    const CANCEL_WINDOW_HOURS = 2;

    /**
     * GET /api/availability?court_id=1&date=2026-08-23
     */
    public function availability(Request $request)
    {
        $this->validate($request, [
            'court_id' => 'required|integer|exists:courts,id',
            'date'     => 'required|date|after_or_equal:today',
        ]);

        $court = Court::findOrFail($request->court_id);
        $date = Carbon::parse($request->date);
        $now = Carbon::now();

        $bookedSlots = Booking::where('court_id', $court->id)
            ->where('booking_date', $date->toDateString())
            ->active()
            ->pluck('start_time')
            ->map(function ($t) {
                return substr($t, 0, 5);
            })
            ->all();

        $slots = [];
        $cursor = Carbon::parse($date->toDateString() . ' ' . $court->open_time);
        $close = Carbon::parse($date->toDateString() . ' ' . $court->close_time);

        while ($cursor < $close) {
            $start = $cursor->format('H:i');
            $end = $cursor->copy()->addMinutes(self::SLOT_MINUTES)->format('H:i');

            $isPast = $cursor->lte($now);

            $slots[] = [
                'start_time' => $start,
                'end_time'   => $end,
                'price'      => (float) $court->rateFor($cursor),
                'peak'       => $court->rateFor($cursor) > $court->hourly_rate,
                'state'      => in_array($start, $bookedSlots) ? 'booked' : ($isPast ? 'past' : 'free'),
            ];
            $cursor->addMinutes(self::SLOT_MINUTES);
        }

        return response()->json([
            'court' => $court,
            'date'  => $date->toDateString(),
            'slots' => $slots,
        ]);
    }

    /**
     * POST /api/bookings
     */
    public function store(Request $request)
    {
        $this->validate($request, [
            'court_id'          => 'required|integer|exists:courts,id',
            'booking_date'      => 'required|date|after_or_equal:today',
            'start_time'        => 'required|date_format:H:i',
            'end_time'          => 'required|date_format:H:i|after:start_time',
            'payment_method'    => 'required|in:cash,gcash,maya,gotyme',
            'payment_reference' => 'nullable|string|max:100',
            'notes'             => 'nullable|string|max:255',
        ]);

        $maxDate = Carbon::today()->addDays(self::MAX_DAYS_AHEAD)->toDateString();
        if ($request->booking_date > $maxDate) {
            return response()->json([
                'message' => 'Bookings can only be made up to ' . self::MAX_DAYS_AHEAD . ' days in advance',
            ], 422);
        }

        $court = Court::findOrFail($request->court_id);

        if (! $court->is_active) {
            return response()->json(['message' => 'This court is currently unavailable'], 422);
        }

        $open = Carbon::parse($request->booking_date . ' ' . $court->open_time);
        $close = Carbon::parse($request->booking_date . ' ' . $court->close_time);
        $start = Carbon::parse($request->booking_date . ' ' . $request->start_time);
        $end = Carbon::parse($request->booking_date . ' ' . $request->end_time);

        if ($start < $open || $end > $close) {
            return response()->json([
                'message' => "Court is open from {$open->format('H:i')} to {$close->format('H:i')}",
            ], 422);
        }

        // Slot must align to full hours.
        if ($start->minute !== 0 || $end->minute !== 0) {
            return response()->json(['message' => 'Bookings must start and end on the hour'], 422);
        }

        $hours = $start->diffInHours($end);

        if ($hours < 1 || $hours > self::MAX_HOURS) {
            return response()->json([
                'message' => 'Bookings must be between 1 and ' . self::MAX_HOURS . ' hours',
            ], 422);
        }

        // No booking slots that already started.
        if ($start->lte(Carbon::now())) {
            return response()->json(['message' => 'That time slot has already started or passed'], 422);
        }

        // E-wallet payments with a reference number go to admin verification.
        $isEwallet = in_array($request->payment_method, ['gcash', 'maya', 'gotyme']);
        $paymentStatus = Booking::PAY_UNPAID;
        if ($isEwallet && trim((string) $request->payment_reference) !== '') {
            $paymentStatus = Booking::PAY_PENDING;
        }

        // Race-safe: lock the court row, re-check overlap, then insert.
        $booking = DB::transaction(function () use ($request, $court, $start, $end, $hours, $paymentStatus) {
            Court::whereKey($court->id)->lockForUpdate()->first();

            $overlap = Booking::where('court_id', $court->id)
                ->where('booking_date', $request->booking_date)
                ->active()
                ->where('start_time', '<', $end->format('H:i:s'))
                ->where('end_time', '>', $start->format('H:i:s'))
                ->lockForUpdate()
                ->exists();

            if ($overlap) {
                return null;
            }

            // Peak-aware total.
            $total = 0;
            for ($t = $start->copy(); $t < $end; $t->addHour()) {
                $total += $court->rateFor($t);
            }

            return Booking::create([
                'user_id'           => $request->user()->id,
                'court_id'          => $court->id,
                'reference'         => Booking::generateReference(),
                'booking_date'      => $request->booking_date,
                'start_time'        => $request->start_time,
                'end_time'          => $request->end_time,
                'total_price'       => round($total, 2),
                'status'            => Booking::STATUS_CONFIRMED,
                'notes'             => $request->notes,
                'payment_method'    => $request->payment_method,
                'payment_status'    => $paymentStatus,
                'payment_reference' => $request->payment_reference,
            ]);
        });

        if ($booking === null) {
            return response()->json(['message' => 'This time slot was just booked by someone else'], 409);
        }

        return response()->json([
            'message' => 'Court booked successfully',
            'booking' => $booking->load('court'),
        ], 201);
    }

    /**
     * PATCH /api/bookings/{booking}/pay - submit e-wallet reference number.
     */
    public function pay(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $this->validate($request, [
            'payment_reference' => 'required|string|max:100',
        ]);

        if (! in_array($booking->payment_method, ['gcash', 'maya', 'gotyme'])) {
            return response()->json(['message' => 'Only e-wallet bookings accept reference numbers'], 422);
        }

        if ($booking->payment_status === Booking::PAY_PAID) {
            return response()->json(['message' => 'Booking is already paid'], 422);
        }

        $booking->payment_reference = $request->payment_reference;
        $booking->payment_status = Booking::PAY_PENDING;
        $booking->save();

        return response()->json([
            'message' => 'Payment submitted. We will verify it shortly.',
            'booking' => $booking,
        ]);
    }

    /**
     * GET /api/bookings - current user's bookings.
     */
    public function index(Request $request)
    {
        $now = Carbon::now();

        $bookings = Booking::with('court')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('booking_date')
            ->orderByDesc('start_time')
            ->get();

        $upcoming = $bookings->filter(function ($b) use ($now) {
            return $b->status === Booking::STATUS_CONFIRMED
                && Carbon::parse($b->booking_date->toDateString() . ' ' . $b->end_time)->gte($now);
        })->values();

        $history = $bookings->reject(function ($b) use ($now) {
            return $b->status === Booking::STATUS_CONFIRMED
                && Carbon::parse($b->booking_date->toDateString() . ' ' . $b->end_time)->gte($now);
        })->values();

        return response()->json([
            'upcoming' => $upcoming,
            'history'  => $history,
        ]);
    }

    /**
     * PATCH /api/bookings/{booking}/cancel
     */
    public function cancel(Request $request, Booking $booking)
    {
        $isAdmin = $request->user()->role === 'admin';

        if (! $isAdmin && $booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->status === Booking::STATUS_CANCELLED) {
            return response()->json(['message' => 'Booking already cancelled'], 422);
        }

        // Customers may only cancel up to 2 hours before the slot starts.
        if (! $isAdmin) {
            $startsAt = Carbon::parse($booking->booking_date->toDateString() . ' ' . $booking->start_time);
            if (Carbon::now()->gt($startsAt->subHours(self::CANCEL_WINDOW_HOURS))) {
                return response()->json([
                    'message' => 'Bookings can only be cancelled up to ' . self::CANCEL_WINDOW_HOURS . ' hours before the schedule',
                ], 422);
            }
        }

        $booking->status = Booking::STATUS_CANCELLED;
        $booking->save();

        return response()->json([
            'message' => 'Booking cancelled',
            'booking' => $booking,
        ]);
    }
}
