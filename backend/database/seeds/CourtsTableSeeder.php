<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourtsTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('courts')->insert([
            [
                'name'        => 'Court A - Indoor Pro',
                'surface'     => 'indoor',
                'hourly_rate' => 550.00,
                'peak_rate'   => 700.00,
                'open_time'   => '07:00:00',
                'close_time'  => '22:00:00',
            ],
            [
                'name'        => 'Court B - Indoor',
                'surface'     => 'indoor',
                'hourly_rate' => 450.00,
                'peak_rate'   => 600.00,
                'open_time'   => '07:00:00',
                'close_time'  => '22:00:00',
            ],
            [
                'name'        => 'Court C - Outdoor',
                'surface'     => 'outdoor',
                'hourly_rate' => 350.00,
                'peak_rate'   => 450.00,
                'open_time'   => '06:00:00',
                'close_time'  => '21:00:00',
            ],
            [
                'name'        => 'Court D - Covered Court',
                'surface'     => 'outdoor',
                'hourly_rate' => 400.00,
                'peak_rate'   => 500.00,
                'open_time'   => '06:00:00',
                'close_time'  => '22:00:00',
            ],
        ]);
    }
}
