<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Trail;

class combineRoutes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trail:combineRoutes  {trailFile} {--cn=All}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Combines routes within a trail object';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    private function analyze ($tile)
    {
        $result = $tile->analyze ();
        
        $this->info ("Number of trails: " . $result->trailCount);
        
        foreach ($result->routeCounts as $key => $value)
        {
            $this->info ("Number of trails with " . $key . " routes: " . $value);
        }
        
        if ($result->boundsErrorCount > 0)
        {
            $this->error ("Number of routes with bounds error: " . $result->boundsErrorCount);
        }
        
        return $result;
    }
    
    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $tileName = $this->argument('trailFile');
        $cn = $this->option('cn');
        
        $tile = new Trail($tileName);
        $tile->load ();

        $analysis = $this->analyze ($tile);
        
        if ($analysis->boundsErrorCount > 0)
        {
            $proceed = $this->confirm ("Tile contains errors. Do you wish to proceed?");
        }
        
        if (!isset ($proceed) || $proceed)
        {
            $result = $tile->combineRoutes($cn);
            
            $this->info ("Trails updated: " . $result->trailsUpdated);
            $this->info ("Number of merges: " . $result->numberOfMerges);
            
            $this->analyze ($tile);
            
            if ($this->confirm ("Do you want to save the tile?"))
            {
                $backupName = $tile->createBackup ();
                
                $this->info("Backed up existing tile to " . $backupName);
                
                $this->info ("Saving tile");
                
                $tile->save ();
            }
        }
    }
}
