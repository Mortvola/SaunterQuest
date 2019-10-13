<?php
use App\Map;
use App\Route;
use App\Elevation;

require_once "coordinates.php";


function assignTrailDistances ($trail, $distance, $prevLat, $prevLng)
{
    for ($t = 0; $t < count($trail); $t++)
    {
        $distance += haversineGreatCircleDistance($prevLat, $prevLng, $trail[$t]->point->lat, $trail[$t]->point->lng);

        $trail[$t]->dist = $distance;
        $trail[$t]->point->ele = (new Elevation)->getElevation($trail[$t]->point->lat, $trail[$t]->point->lng);

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
        $anchor->ele = (new Elevation)->getElevation($anchor->lat, $anchor->lng);

        $prevAnchor = $anchor;
    }
}

function getHikeFolder ($userHikeId)
{
    return base_path("data/" . $userHikeId . "/");
}

