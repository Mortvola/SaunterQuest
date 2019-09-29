<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPointOfInterest extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('point_of_interest', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->string('name')->nullable ();
            $table->string('description')->nullable ();
            $table->float('lat');
            $table->float('lng');
            $table->bigInteger('user_hike_id')->nullable ();
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON point_of_interest
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON point_of_interest");
        Schema::dropIfExists('point_of_interest');
    }
}
