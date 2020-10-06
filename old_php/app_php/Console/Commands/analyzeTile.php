<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Tile;
use App\Map;

class analyzeTile extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trail:analyze {--tile=All} {--repair} {--remove-point-duplicates}';

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

        $removePathPointDuplicates = $this->option('remove-point-duplicates');

        if ($tileName == 'All')
        {
            $result = (object)[];
            $result->trailCount = 0;

            $tileList = Map::getAllTileNames ();

            $bar = $this->output->createProgressBar(count($tileList));

            $this->info ("Number of tiles to analyze: " . count($tileList));

            $bar->start();

            $tileErrorCount = 0;

            foreach ($tileList as $tileName)
            {
                $tile = new Tile($tileName);

                $tileResult = $tile->analyze ();

                $this->countRollup ($result, $tileResult, "routeCounts");
                $this->countRollup ($result, $tileResult, "distanceCounts");
                $result->trailCount += $tileResult->trailCount;

                if ($tileResult->boundsErrorCount > 0)
                {
                    $tileErrorCount++;
                }

                if ($repair)
                {
                    if ($tileResult->boundsErrorCount > 0)
                    {
                        $tile->setBounds ($tileResult);
                    }

                    $tile->clean ();

                    $tile->createBackup ();
                    $tile->save ();
                }

                if ($removePathPointDuplicates && $tileResult->intraPathDuplicatePoints > 0)
                {
                    $tile->removePathPointDuplicates ();
                }

                $bar->advance();
            }

            $bar->finish();

            $this->displayResults ($result);

            $this->info ("\nNumber of tiles with errors: " . $tileErrorCount);
        }
        else
        {
            $modified = false;
            $tile = new Tile($tileName);

            $tileResult = $tile->analyze ();

            $this->displayResults ($tileResult);

            if ($tileResult->boundsErrorCount > 0)
            {
                if ($repair)
                {
                    $tile->setBounds ();
                    $modified = true;
                }
            }

            if ($removePathPointDuplicates && $tileResult->intraPathDuplicatePoints > 0)
            {
                $tile->removePathPointDuplicates ();
                $modified = true;
            }

            if ($modified)
            {
                $tile->createBackup ();
                $tile->save ();
            }
        }
    }

    private function displayResults ($result)
    {
        $this->info ("Number of trails: " . $result->trailCount);

        ksort ($result->routeCounts, SORT_NUMERIC);
        foreach ($result->routeCounts as $key => $value)
        {
            $this->info ("Number of trails with " . $key . " paths: " . $value);
        }

        if (isset ($result->longestDistance))
        {
            $this->info ("Longest distance between path points: " . $result->longestDistance);
        }

        if (isset ($result->boundsErrorCount) && $result->boundsErrorCount > 0)
        {
            $this->error ("Number of paths with bounds error: " . $result->boundsErrorCount);
        }

        ksort ($result->distanceCounts, SORT_NUMERIC);
        foreach ($result->distanceCounts as $key => $value)
        {
            $this->info ("Number of trails with " . $key . " distance between points: " . $value);
        }

        $this->info("Number of inter file 'From' connections: " . $result->interFileFromConnections);
        $this->info("Number of inter file 'To' connections: " . $result->interFileToConnections);

        $this->info("Duplicate intra-path points: " . $result->intraPathDuplicatePoints);
        $this->info("Duplicate intra-trail inter-path points: " . $result->intraTrailInterPathDuplicatePoints);
    }

    private function countRollup ($result, $otherResult, $member)
    {
        if (!isset($result->$member))
        {
            $result->$member = $otherResult->$member;
        }
        else
        {
            foreach ($otherResult->$member as $key => $value)
            {
                if (!isset ($result->$member[$key]))
                {
                    $result->$member[$key] = $value;
                }
                else
                {
                    $result->$member[$key] += $value;
                }
            }
        }
    }
}
