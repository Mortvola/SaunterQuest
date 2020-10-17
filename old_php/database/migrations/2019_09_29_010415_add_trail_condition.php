<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTrailCondition extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('trail_condition', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('hike_id')->nullable ();
            $table->float('start_lat');
            $table->float('start_lng');
            $table->float('end_lat');
            $table->float('end_lng');
            $table->integer('type');
            $table->string('description')->nullable ();
            $table->integer('speed_factor')->nullable ();
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON trail_condition
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON trail_condition");
        Schema::dropIfExists('trail_condition');
    }
}
