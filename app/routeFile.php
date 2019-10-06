<?php
use App\Map;
use App\Route;

require_once "coordinates.php";


function getPath ($lineId, $startFraction, $endFraction)
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

function assignTrailDistances ($trail, $distance, $prevLat, $prevLng)
{
    for ($t = 0; $t < count($trail); $t++)
    {
        $distance += haversineGreatCircleDistance($prevLat, $prevLng, $trail[$t]->point->lat, $trail[$t]->point->lng);

        $trail[$t]->dist = $distance;
        $trail[$t]->point->ele = getElevation($trail[$t]->point->lat, $trail[$t]->point->lng);

        $prevLat = $trail[$t]->point->lat;
        $prevLng = $trail[$t]->point->lng;
    }

    return [
        $distance,
        $prevLat,
        $prevLng
    ];
}

function assignDistances ($anchors)
{
    foreach ($anchors as $anchor)
    {
        if (isset($prevAnchor))
        {
            // Find distance from previous anchor, either via trail or straight line
            // distance.
            $prevLat = $prevAnchor->lat;
            $prevLng = $prevAnchor->lng;

            if (isset($prevAnchor->trail))
            {
                list ($distance, $prevLat, $prevLng) = assignTrailDistances($prevAnchor->trail, $distance, $prevLat, $prevLng);
            }

            $distance += haversineGreatCircleDistance($prevLat, $prevLng, $anchor->lat, $anchor->lng);
        }
        else
        {
            $distance = 0;
        }

        $anchor->dist = $distance;
        $anchor->ele = getElevation($anchor->lat, $anchor->lng);

        $prevAnchor = $anchor;
    }
}

function getHikeFolder ($userHikeId)
{
    return base_path("data/" . $userHikeId . "/");
}

