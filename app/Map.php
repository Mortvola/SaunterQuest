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
        list($minLat, $minLng) = Map::getTileOffsets ((object)["lat" => $bounds[0], "lng" => $bounds[1]]);
        list($maxLat, $maxLng) = Map::getTileOffsets ((object)["lat" => $bounds[2], "lng" => $bounds[3]]);

        $files = [];

        for ($lat = $minLat; $lat <= $maxLat; $lat += 5)
        {
            for ($lng = $minLng; $lng <= $maxLng; $lng += 5)
            {
                $baseName = Map::getTileNameFromPoint ((object)["lat" => $lat / 10.0, "lng" => $lng / 10.0]);

                if (Tile::tileExists ($baseName))
                {
                    $files[] = (object)["name" => $baseName, "bounds" => [$lat / 10.0, $lng / 10.0, ($lat + 5) / 10.0, ($lng + 5) / 10.0]];
                }
            }
        }

        return (object)["tiles" => $files, "bounds" => [$minLat / 10.0, $minLng / 10.0, ($maxLat + 5) / 10.0, ($maxLng + 5) / 10.0]];
    }

    private static function getTileOffsets ($point)
    {
        $lat = floor($point->lat * 2) * 5;
        $lng = floor($point->lng * 2) * 5;

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

    public static function getTileFromPoint ($point)
    {
        $tileName = Map::getTileNameFromPoint ($point);

        $tile = new Tile ($tileName);

        return $tile;
    }

    public static function getTileNameFromPoint ($point)
    {
        list($lat, $lng) = Map::getTileOffsets ($point);

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
        $tile = Map::getTileFromPoint ($point);

        return $tile->getTrailFromPoint ($point);
    }
}
