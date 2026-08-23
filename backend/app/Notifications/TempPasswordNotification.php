<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TempPasswordNotification extends Notification
{
    use Queueable;

    public $tempPassword;

    public function __construct($tempPassword)
    {
        $this->tempPassword = $tempPassword;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Your SmashPoint password was reset')
            ->greeting("Hi {$notifiable->name},")
            ->line('An administrator reset the password for your SmashPoint account.')
            ->line("Your temporary password is: **{$this->tempPassword}**")
            ->line('Please sign in with it and change your password from your profile page as soon as possible.')
            ->salutation('— The SmashPoint Team');
    }
}
