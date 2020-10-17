<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddDayTemplateFoodItem extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('day_template_food_item', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->bigInteger('day_template_id');
            $table->bigInteger('food_item_id');
            $table->bigInteger('food_item_serving_size_id');
            $table->float('number_of_servings');
            $table->bigInteger('meal_time_id');
        });

        DB::statement(
            "CREATE TRIGGER set_timestamp
             BEFORE UPDATE ON day_template_food_item
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON day_template_food_item");
        Schema::dropIfExists('day_template_food_item');
    }
}
