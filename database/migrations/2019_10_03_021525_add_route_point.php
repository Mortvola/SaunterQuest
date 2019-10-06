<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddRoutePoint extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('route_point', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('hike_id');
            $table->float('lat');
            $table->float('lng');
            $table->bigInteger('prev_line_id')->nullable ();
            $table->float('prev_fraction')->nullable ();
            $table->bigInteger('next_line_id')->nullable ();
            $table->float('next_fraction')->nullable ();
            $table->string('type')->nullable ();
            $table->bigInteger('type_id')->nullable ();
            $table->bigInteger('order');
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
         BEFORE UPDATE ON route_point
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON route_point");
        Schema::dropIfExists('route_point');
    }
}
