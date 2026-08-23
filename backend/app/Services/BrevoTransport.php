<?php

namespace App\Services;

use Swift_IoException;
use Swift_Events_EventListener;
use Swift_Mime_Message;

/**
 * Swift transport that delivers mail through the Brevo (Sendinblue)
 * HTTP API instead of a direct SMTP connection. Used on hosts that
 * block outbound SMTP ports; activated by setting BREVO_API_KEY.
 */
class BrevoTransport implements \Swift_Transport
{
    protected $endpoint = 'https://api.brevo.com/v3/smtp/email';

    public function isStarted()
    {
        return true;
    }

    public function start()
    {
        return true;
    }

    public function stop()
    {
        return true;
    }

    public function registerPlugin(Swift_Events_EventListener $plugin)
    {
        //
    }

    public function send(Swift_Mime_Message $message, &$failedRecipients = null)
    {
        $key = config('services.brevo.key');

        if (! $key) {
            throw new Swift_IoException('Brevo API key is not configured.');
        }

        $recipients = $this->allRecipients($message);

        if (empty($recipients)) {
            return 0;
        }

        $from = $message->getFrom();
        if (! empty($from)) {
            $senderEmail = array_keys($from)[0];
            $senderName = reset($from) ?: config('mail.from.name');
        } else {
            $senderEmail = config('mail.from.address');
            $senderName = config('mail.from.name');
        }

        $payload = [
            'sender' => [
                'email' => $senderEmail,
                'name'  => $senderName,
            ],
            'to'      => [],
            'subject' => $message->getSubject(),
            'htmlContent' => $this->htmlBody($message),
        ];

        foreach ($recipients as $email => $name) {
            $payload['to'][] = ['email' => $email, 'name' => $name];
        }

        $ch = curl_init($this->endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT        => 20,
            // Local Windows dev boxes often lack a CA bundle; skip
            // verification there only. Production keeps full TLS checks.
            CURLOPT_SSL_VERIFYPEER => ! config('app.debug'),
            CURLOPT_HTTPHEADER     => [
                'accept: application/json',
                'content-type: application/json',
                'api-key: '.$key,
            ],
        ]);

        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            throw new Swift_IoException('Brevo API connection failed: '.$error);
        }

        if ($status < 200 || $status >= 300) {
            throw new Swift_IoException('Brevo API error [HTTP '.$status.']: '.substr((string) $body, 0, 500));
        }

        return count($recipients);
    }

    protected function allRecipients(Swift_Mime_Message $message)
    {
        $people = [];

        foreach (['getTo', 'getCc', 'getBcc'] as $method) {
            foreach ((array) $message->$method() as $email => $name) {
                if (is_numeric($email)) {
                    continue;
                }
                $people[$email] = $name ?: null;
            }
        }

        return $people;
    }

    protected function htmlBody(Swift_Mime_Message $message)
    {
        if (stripos($message->getContentType(), 'text/html') !== false) {
            return $message->getBody();
        }

        foreach ($message->getChildren() as $part) {
            if ($part instanceof \Swift_Mime_MimeEntity
                && stripos($part->getContentType(), 'text/html') !== false) {
                return $part->getBody();
            }
        }

        return nl2br(e($message->getBody()));
    }
}
