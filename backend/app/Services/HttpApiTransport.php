<?php

namespace App\Services;

use Swift_IoException;
use Swift_Events_EventListener;
use Swift_Mime_Message;

/**
 * Swift transport that delivers mail through HTTP email APIs instead of
 * a direct SMTP connection. Used on hosts that block outbound SMTP
 * ports. The provider is chosen by config('services.mail_api.provider'):
 * sendgrid, mailjet or brevo.
 */
class HttpApiTransport implements \Swift_Transport
{
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

        $html = $this->htmlBody($message);
        $request = $this->buildRequest(
            $senderEmail, $senderName, $recipients,
            $message->getSubject(), $html
        );
        $endpoint = $request[0];
        $headers = $request[1];
        $payload = $request[2];

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT        => 20,
            // Local Windows dev boxes often lack a CA bundle; skip
            // verification there only. Production keeps full TLS checks.
            CURLOPT_SSL_VERIFYPEER => ! config('app.debug'),
            CURLOPT_HTTPHEADER     => $headers,
        ]);

        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            throw new Swift_IoException('Mail API connection failed: '.$error);
        }

        if ($status < 200 || $status >= 300) {
            throw new Swift_IoException('Mail API error [HTTP '.$status.']: '.substr((string) $body, 0, 500));
        }

        return count($recipients);
    }

    /**
     * Builds the endpoint, auth headers and JSON payload for the
     * configured provider.
     */
    protected function buildRequest($fromEmail, $fromName, array $recipients, $subject, $html)
    {
        $provider = strtolower(config('services.mail_api.provider', ''));

        if ($provider === 'sendgrid') {
            $key = config('services.mail_api.sendgrid.key');
            if (! $key) {
                throw new Swift_IoException('SENDGRID_API_KEY is not configured.');
            }

            $payload = [
                'personalizations' => [
                    ['to' => array_map(function ($email, $name) {
                        return ['email' => $email, 'name' => $name];
                    }, array_keys($recipients), $recipients)],
                ],
                'from'    => ['email' => $fromEmail, 'name' => $fromName],
                'subject' => $subject,
                'content' => [['type' => 'text/html', 'value' => $html]],
            ];

            return [
                'https://api.sendgrid.com/v3/mail/send',
                ['authorization: Bearer '.$key, 'content-type: application/json'],
                $payload,
            ];
        }

        if ($provider === 'mailjet') {
            $pub = config('services.mail_api.mailjet.key');
            $priv = config('services.mail_api.mailjet.secret');
            if (! $pub || ! $priv) {
                throw new Swift_IoException('MAILJET keys are not configured.');
            }

            $payload = [
                'Messages' => [[
                    'From'    => ['Email' => $fromEmail, 'Name' => $fromName],
                    'To'      => array_map(function ($email, $name) {
                        return ['Email' => $email, 'Name' => $name];
                    }, array_keys($recipients), $recipients),
                    'Subject' => $subject,
                    'HTMLPart' => $html,
                ]],
            ];

            return [
                'https://api.mailjet.com/v3.1/send',
                ['authorization: Basic '.base64_encode($pub.':'.$priv), 'content-type: application/json'],
                $payload,
            ];
        }

        // Default / legacy: Brevo (sendinblue).
        $key = config('services.mail_api.brevo.key');
        if (! $key) {
            throw new Swift_IoException('No mail API key is configured.');
        }

        $payload = [
            'sender' => ['email' => $fromEmail, 'name' => $fromName],
            'to'     => [],
            'subject' => $subject,
            'htmlContent' => $html,
        ];
        foreach ($recipients as $email => $name) {
            $payload['to'][] = ['email' => $email, 'name' => $name];
        }

        return [
            'https://api.brevo.com/v3/smtp/email',
            ['accept: application/json', 'content-type: application/json', 'api-key: '.$key],
            $payload,
        ];
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
