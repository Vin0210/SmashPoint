<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Sends SMS through Semaphore (semaphore.co), a Philippine SMS gateway.
 *
 * If SEMAPHORE_KEY is not configured, messages are logged instead so the
 * rest of the system works during development.
 */
class SmsSender
{
    /**
     * Send a text message. Returns true when actually sent via gateway.
     */
    public function send($phone, $message)
    {
        $key = config('services.semaphore.key');

        if (! $key) {
            Log::info('[SMS not sent - no gateway key] to '.$phone.': '.$message);

            return false;
        }

        $ch = curl_init('https://api.semaphore.co/api/v4/messages');

        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'apikey'     => $key,
                'number'     => $phone,
                'message'    => $message,
                'sendername' => config('services.semaphore.sender'),
            ]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
        ]);

        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($body === false || $code >= 400) {
            Log::error('Semaphore SMS failed: HTTP '.$code.' '.(is_string($body) ? $body : curl_error($ch)));
            curl_close($ch);

            return false;
        }

        curl_close($ch);

        return true;
    }
}
