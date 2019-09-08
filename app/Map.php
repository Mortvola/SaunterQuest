<?php

namespace App;


class Map
{
    public static function getTileList ($bounds)
    {
        $result = Map::getTileNames($bounds);
        
        return $result;
    }
    
    public static function getTileNames ($bounds)
    {
        list($minLat, $minLng) = Map::getTileOffsets ($bounds[0], $bounds[1]);
        list($maxLat, $maxLng) = Map::getTileOffsets ($bounds[2], $bounds[3]);
        
        $files = [];
        
        for ($lat = $minLat; $lat <= $maxLat; $lat += 5)
        {
            for ($lng = $minLng; $lng <= $maxLng; $lng += 5)
            {
                $baseName = Map::getTileNameFromPoint ($lat / 10.0, $lng / 10.0);
                
                if (Tile::tileExists ($baseName))
                {
                    $files[] = (object)["name" => $baseName, "bounds" => [$lat / 10.0, $lng / 10.0, ($lat + 5) / 10.0, ($lng + 5) / 10.0]];
                }
            }
        }
        
        return (object)["tiles" => $files, "bounds" => [$minLat / 10.0, $minLng / 10.0, ($maxLat + 5) / 10.0, ($maxLng + 5) / 10.0]];
    }
    
    private static function getTileOffsets ($lat, $lng)
    {
        $lat = floor($lat * 2) * 5;
        $lng = floor($lng * 2) * 5;
        
        return [$lat, $lng];
    }
    
    
    public static function getAllTileNames ()
    {
        $di = new \DirectoryIterator (Tile::getFolder ());
        
        $files = [];
        
        foreach ($di as $fileInfo)
        {
            if ($fileInfo->isFile ())
            {
                list($basename, $extension) = explode ('.', $fileInfo->getFileName ());
                
                if ($extension == 'trails')
                {
                    $files[] = $basename;
                }
            }
        }
        
        return $files;
    }
    
    public static function getTileFromPoint ($lat, $lng)
    {
        $tileName = Map::getTileNameFromPoint ($lat, $lng);
        
        $tile = new Tile ($tileName);
        
        return $tile;
    }
    
    public static function getTileNameFromPoint ($lat, $lng)
    {
        list($lat, $lng) = Map::getTileOffsets ($lat, $lng);
        
        if ($lat >= 0) {
            $fileName = "N" . $lat;
        } else {
            $fileName = "S" . -$lat;
        }
        
        if ($lng >= 0) {
            $fileName .= "E" . $lng;
        } else {
            $fileName .= "W" . -$lng;
        }
        
        return $fileName;
    }
    
    public static function getTrailFromPoint ($point)
    {
        $tile = Map::getTileFromPoint ($point->lat, $point->lng);
        
        $result = $tile->getTrailFromPoint ($point);
        
        if (isset($result))
        {
            return $result;
        }
    }
}
