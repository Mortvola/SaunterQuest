<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddGear extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('gear_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('user_id');
            $table->string('name');
            $table->string('description')->nullable();
            $table->float('weight')->nullable();
            $table->string('unit_of_measure')->nullable();
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON gear_items
             FOR EACH ROW
             EXECUTE PROCEDURE trigger_set_timestamp()");

        Schema::create('gear_configurations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('user_id');
            $table->string('name');
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
         BEFORE UPDATE ON gear_configurations
         FOR EACH ROW
         EXECUTE PROCEDURE trigger_set_timestamp()");

        Schema::create('gear_configuration_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->biginteger('gear_configuration_id');
            $table->biginteger('gear_item_id')->nullable ();
            $table->string('system')->nullable ();
            $table->integer('quantity')->nullable ();
            $table->string('location')->nullable ();
        });

        DB::statement(
                "CREATE TRIGGER set_timestamp
         BEFORE UPDATE ON gear_configuration_items
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON gear_items");
        Schema::dropIfExists('gear_items');

        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON gear_configurations");
        Schema::dropIfExists('gear_configurations');

        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON gear_configuration_items");
        Schema::dropIfExists('gear_configuration_items');
    }
}

