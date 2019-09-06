<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Trail;

class restoreTileBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trail:restoreTileBackup {tileName}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Restores a trail backup';

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
        
        $tile = new Trail($tileName);
        
        $backups = $tile->getBackupList ();
        
        if (count($backups) > 0)
        {
            foreach ($backups as $backup)
            {
                $this->info ($backup["name"] . "\t" . $backup["size"] . "\t" . date(DATE_RFC2822, $backup["date"]));
            }
            
            $backup = $this->ask ('Enter backup name to restore');
            
            if (isset ($backup))
            {
                if ($tile->backupExists ($backup))
                {
                    // Backup current tile, if it exists
                    $backupName = $tile->createBackup ();
                    
                    $this->info("Backed up existing tile to " . $backupName);
                    
                    $tile->restoreFromBackup ($backup);
                }
                else
                {
                    $this->error ('Backup "' . $backup . '" does not exist.');
                }
            }
        }
        else
        {
            $this->error ("No backups found for " . $tileName);
        }
    }
}
