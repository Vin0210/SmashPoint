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
            ->view('emails.reset_link_text', [
                'name' => $notifiable->name,
                'url' => $url,
            ]);
    }
}
