<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateCourtPhotosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('court_photos', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('court_id');
            $table->string('filename');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('court_id')
                  ->references('id')->on('courts')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('court_photos');
    }
}
