<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddProfilePaceFactor extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('pace_factor')->nullable();
            $table->float('start_time')->nullable();
            $table->float('end_time')->nullable();
            $table->integer('break_duration')->nullable();
            $table->integer('end_day_extension')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pace_factor');
            $table->dropColumn('start_time');
            $table->dropColumn('end_time');
            $table->dropColumn('break_duration');
            $table->dropColumn('end_day_extension');
        });
    }
}
