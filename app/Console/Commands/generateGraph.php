<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Tile;
use App\Graph;

class GenerateGraph extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tile:generateGraph {tileName}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generates the graph file for the provided tile';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $tileName = $this->argument('tileName');

        $tile = new Tile($tileName);

        $graph = $tile->generateGraph ();

        if ($this->confirm ("Do you want to save the tile?"))
        {
//             $backupName = $tile->createBackup ();

//             $this->info("Backed up existing tile to " . $backupName);

            $this->info ("Saving tile");

            $graph->save ();
        }
    }
}
