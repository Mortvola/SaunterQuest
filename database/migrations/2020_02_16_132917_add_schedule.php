<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddSchedule extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('schedule', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('hike_id');
            $table->integer('start_time');
            $table->integer('elapsed_time');
            $table->float('start_meters');
            $table->float('meters');
            $table->float('gain');
            $table->float('loss');
            $table->bigInteger('sort_order');
        });

        DB::statement ("ALTER TABLE schedule ADD COLUMN way geometry NOT NULL");

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON schedule
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON schedule");
        Schema::dropIfExists('schedule');
    }
}
