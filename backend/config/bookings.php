<?php

return [

    /*
    |----------------------------------------------------------------------
    | Booking reminders
    |----------------------------------------------------------------------
    |
    | How many minutes before a booking's start time the customer
    | receives their email / SMS reminder.
    |
    */

    'reminder_minutes' => env('REMINDER_MINUTES_BEFORE', 60),

    // Secret for the external scheduler ping at /api/cron/remind?key=...
    'cron_key' => env('CRON_KEY'),

];
