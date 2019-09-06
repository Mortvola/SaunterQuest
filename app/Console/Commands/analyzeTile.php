<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Trail;

class analyzeTile extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trail:analyze {--tile=All} {--repair}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyzes tiles and looks for errors';

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
        $tileName = $this->option('tile');

        $repair = $this->option('repair');
        
        if ($tileName == 'All')
        {
            $tileList = Trail::getTileNames ();
            
            $bar = $this->output->createProgressBar(count($tileList));
            
            $this->info ("Number of tiles to analyze: " . count($tileList));
            
            $bar->start();
            
            $tileErrorCount = 0;
            
            foreach ($tileList as $tileName)
            {
                $tile = new Trail($tileName);
                
                $result = $tile->analyze ();
                
                if ($result->boundsErrorCount > 0)
                {
                    if ($repair)
                    {
                        $tile->repair ($result);
                     
                        $tile->createBackup ();
                        $tile->save ();
                    }
                    
                    $tileErrorCount++;
                }
                
                $bar->advance();
            }
            
            $bar->finish();
            
            $this->info ("\nNumber of tiles with errors: " . $tileErrorCount);
        }
        else
        {
            $tile = new Trail($tileName);
            
            $this->analyze ($tile);
        }
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
    
}
