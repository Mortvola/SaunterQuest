<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddHikerProfile extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('hiker_profile', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('hike_id')->nullable();
            $table->integer('start_day')->nullable();
            $table->integer('end_day')->nullable();
            $table->integer('speed_factor')->nullable();
            $table->float('start_time')->nullable();
            $table->float('end_time')->nullable();
            $table->float('break_duration')->nullable();
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON hiker_profile
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON hiker_profile");
        Schema::dropIfExists('hiker_profile');
    }
}
