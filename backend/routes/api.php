<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('/register', 'Api\AuthController@register')->middleware('throttle:10,1');
Route::post('/login', 'Api\AuthController@login')->middleware('throttle:10,1');
Route::post('/forgot-password', 'Api\AuthController@forgotPassword')->middleware('throttle:6,1');
Route::post('/reset-password', 'Api\AuthController@resetPassword')->middleware('throttle:6,1');

Route::get('/courts', 'Api\CourtController@index');
Route::get('/availability', 'Api\BookingController@availability');

// External scheduler ping (cron-job.org etc.) for hosts without cron.
// Calls the same reminder command the local Windows task runs.
Route::get('/cron/remind', function () {
    abort_unless(
        hash_equals(config('bookings.cron_key', ''), request()->query('key', '')),
        403,
        'Invalid key'
    );

    \Artisan::call('bookings:remind');

    return response()->json(['ok' => true, 'output' => trim(\Artisan::output())]);
});

Route::middleware('auth:api')->group(function () {
    Route::get('/me', 'Api\AuthController@me');
    Route::post('/logout', 'Api\AuthController@logout');

    Route::patch('/profile', 'Api\AuthController@updateProfile');
    Route::post('/profile/photo', 'Api\AuthController@uploadPhoto')->middleware('throttle:10,1');
    Route::patch('/profile/password', 'Api\AuthController@changePassword');

    Route::get('/bookings', 'Api\BookingController@index');
    Route::post('/bookings', 'Api\BookingController@store');
    Route::patch('/bookings/{booking}/pay', 'Api\BookingController@pay');
    Route::patch('/bookings/{booking}/cancel', 'Api\BookingController@cancel');

    /*
    |----------------------------------------------------------------------
    | Admin
    |----------------------------------------------------------------------
    */
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', 'Api\AdminController@stats');
        Route::get('/bookings', 'Api\AdminController@bookings');
        Route::patch('/bookings/{booking}/payment', 'Api\AdminController@updatePayment');

        Route::get('/courts', 'Api\AdminController@courts');
        Route::post('/courts', 'Api\AdminController@storeCourt');
        Route::patch('/courts/{court}', 'Api\AdminController@updateCourt');
        Route::delete('/courts/{court}', 'Api\AdminController@destroyCourt');
        Route::post('/courts/{court}/photos', 'Api\AdminController@uploadCourtPhoto');
        Route::delete('/courts/{court}/photos/{photo}', 'Api\AdminController@deleteCourtPhoto');

        Route::get('/users', 'Api\AdminController@users');
        Route::post('/users/{user}/reset-password', 'Api\AdminController@resetUserPassword');
    });
});
