<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddNavNodes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
	    DB::Statement ("CREATE SEQUENCE nav_node_id_seq INCREMENT 1");

	    DB::statement (
		"CREATE TABLE nav_nodes
		(
		  id integer NOT NULL DEFAULT nextval('nav_node_id_seq'::regclass),
		  edges integer[],
		  way geometry,
		  CONSTRAINT nav_node_pkey PRIMARY KEY (id)
		)");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
	    Schema::drop('nav_nodes');

	    DB::Statement ( "DROP SEQUENCE nav_node_id_seq");
    }
}
