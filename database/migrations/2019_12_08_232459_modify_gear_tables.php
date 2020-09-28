<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ModifyGearTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        //
        Schema::table('gear_configuration_items', function (Blueprint $table) {
            $table->dropColumn('location');
            $table->dropColumn('system');
        });

        Schema::table('gear_configuration_items', function (Blueprint $table) {
            $table->boolean('worn')->default(false);
        });

        Schema::table('gear_items', function (Blueprint $table) {
            $table->boolean('consumable')->default(false);
            $table->string('system')->nullable ();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //

        Schema::table('gear_configuration_items', function (Blueprint $table) {
            $table->dropColumn('consumable');
            $table->dropColumn('system');
        });

        Schema::table('gear_configuration_items', function (Blueprint $table) {
            $table->dropColumn('worn');
        });

        Schema::table('gear_configuration_items', function (Blueprint $table) {
            $table->string('system')->nullable ();
            $table->string('location')->nullable ();
        });
    }
}
