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

function assignDistances (&$segments, $startIndex)
{
    // Sanitize the data by recomputing the distances and elevations.
    for ($i = $startIndex; $i < count($segments); $i++)
    {
        // Remove the anchor if it appears to be malformed
        if (!isset($segments[$i]->point->lat) || !isset($segments[$i]->point->lng))
        {
            array_splice($segments, $i, 1);

            if ($i >= count($segments))
            {
                break;
            }
        }

        if ($i == $startIndex)
        {
            if ($i == 0)
            {
                $distance = 0;
            }
            else
            {
                $distance = $segments[$i]->dist;
            }
        }

        $segments[$i]->dist = $distance;
        $segments[$i]->point->ele = getElevation($segments[$i]->point->lat, $segments[$i]->point->lng);

        if ($i < count($segments) - 1)
        {
            // Find distance to next anchor, either via trail or straight line
            // distance.
            if (isset($segments[$i]->trail))
            {
                $prevLat = $segments[$i]->point->lat;
                $prevLng = $segments[$i]->point->lng;

                list ($distance, $prevLat, $prevLng) = assignTrailDistances($segments[$i]->trail, $distance, $prevLat, $prevLng);
                $distance += haversineGreatCircleDistance($prevLat, $prevLng, $segments[$i + 1]->point->lat, $segments[$i + 1]->point->lng);
            }
            else
            {
                $distance += haversineGreatCircleDistance($segments[$i]->point->lat, $segments[$i]->point->lng, $segments[$i + 1]->point->lat, $segments[$i + 1]->point->lng);
            }
        }
    }
}

function getHikeFolder ($userHikeId)
{
    return base_path("data/" . $userHikeId . "/");
}

function getRouteFromFile ($anchors)
{
    if (isset($anchors) && count($anchors) > 0)
    {
        for ($s = 0; $s < count($anchors) - 1; $s++)
        {
            // If this segment and the next start on the same trail then
            // find the route along the trail.
            if (isset($anchors[$s]->next->line_id) && isset($anchors[$s + 1]->prev->line_id) &&
                $anchors[$s]->next->line_id == $anchors[$s + 1]->prev->line_id &&
                $anchors[$s]->next->fraction != $anchors[$s + 1]->prev->fraction)
            {
                error_log("Points on same trail: " . $anchors[$s]->next->line_id);

                $trail = getPath($anchors[$s]->next->line_id, $anchors[$s]->next->fraction, $anchors[$s + 1]->prev->fraction);

                // array_splice ($anchors, $s + 1, 0, $trail);
                // $s += count($trail);
                $anchors[$s]->trail = $trail;
            }
            else
            {
                error_log("prev: " . json_encode($anchors[$s]));
                error_log("next: " . json_encode($anchors[$s + 1]));
            }
        }

        assignDistances($anchors, 0);

        return $anchors;
    }
}

function getRoutePointsFromUserHike ($hikeId)
{
    $route = new Route($hikeId);
    $path = $route->get ();

    $points = [ ];

    foreach ($path as $r)
    {
        array_push($points, $r);

        if (isset($r->trail))
        {
            foreach ($r->trail as $t)
            {
                array_push($points, $t);
            }
        }
    }

    return $points;
}
