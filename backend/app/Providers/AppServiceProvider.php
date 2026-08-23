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
        // When an HTTP mail API provider is configured, route all mail
        // through its web API instead of SMTP — works even if the host
        // blocks outbound mail ports.
        if (config('services.mail_api.provider')) {
            $this->app->extend('swift.mailer', function () {
                return new \Swift_Mailer(new \App\Services\HttpApiTransport);
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
