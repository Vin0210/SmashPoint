<?php

namespace App\Http\Controllers\Api;

use Carbon\Carbon;
use App\User;
use App\Booking;
use App\Court;
use App\CourtPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;
use App\Notifications\TempPasswordNotification;
use Swift_SwiftException;

class AdminController extends Controller
{
    /**
     * GET /api/admin/stats
     */
    public function stats()
    {
        $today = Carbon::today()->toDateString();

        $base = Booking::where('booking_date', $today)->active();

        $paidQuery = clone $base;
        $paid = $paidQuery->where('payment_status', Booking::PAY_PAID)->sum('total_price');

        $unpaidQuery = clone $base;
        $unpaid = $unpaidQuery
            ->whereIn('payment_status', [Booking::PAY_UNPAID, Booking::PAY_PENDING])
            ->sum('total_price');

        $countQuery = clone $base;
        $bookingsToday = $countQuery->count();

        // Occupancy: booked hours vs total open hours across active courts.
        $courts = Court::where('is_active', true)->get();
        $openHours = 0;
        foreach ($courts as $court) {
            $open = Carbon::parse($court->open_time);
            $close = Carbon::parse($court->close_time);
            $openHours += max(0, $close->diffInHours($open));
        }

        $secsQuery = clone $base;
        $bookedMinutes = $secsQuery
            ->selectRaw('SUM(TIME_TO_SEC(end_time) - TIME_TO_SEC(start_time)) as secs')
            ->value('secs');

        $weekAhead = Booking::whereBetween('booking_date', [$today, Carbon::today()->addDays(7)])
            ->active()->count();

        return response()->json([
            'revenue_paid_today'   => round((float) $paid, 2),
            'revenue_due_today'    => round((float) $unpaid, 2),
            'bookings_today'       => $bookingsToday,
            'occupancy_today'      => $openHours > 0 ? round(($bookedMinutes / 3600 / $openHours) * 100, 1) : 0,
            'bookings_next_7_days' => $weekAhead,
        ]);
    }

    /**
     * GET /api/admin/bookings?date=&court_id=&status=
     */
    public function bookings(Request $request)
    {
        $query = Booking::with(['court', 'user:id,name,email,phone'])
            ->orderBy('booking_date')
            ->orderBy('start_time');

        if ($date = $request->input('date')) {
            $query->where('booking_date', $date);
        }
        if ($courtId = $request->input('court_id')) {
            $query->where('court_id', $courtId);
        }
        if ($status = $request->input('status')) {
            if ($status === 'active') {
                $query->active();
            } else {
                $query->where('status', $status);
            }
        }

        return response()->json($query->get());
    }

    /**
     * PATCH /api/admin/bookings/{booking}/payment { payment_status: unpaid|pending_verification|paid }
     */
    public function updatePayment(Request $request, Booking $booking)
    {
        $this->validate($request, [
            'payment_status' => 'required|in:unpaid,pending_verification,paid',
        ]);

        $booking->payment_status = $request->payment_status;
        $booking->save();

        return response()->json([
            'message' => 'Payment status updated',
            'booking' => $booking,
        ]);
    }

    /**
     * GET /api/admin/courts - includes inactive courts for management.
     */
    public function courts()
    {
        return response()->json(Court::with('photos')->orderBy('id')->get());
    }

    /**
     * POST /api/admin/courts
     */
    public function storeCourt(Request $request)
    {
        $this->validate($request, [
            'name'        => 'required|string|max:255|unique:courts,name',
            'surface'     => 'required|in:indoor,outdoor',
            'hourly_rate' => 'required|numeric|min:0',
            'peak_rate'   => 'nullable|numeric|min:0',
            'open_time'   => 'required|date_format:H:i:s',
            'close_time'  => 'required|date_format:H:i:s|after:open_time',
        ]);

        $data = $request->all();
        $data['peak_rate'] = isset($data['peak_rate']) ? $data['peak_rate'] : 0;
        $data['is_active'] = true;

        return response()->json(Court::create($data), 201);
    }

    /**
     * PATCH /api/admin/courts/{court}
     */
    public function updateCourt(Request $request, Court $court)
    {
        $this->validate($request, [
            'name'        => 'sometimes|required|string|max:255|unique:courts,name,' . $court->id,
            'surface'     => 'sometimes|required|in:indoor,outdoor',
            'hourly_rate' => 'sometimes|required|numeric|min:0',
            'peak_rate'   => 'sometimes|numeric|min:0',
            'open_time'   => 'sometimes|required|date_format:H:i:s',
            'close_time'  => 'sometimes|required|date_format:H:i:s|after:open_time',
            'is_active'   => 'sometimes|boolean',
        ]);

        $court->update($request->all());

        return response()->json([
            'message' => 'Court updated',
            'court'   => $court,
        ]);
    }

    /**
     * DELETE /api/admin/courts/{court}
     * Refuses to delete courts with booking history; deactivates instead.
     */
    public function destroyCourt(Court $court)
    {
        $hasBookings = DB::table('bookings')->where('court_id', $court->id)->exists();

        if ($hasBookings) {
            $court->is_active = false;
            $court->save();

            return response()->json([
                'message' => 'Court has booking history and was deactivated instead of deleted',
                'court'   => $court,
            ]);
        }

        $court->delete();

        return response()->json(['message' => 'Court deleted']);
    }

    /**
     * POST /api/admin/courts/{court}/photos  (multipart)
     */
    public function uploadCourtPhoto(Request $request, Court $court)
    {
        if ($court->photos()->count() >= 5) {
            return response()->json(['message' => 'Maximum of 5 photos per court.'], 422);
        }

        $this->validate($request, [
            'photo' => 'required|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        $file = $request->file('photo');
        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $name = 'court_'.$court->id.'_'.str_random(10).'.'.$ext;

        $file->storeAs('courts', $name, 'public');

        $photo = $court->photos()->create([
            'filename'   => $name,
            'sort_order' => $court->photos()->count(),
        ]);

        return response()->json($photo, 201);
    }

    /**
     * DELETE /api/admin/courts/{court}/photos/{photo}
     */
    public function deleteCourtPhoto(Court $court, CourtPhoto $photo)
    {
        if ($photo->court_id !== $court->id) {
            abort(404);
        }

        \Storage::disk('public')->delete('courts/'.$photo->filename);
        $photo->delete();

        return response()->json(['message' => 'Photo removed']);
    }

    /**
     * GET /api/admin/users
     */
    public function users()
    {
        $users = User::withCount('bookings')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($users);
    }

    /**
     * POST /api/admin/users/{user}/reset-password
     * Generates a temporary password, invalidates the user's sessions,
     * emails it to them and returns it once so staff can relay it.
     */
    public function resetUserPassword(User $user)
    {
        $temp = str_random(10);

        $user->password = Hash::make($temp);
        $user->api_token = null;
        $user->save();

        $emailed = false;
        try {
            $user->notify(new TempPasswordNotification($temp));
            $emailed = true;
        } catch (Swift_SwiftException $e) {
            Log::error("Failed to email temp password to {$user->email}: ".$e->getMessage());
        }

        return response()->json([
            'message'       => 'Password reset',
            'temp_password' => $temp,
            'emailed'       => $emailed,
        ]);
    }
}
