<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPeakRateToCourtsTable extends Migration
{
    public function up()
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->decimal('peak_rate', 8, 2)->default(0)->after('hourly_rate');
        });
    }

    public function down()
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->dropColumn('peak_rate');
        });
    }
}
