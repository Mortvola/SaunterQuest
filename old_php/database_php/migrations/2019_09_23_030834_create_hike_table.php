<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateHikeTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('hike', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('user_id');
            $table->string('name');
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON hike
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON hike");
        Schema::dropIfExists('hike');
    }
}
