<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Stripe, Mailgun, SparkPost and others. This file provides a sane
    | default location for this type of information, allowing packages
    | to have a conventional place to find your various credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
    ],

    'ses' => [
        'key' => env('SES_KEY'),
        'secret' => env('SES_SECRET'),
        'region' => 'us-east-1',
    ],

    'sparkpost' => [
        'secret' => env('SPARKPOST_SECRET'),
    ],

    'stripe' => [
        'model' => App\User::class,
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],

    // Philippine SMS gateway (semaphore.co) - used for booking reminders.
    'semaphore' => [
        'key'     => env('SEMAPHORE_KEY'),
        'sender'  => env('SEMAPHORE_SENDER', 'SmashPoint'),
    ],

    // HTTP email API (sendgrid / mailjet / brevo) - used when a host
    // blocks outbound SMTP. Provider + key decide; empty = normal SMTP.
    'mail_api' => [
        'provider' => env('MAIL_API_PROVIDER'),
        'sendgrid' => [
            'key' => env('SENDGRID_API_KEY'),
        ],
        'mailjet' => [
            'key'    => env('MAILJET_API_KEY'),
            'secret' => env('MAILJET_SECRET_KEY'),
        ],
        'brevo' => [
            'key' => env('BREVO_API_KEY'),
        ],
    ],

];
