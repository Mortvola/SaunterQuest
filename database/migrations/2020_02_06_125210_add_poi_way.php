<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPoiWay extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement ("ALTER TABLE point_of_interest ADD COLUMN way geometry NOT NULL");

        Schema::table('point_of_interest', function (Blueprint $table) {
            $table->dropColumn('lat');
            $table->dropColumn('lng');
        });

    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('point_of_interest', function (Blueprint $table) {
            $table->float('lat');
            $table->float('lng');
            $table->dropColumn('way');
        });
    }
}
