<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddFoodItem extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('food_item', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->string('name');
            $table->integer('calories');
            $table->string('manufacturer')->nullable();
            $table->float('grams_serving_size');
            $table->float('total_fat')->nullable();
            $table->float('saturated_fat')->nullable();
            $table->float('trans_fat')->nullable();
            $table->integer('cholesterol')->nullable();
            $table->integer('sodium')->nullable();
            $table->integer('total_carbohydrates')->nullable();
            $table->integer('dietary_fiber')->nullable();
            $table->integer('sugars')->nullable();
            $table->integer('protein')->nullable();
            $table->string('serving_size_description');
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON food_item
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON food_item");
        Schema::dropIfExists('food_item');
    }
}
