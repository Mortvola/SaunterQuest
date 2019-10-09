<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class RenamePointOfInterestConstraint extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::rename('point_of_interest_constraint', 'time_constraint');

        Schema::table('time_constraint', function (Blueprint $table) {
            $table->renameColumn('point_of_interest_id', 'object_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('time_constraint', function (Blueprint $table) {
            $table->renameColumn('object_id', 'point_of_interest_id');
        });

        Schema::rename('time_constraint', 'point_of_interest_constraint');
    }
}
