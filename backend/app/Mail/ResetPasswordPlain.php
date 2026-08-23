<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Plain-text password reset email. Sent as a real text/plain MIME part so
 * every mail client (including basic HTML Gmail views) shows simple text.
 */
class ResetPasswordPlain extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $url;

    public function __construct($name, $url)
    {
        $this->name = $name;
        $this->url = $url;
    }

    public function build()
    {
        return $this
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->subject('Reset your SmashPoint password')
            ->text('emails.reset_link_text')
            ->view('emails.reset_link_html')
            ->with([
                'name' => $this->name,
                'url' => $this->url,
            ]);
    }
}
