<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateCourtsTable extends Migration
{
    public function up()
    {
        Schema::create('courts', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->enum('surface', ['indoor', 'outdoor'])->default('outdoor');
            $table->decimal('hourly_rate', 8, 2)->default(0);
            $table->time('open_time')->default('07:00:00');
            $table->time('close_time')->default('22:00:00');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('courts');
    }
}
