<?php

use App\User;
use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    public function run()
    {
        factory(User::class)->create([
            'name'     => 'Admin',
            'email'    => 'admin@pickleball.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);

        factory(User::class)->create([
            'name'     => 'Demo Customer',
            'email'    => 'customer@pickleball.com',
            'password' => bcrypt('password'),
            'role'     => 'customer',
        ]);
    }
}
