<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPaymentFieldsToBookingsTable extends Migration
{
    public function up()
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Replacement index must exist BEFORE dropping the unique key:
            // the court_id foreign key uses it.
            $table->index(['court_id', 'booking_date'], 'court_date_index');

            // NOTE: the original unique(court_id, booking_date, start_time) index
            // prevented re-booking a cancelled slot; replaced with a plain index.
            $table->dropUnique('court_slot_unique');

            $table->string('reference', 20)->unique()->after('id');
            $table->enum('payment_method', ['cash', 'gcash', 'maya', 'gotyme'])->nullable()->after('status');
            $table->enum('payment_status', ['unpaid', 'pending_verification', 'paid'])
                ->default('unpaid')->after('payment_method');
            $table->string('payment_reference', 100)->nullable()->after('payment_status');
        });
    }

    public function down()
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('court_date_index');
            $table->dropUnique('bookings_reference_unique');
            $table->dropColumn(['reference', 'payment_method', 'payment_status', 'payment_reference']);
            $table->unique(['court_id', 'booking_date', 'start_time'], 'court_slot_unique');
        });
    }
}
