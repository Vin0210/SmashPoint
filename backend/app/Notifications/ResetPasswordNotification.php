<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public $token;

    public function __construct($token)
    {
        $this->token = $token;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $url = "{$frontend}/#/reset-password?token={$this->token}&email=" . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Reset your SmashPoint password')
            ->greeting("Hi {$notifiable->name},")
            ->line('We received a request to reset the password for your SmashPoint account.')
            ->line('Click the button below to choose a new password. This link expires in 60 minutes.')
            ->action('Reset password', $url)
            ->line('If you did not request a password reset, you can safely ignore this email.')
            ->salutation('— The SmashPoint Team');
    }
}
