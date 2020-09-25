<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->string('username');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
        });

	DB::statement(
		"CREATE OR REPLACE FUNCTION trigger_set_timestamp()
		RETURNS TRIGGER AS \$\$ 
		BEGIN
		  NEW.updated_at = NOW();
		  RETURN NEW;
		END;
		\$\$ LANGUAGE plpgsql"
	);

        DB::statement(
            "CREATE TRIGGER set_timestamp
         BEFORE UPDATE ON users
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
        DB::statement("DROP TRIGGER IF EXISTS set_timestamp ON users");
        Schema::dropIfExists('users');
    }
}
