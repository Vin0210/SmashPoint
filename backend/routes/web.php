<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Public avatar files (top level so photo_url needs no /api prefix)
Route::get('/photos/{file}', 'Api\PhotoController@show')->where('file', '[A-Za-z0-9._-]+');
