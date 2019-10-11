<?php

function haversineGreatCircleDistance(
    $latitudeFrom,
    $longitudeFrom,
    $latitudeTo,
    $longitudeTo,
    $earthRadius = 6378137
) {
    // convert from degrees to radians
    $latFrom = deg2rad($latitudeFrom);
    $lonFrom = deg2rad($longitudeFrom);
    $latTo = deg2rad($latitudeTo);
    $lonTo = deg2rad($longitudeTo);

    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;

    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    return $angle * $earthRadius;
}

function nearestSegmentFind($lat, $lng, $segments)
{
    $closestIndex = -1;

    if (count($segments) > 1)
    {
        $k = 0;

        $closestDistance = haversineGreatCircleDistance($lat, $lng, $segments[$k]->point->lat, $segments[$k]->point->lng);
        $closestIndex = $k;

        for ($k++; $k < count($segments) - 1; $k++)
        {
            $d = haversineGreatCircleDistance($lat, $lng, $segments[$k]->point->lat, $segments[$k]->point->lng);

            if ($d < $closestDistance)
            {
                $closestDistance = $d;
                $closestIndex = $k;
            }
        }
    }

    return [$closestIndex, $closestDistance];
}


function distSquared($v, $w)
{
    return pow($v->x - $w->x, 2) + pow($v->y - $w->y, 2);
}


function percentageOfPointOnSegment($p, $v, $w)
{
    // Check to see if the line segment is really just a point. If so, return the distance between
    // the point and one of the points of the line segment.
    $l2 = distSquared($v, $w);
    if ($l2 == 0) {
        return 0;
    }

    $t = (($p->x - $v->x) * ($w->x - $v->x) + ($p->y - $v->y) * ($w->y - $v->y)) / $l2;
    $t = max(0, min(1, $t));

    return $t;
}


function nearestPointOnSegment($p, $v, $w)
{
    // Check to see if the line segment is really just a point. If so, return the distance between
    // the point and one of the points of the line segment.
    $l2 = distSquared($v, $w);
    if ($l2 == 0) {
        return $v;
    }

    $t = (($p->x - $v->x) * ($w->x - $v->x) + ($p->y - $v->y) * ($w->y - $v->y)) / $l2;
    $t = max(0, min(1, $t));

    $point = (object)["x" => $v->x + $t * ($w->x - $v->x), "y" => $v->y + $t * ($w->y - $v->y)];

    return $point;
}

function distToSegmentSquared($p, $v, $w)
{
    $l = nearestPointOnSegment($p, $v, $w);

    return distSquared($p, $l);
}


function pointOnPath($point, $segments, $tolerance)
{
    if (!isset($segments))
    {
        error_log ("Segments not set");
        return;
    }

    if (!is_array($segments))
    {
        error_log ("Segments is not an array");
        var_dump ($segments);
        return;
    }
    //
    // There has to be at least two points in the array. Otherwise, we wouldn't have any edges.
    //
    if (count($segments) > 1) {
        for ($s = 0; $s < count($segments) - 1; $s++) {
            $p = nearestPointOnSegment(
                (object)["x" => $point->lat, "y" => $point->lng],
                (object)["x" => $segments[$s]->lat, "y" => $segments[$s]->lng],
                (object)["x" => $segments[$s + 1]->lat, "y" => $segments[$s + 1]->lng]
            );

            $d = distSquared((object)["x" => $point->lat, "y" => $point->lng], $p);

            if ($s == 0 || $d < $shortestDistance) {
                $shortestDistance = $d;
                $closestEdge = $s;
                $closestPoint = (object)["lat" => $p->x, "lng" => $p->y];
            }
        }

        $shortestDistance = haversineGreatCircleDistance($point->lat, $point->lng, $closestPoint->lat, $closestPoint->lng);
        //$shortestDistance = haversineGreatCircleDistance (40.159708252, -111.24445577, 40.158448612326, -111.22906855015);

//      echo $shortestDistance, " lat: ", $closestPoint->x, " lng: ", $closestPoint->y, "\n";
//      echo "lat: $lat, lng: $lng\n";

        if ($shortestDistance <= $tolerance) {
            $result = (object)[];

            $result->pointIndex = $closestEdge;
            $result->point = $closestPoint;
            $result->distance = $shortestDistance;
        }
    }

    if (isset($result)) {
        return $result;
    }
}


function withinBounds($point, $bounds, $inflation)
{
    if (count($bounds) >= 4) {
        return $point->lat >= $bounds[0] - $inflation
        && $point->lng >= $bounds[1] - $inflation
        && $point->lat <= $bounds[2] + $inflation
        && $point->lng <= $bounds[3] + $inflation;
    } else {
        return true;
    }
}


function boundsIntersect($b1, $b2, $inflation)
{
    return ($b1[0] - $inflation <= $b2[2] + $inflation
            && $b1[2] + $inflation >= $b2[0] - $inflation
            && $b1[1] - $inflation <= $b2[3] + $inflation
            && $b1[3] + $inflation >= $b2[1] - $inflation);
}

function pointsEndpointConnectivity ($r1, $r2)
{
    $distance = haversineGreatCircleDistance(
            $r1[count($r1) - 1]->lat,
            $r1[count($r1) - 1]->lng,
            $r2[0]->lat,
            $r2[0]->lng
            );

    $result = (object)["first" => 0, "reverse" => false, "distance" => $distance];


    $distance = haversineGreatCircleDistance(
            $r1[0]->lat,
            $r1[0]->lng,
            $r2[count($r2) - 1]->lat,
            $r2[count($r2) - 1]->lng
            );

    if ($distance < $result->distance)
    {
        $result = (object)["first" => 1, "reverse" => false, "distance" => $distance];
    }

    $distance = haversineGreatCircleDistance(
            $r1[count($r1) - 1]->lat,
            $r1[count($r1) - 1]->lng,
            $r2[count($r2) - 1]->lat,
            $r2[count($r2) - 1]->lng
            );

    if ($distance < $result->distance)
    {
        $result = (object)["first" => 0, "reverse" => true, "distance" => $distance];
    }

    $distance = haversineGreatCircleDistance(
            $r1[0]->lat,
            $r1[0]->lng,
            $r2[0]->lat,
            $r2[0]->lng
            );

    if ($distance < $result->distance)
    {
        $result = (object)["first" => 1, "reverse" => true, "distance" => $distance];
    }

    return $result;
}
