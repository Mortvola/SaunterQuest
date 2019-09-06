<?php

namespace App;

require_once app_path('coordinates.php');
require_once app_path('routeFile.php');


class Trail
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
        $di = new \DirectoryIterator ($backupDir = Trail::getFolder ());
        
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
                    
                    $trail = json_decode($jsonString);
                    
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
    
    public function getFileName ()
    {
        return $this->tileName . ".trails";
    }
    
    public function getFullPath ()
    {
        return Trail::getFolder () . $this->getFileName ();
    }
    
    public static function getFolder ()
    {
        return base_path("trails/");
    }
    
    private static function getFullBackupPath ($backupName)
    {
        return Trail::getFolder () . Trail::BACKUP_FOLDER . $backupName;
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
                
                $trail = json_decode($jsonString);

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
                    $mergeCount = $this->combineTrailRoutes ($trail);
                    
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
                    $totalMergeCount = $this->combineTrailRoutes ($trail);
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
            
            // Determine bounds for each route and check to current bounds property.
            // If they are different, record an error.
            foreach ($trail->routes as $route)
            {
                $bounds = $this->getBounds ($route->route);
                
                if ($route->bounds != $bounds)
                {
                    $result->boundsErrorCount++;
                }
            }
        }
        
        return $result;
    }
    
    public function repair ($errors)
    {
        if ($errors->boundsErrorCount > 0)
        {
            foreach ($this->trails as $trail)
            {
                // Determine bounds for each route and check to current bounds property.
                // If they are different, record an error.
                foreach ($trail->routes as $route)
                {
                    $bounds = $this->getBounds ($route->route);
                    
                    if ($route->bounds != $bounds)
                    {
                        $route->bounds = $bounds;
                    }
                }
            }
        }
    }
    
    private function getBounds ($route)
    {
        foreach ($route as $r) {
            if (isset($r->lat) && isset($r->lng)) {
                if (!isset($minLat)) {
                    $minLat = $r->lat;
                } else {
                    $minLat = min($minLat, $r->lat);
                }
                
                if (!isset($maxLat)) {
                    $maxLat = $r->lat;
                } else {
                    $maxLat = max($maxLat, $r->lat);
                }
                
                if (!isset($minLng)) {
                    $minLng = $r->lng;
                } else {
                    $minLng = min($minLng, $r->lng);
                }
                
                if (!isset($maxLng)) {
                    $maxLng = $r->lng;
                } else {
                    $maxLng = max($maxLng, $r->lng);
                }
            }
        }
        
        return [$minLat, $minLng, $maxLat, $maxLng];
    }
    
    private function combineTrailRoutes ($trail)
    {
        $mergeCount = 0;
        
        for ($i = 0; $i < count($trail->routes);) {
            $route1 = $trail->routes[$i]->route;
            
            unset($overallMin);
            for ($j = $i + 1; $j < count($trail->routes); $j++) {
                
                $route2 = $trail->routes[$j]->route;
                
                $result = routeEndpointConnectivity($route1, $route2);
                
                if (!isset($overallMin)) {
                    $overallMin = $result->distance;
                    $bestRoute2 = $j;
                    $bestResult = $result;
                } else if ($result->distance < $overallMin) {
                    $overallMin = $result->distance;
                    $bestRoute2 = $j;
                    $bestResult = $result;
                }
            }
            
            if (isset($overallMin) && $overallMin <= 30)
            {
                if ($bestResult->first == 0)
                {
                    if ($bestResult->reverse)
                    {
                        $trail->routes[$i]->route = array_merge ($route1, array_reverse($route2));
                    }
                    else
                    {
                        $trail->routes[$i]->route = array_merge ($route1, $route2);
                    }
                }
                else
                {
                    if ($bestResult->reverse)
                    {
                        $trail->routes[$i]->route = array_merge (array_reverse($route2), $route1);
                    }
                    else
                    {
                        $trail->routes[$i]->route = array_merge ($route2, $route1);
                    }
                }
                
                // Remove the entry that was merged into the first
                array_splice ($trail->routes, $bestRoute2, 1);
                
                $mergeCount++;
                
                // Since we merged then we need to compare the newly merged
                // route against all the other routes so don't increment
                // the index.
            }
            else
            {
                //todo: if the current route had merges then we need to recalculate the 
                // bounds.
                $trail->routes[$i]->bounds = $this->getBounds ($trail->routes[$i]->route);
                
                // Nothing to see here, so move on to the next route.
                $i++;
            }
        }
        
        return $mergeCount;
    }
    
    public function createBackup ()
    {
        $backupDir = Trail::getFolder () . Trail::BACKUP_FOLDER;
        
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
        copy (Trail::getFullBackupPath ($backupName), $this->getFullPath ());
    }
    
    public function getBackupList ()
    {
        $di = new \DirectoryIterator ($backupDir = Trail::getFolder () . Trail::BACKUP_FOLDER);
        
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
        return file_exists (Trail::getFullBackupPath ($backupName));
    }
    
    public function removeBackup ($backupName)
    {
        if (file_exists (Trail::getFullBackupPath ($backupName)))
        {
            unlink (Trail::getFullBackupPath ($backupName));
        }
    }
}
