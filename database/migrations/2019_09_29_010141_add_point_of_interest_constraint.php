<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPointOfInterestConstraint extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('point_of_interest_constraint', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('point_of_interest_id');
            $table->string('type')->nullable ();
            $table->integer('time')->nullable ();
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON point_of_interest_constraint
             FOR EACH ROW
             EXECUTE PROCEDURE trigger_set_timestamp()");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON point_of_interest_constraint");
        Schema::dropIfExists('point_of_interest_constraint');
    }
}
