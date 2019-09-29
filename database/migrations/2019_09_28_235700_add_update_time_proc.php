<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddUpdateTimeProc extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement (
            "CREATE OR REPLACE FUNCTION trigger_set_timestamp()
             RETURNS TRIGGER AS $$
             BEGIN
                 NEW.updated_at = NOW();
                 RETURN NEW;
             END;
             $$ LANGUAGE plpgsql");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement ("DROP FUNCTION trigger_set_timestamp()");
    }
}
