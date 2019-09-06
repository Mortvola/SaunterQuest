<?php

namespace App;

require_once app_path('coordinates.php');
require_once app_path('routeFile.php');


class Tile
{
    private $tileName;
    private $trails;
    
    private const BACKUP_FOLDER = 'backups/';
    
    public function __construct ($tileName)
    {
        $this->tileName = $tileName;
    }
    
    public static function getTileList ($bounds)
    {
        $response = (object)[];
        
        list($response->tiles, $response->bounds) = getTileNames($bounds);
        
        return json_encode($response);
    }
    
    public static function getTileNames ()
    {
        $di = new \DirectoryIterator ($backupDir = Tile::getFolder ());
        
        $files = [];
        
        foreach ($di as $fileInfo)
        {
            if ($fileInfo->isFile ())
            {
                $parts = explode ('.', $fileInfo->getFileName ());
            
                if (count($parts) == 2 && $parts[1] == 'trails')
                {
                    $files[] = $parts[0];
                }
            }
            
        }
        
        return $files;
    }
       
    public function get ()
    {
        $fileName = $this->getFullPath ();
        
        $response = '{ "name":"' . $this->tileName . '", "trails":[';

        if (file_exists($fileName))
        {
            $handle = fopen($fileName, "rb");
            
            if ($handle) {
                $first = true;
                
                for (;;) {
                    $jsonString = fgets($handle);
                    
                    if (!$jsonString) {
                        break;
                    }
                    
                    $trail = Trail::fromJSON ($jsonString);
                    
                    if (isset($trail)) {
                        if (isset($trail->routes)) {
                            $t = (object)[ "type" => $trail->type, "cn" => $trail->cn, "routes" => $trail->routes];
                            
                            if (isset ($trail->name))
                            {
                                $t->name = $trail->name;
                            }
                            
                            if (!$first) {
                                $response .= ",";
                            }
                            $first = false;
                            
                            $response .= json_encode($t);
                        }
                    } else {
                        $response .= "Failed to JSON decode:\n";
                        $reponse .= $jsonString;
                    }
                }
                
                fclose($handle);
            }
        }
        
        $response .= ']}';
                
        return $response;
    }
    
    public function getTrail ($cn)
    {
        if (isset($trails))
        {
            $trail = $trails[$cn];
        }
        else
        {
            $fileName = $this->getFullPath ();
            
            if (file_exists($fileName))
            {
                $handle = fopen($fileName, "rb");
                
                if ($handle) {
                    
                    for (;;) {
                        $jsonString = fgets($handle);
                        
                        if (!$jsonString) {
                            break;
                        }
                        
                        $trail = Trail::fromJSON($jsonString);
                        
                        if (isset($trail) && isset($trail->cn) && $trail->cn == $cn) {
                            break;
                        }
                    }
                    
                    fclose($handle);
                }
            }
        }
        
        if (isset ($trail))
        {
            return $trail;
        }
    }
    
    public function getFileName ()
    {
        return $this->tileName . ".trails";
    }
    
    public function getFullPath ()
    {
        return Tile::getFolder () . $this->getFileName ();
    }
    
    public static function getFolder ()
    {
        return base_path("trails/");
    }
    
    private static function getFullBackupPath ($backupName)
    {
        return Tile::getFolder () . Tile::BACKUP_FOLDER . $backupName;
    }
    
    public function load ()
    {
        $fileName = $this->getFullPath ();
        
        $handle = fopen($fileName, "rb");
        
        if ($handle) {
            $this->trails = [];
            
            for (;;) {
                $jsonString = fgets($handle);
                
                if (!$jsonString) {
                    break;
                }
                
                $trail = Trail::fromJSON($jsonString);

                $this->trails[$trail->cn] = $trail;
            }
            
            fclose($handle);
        
        } else {
            error_log("Unable to open file " . $fileName);
        }
    }
    
    public function save ()
    {
        $handle = fopen ($this->getFullPath (), "wb");
        
        if ($handle)
        {
            
            foreach ($this->trails as $trail)
            {
                $jsonString = json_encode($trail) . "\n";
                
                fwrite($handle, $jsonString);
            }
            
            fclose ($handle);
        }
    }
    
    public function combineRoutes ($cn)
    {
        if (isset($this->trails)) {
        
            $trailCount = 0;
            $totalMergeCount = 0;
            
            if ($cn == 'All')
            {
                foreach ($this->trails as $trail)
                {
                    $mergeCount = $trail->combineRoutes ();
                    
                    if ($mergeCount != 0)
                    {
                        $trailCount++;
                        $totalMergeCount += $mergeCount;
                    }
                }
            }
            else {
                if (isset ($this->trails[$cn]))
                {
                    $trail = $this->trails[$cn];
                    $totalMergeCount = $trail->combineRoutes ();
                    $trailCount = 1;
                }
                else
                {
                    error_log ("Could not find find trail with CN " . $cn);
                }
            }
        
            return (object)["trailsUpdated" => $trailCount, "numberOfMerges" => $totalMergeCount];
        }
    }

    public function analyze ()
    {
        // Load the tile if not already loaded.
        if (!isset($this->trails))
        {
            $this->load();
        }
        
        $result = (object)[];
        
        $result->trailCount = count ($this->trails);
        
        $result->routeCounts = [];
        $result->boundsErrorCount = 0;
        
        foreach ($this->trails as $trail)
        {
            $routeCount = count ($trail->routes);
            
            if (!isset ($result->routeCounts[$routeCount]))
            {
                $result->routeCounts[$routeCount] = 1;
            }
            else
            {
                $result->routeCounts[$routeCount]++;
            }
            
            $result->boundsErrorCount = $trail->analyze ();
        }
        
        return $result;
    }
    
    public function repair ($errors)
    {
        if ($errors->boundsErrorCount > 0)
        {
            foreach ($this->trails as $trail)
            {
                $trail->setBounds ();
            }
        }
    }
    
    public function createBackup ()
    {
        $backupDir = Tile::getFolder () . Tile::BACKUP_FOLDER;
        
        // Ensure backup folder exists.
        if (!is_dir ($backupDir))
        {
            mkdir($backupDir);
        }
        
        $counter = 0;
        
        for (;;)
        {
            $backupFileName = $backupDir . $this->getFileName ();
            
            if ($counter > 0)
            {
                $backupFileName .= '.' . $counter;
            }
            
            if (!file_exists ($backupFileName))
            {
                copy ($this->getFullPath(), $backupFileName);
                
                return $backupFileName;
            }
            
            $counter++;
        }
    }
    
    public function restoreFromBackup ($backupName)
    {
        copy (Tile::getFullBackupPath ($backupName), $this->getFullPath ());
    }
    
    public function getBackupList ()
    {
        $di = new \DirectoryIterator ($backupDir = Tile::getFolder () . Tile::BACKUP_FOLDER);
        
        $files = [];
        
        foreach ($di as $fileInfo)
        {
            if ($fileInfo->isFile () && substr($fileInfo->getFileName (), 0, strlen($this->getFileName ())) === $this->getFileName ())
            {
                $files[] = ["date" => $fileInfo->getMTime (), "name" => $fileInfo->getFileName (), "size" => $fileInfo->getSize ()];
            }
        }
        
        asort ($files);
        
        return $files;
    }
    
    public function backupExists ($backupName)
    {
        return file_exists (Tile::getFullBackupPath ($backupName));
    }
    
    public function removeBackup ($backupName)
    {
        if (file_exists (Tile::getFullBackupPath ($backupName)))
        {
            unlink (Tile::getFullBackupPath ($backupName));
        }
    }
}
