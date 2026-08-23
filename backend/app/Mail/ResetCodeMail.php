<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Password reset code email — sent as both plain text and a minimal
 * HTML version so it renders as simple text in every mail client.
 */
class ResetCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $code;

    public function __construct($name, $code)
    {
        $this->name = $name;
        $this->code = $code;
    }

    public function build()
    {
        return $this
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->subject('Your SmashPoint password reset code')
            ->text('emails.reset_code_text')
            ->view('emails.reset_code_html')
            ->with([
                'name' => $this->name,
                'code' => $this->code,
            ]);
    }
}
