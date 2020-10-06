<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddShippingLocation extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('shipping_location', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('hike_id')->nullable ();
            $table->float('lat');
            $table->float('lng');
            $table->string('address1');
            $table->string('address2');
            $table->string('city');
            $table->string('state');
            $table->string('zip');
            $table->string('name');
            $table->string('in_care_of');
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON shipping_location
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON shipping_location");
        Schema::dropIfExists('shipping_location');
    }
}
