<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddNavEdges extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
    	DB::statement("CREATE SEQUENCE nav_edge_id_seq INCREMENT 1");

    	DB::statement(
    	    "CREATE TABLE nav_edges
    		(
    		  id integer NOT NULL DEFAULT nextval('nav_edge_id_seq'::regclass),
    		  start_node integer,
    		  end_node integer,
    		  start_fraction double precision,
    		  end_fraction double precision,
    		  forward_cost double precision,
    		  backward_cost double precision,
    		  line_id bigint,
    		  CONSTRAINT nav_edge_pkey PRIMARY KEY (id)
    		)");
        //
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
	    Schema::drop('nav_edges');
	    DB::statement('drop sequence nav_edge_id_seq');
    }
}
