<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // When a Brevo API key is configured, route all mail through its
        // HTTP API instead of SMTP — works even if the host blocks
        // outbound mail ports.
        if (config('services.brevo.key')) {
            $this->app->extend('swift.mailer', function () {
                return new \Swift_Mailer(new \App\Services\BrevoTransport);
            });
        }
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}
