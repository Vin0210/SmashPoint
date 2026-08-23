<?php

namespace App;

use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'address', 'photo', 'api_token', 'role',
    ];

    protected $hidden = [
        'password', 'remember_token', 'api_token',
    ];

    protected $appends = ['photo_url'];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function getPhotoUrlAttribute()
    {
        return $this->photo ? url("/photos/{$this->photo}") : null;
    }

    public function generateToken()
    {
        $this->api_token = str_random(60);
        $this->save();

        return $this->api_token;
    }

    /**
     * Send the password reset link as a link to the SPA reset page.
     */
    public function sendPasswordResetNotification($token)
    {
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $url = "{$frontend}/#/reset-password?token={$token}&email=" . urlencode($this->email);

        \Mail::to($this->email)->send(new \App\Mail\ResetPasswordPlain($this->name, $url));
    }
}
