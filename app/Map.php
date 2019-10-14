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

    public static function getPointOnLine ($lineId, $fraction)
    {
        $sql = "select ST_AsGeoJSON(ST_Transform(ST_LineInterpolatePoint(way, :fraction:), 4326)) AS point
                from planet_osm_line
                where line_id = :lineId:";

        $sql = str_replace (":fraction:", $fraction, $sql);
        $sql = str_replace (":lineId:", $lineId, $sql);

        $result = \DB::connection('pgsql')->select ($sql);

        $coordinate = json_decode($result[0]->point)->coordinates;

        return (object)["lat" => $coordinate[1], "lng" => $coordinate[0]];
    }

    public static function getTrailFromPoint ($point)
    {
        $point = "ST_Transform('SRID=4326;POINT(" . $point->lng . " " . $point->lat . ")'::geometry, 3857)";

        $sql = "SELECT
                ST_Distance(L2.way, :point:) AS distance,
                ST_AsGeoJSON(ST_Transform(ST_ClosestPoint(L2.way, :point:), 4326)) AS point,
                ST_LineLocatePoint(L2.way, :point:) AS fraction,
                e.*
            FROM
                (SELECT *
                FROM
                planet_osm_line
                WHERE highway is not null
                ORDER BY way <-> :point:
                LIMIT 10) L2
            JOIN nav_edges e ON e.line_id = L2.line_id
            and ST_LineLocatePoint(L2.way, :point:) between e.start_fraction and e.end_fraction
            ORDER BY 1 ASC
            LIMIT 1";

        $result = \DB::connection('pgsql')->select (str_replace (":point:", $point, $sql));

        if (count($result) > 0)
        {
            $coordinates = json_decode($result[0]->point)->coordinates;
            $result[0]->point = (object)["lat" => $coordinates[1], "lng" => $coordinates[0]];

            return $result[0];
        }
    }

    public static function getIntersections ($bounds)
    {
        $boundingBox = "ST_SetSRID(ST_MakeBox2D(ST_Transform('SRID=4326;POINT(" .
            $bounds[1] . " " . $bounds[0] . ")'::geometry, 3857), ST_Transform('SRID=4326;POINT(" .
            $bounds[3] . " " . $bounds[2] . ")'::geometry, 3857)), 3857)";

        $intersections = \DB::connection('pgsql')->select (
           "select distinct ST_AsGeoJSON(ST_Transform(ST_Intersection(l1.way, l2.way), 4326)) coordinate
            from planet_osm_line l1
            join planet_osm_line l2 on l1.ctid != l2.ctid and ST_Intersects(l1.way, l2.way) and l2.highway is not null
            where l1.highway is not null
            and GeometryType(ST_Intersection(l1.way, l2.way)) = 'POINT'
            and l1.way && " . $boundingBox . "
            and l2.way && " . $boundingBox . "
            and ST_ContainsProperly (" . $boundingBox . ", ST_Intersection(l1.way, l2.way))"
        );

        foreach ($intersections as $intersection)
        {
            $intersection->coordinate = json_decode($intersection->coordinate);
        }

        return $intersections;
    }

    static public function getPath ($lineId, $startFraction, $endFraction)
    {
        if ($startFraction > $endFraction)
        {
            $startFraction = 1 - $startFraction;
            $endFraction = 1 -$endFraction;

            $way = 'ST_Reverse(way)';
        }
        else
        {
            $way = 'way';
        }

        $sql = "select ST_AsGeoJSON(ST_Transform(ST_LineSubstring (:way:, :start:, :end:), 4326)) AS linestring
            from planet_osm_line
            where line_id = :lineId:
            limit 1";

        $sql = str_replace (":way:", $way, $sql);
        $sql = str_replace (":start:", $startFraction, $sql);
        $sql = str_replace (":end:", $endFraction, $sql);
        $sql = str_replace (":lineId:", $lineId, $sql);

        $result = \DB::connection('pgsql')->select ($sql);

        $coordinates = json_decode($result[0]->linestring)->coordinates;
        $points = [];

        foreach ($coordinates as $coord)
        {
            $points[] = (object)["point" => (object)["lat" => $coord[1], "lng" => $coord[0]]];
        }

        return $points;
    }

    static public function getPathFromLineId ($lineId)
    {
        $sql = "select ST_AsGeoJSON(ST_Transform(way, 4326)) AS linestring
            from planet_osm_line
            where line_id = :lineId:
            limit 1";

        $sql = str_replace (":lineId:", $lineId, $sql);

        $result = \DB::connection('pgsql')->select ($sql);

        $coordinates = json_decode($result[0]->linestring)->coordinates;
        $points = [];

        foreach ($coordinates as $coord)
        {
            $points[] = (object)["point" => (object)["lat" => $coord[1], "lng" => $coord[0]]];
        }

        return $points;
    }
}
