<?php

namespace App;


class Trail
{
    public $name;
    public $type;
    public $cn;
    public $routes;

    public static function fromJSON ($jsonString)
    {
        $input = json_decode($jsonString);

        $trail = new Trail;

        $trail->type = $input->type;
        $trail->cn = $input->cn;
        $trail->routes = $input->routes;

        if (isset ($input->name))
        {
            $trail->name = $input->name;
        }

        return $trail;
    }

    public function combineRoutes ()
    {
        $mergeCount = 0;

        for ($i = 0; $i < count($this->routes);) {
            $route1 = $this->routes[$i]->route;

            unset($overallMin);
            for ($j = $i + 1; $j < count($this->routes); $j++) {

                $route2 = $this->routes[$j]->route;

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

            if (isset($overallMin) && $overallMin <= 33)
            {
                echo "Combining $i and " . $bestRoute2 . "\n";

                if ($bestResult->first == 0)
                {
                    if ($bestResult->reverse)
                    {
                        $this->routes[$i]->route = array_merge ($route1, array_reverse($this->routes[$bestRoute2]->route));
                    }
                    else
                    {
                        $this->routes[$i]->route = array_merge ($route1, $this->routes[$bestRoute2]->route);
                    }
                }
                else
                {
                    if ($bestResult->reverse)
                    {
                        $this->routes[$i]->route = array_merge (array_reverse($this->routes[$bestRoute2]->route), $route1);
                    }
                    else
                    {
                        $this->routes[$i]->route = array_merge ($this->routes[$bestRoute2]->route, $route1);
                    }
                }

                // Remove the entry that was merged into the first
                array_splice ($this->routes, $bestRoute2, 1);

                $mergeCount++;

                // Since we merged then we need to compare the newly merged
                // route against all the other routes so don't increment
                // the index.
            }
            else
            {
                //todo: if the current route had merges then we need to recalculate the
                // bounds.
                $this->routes[$i]->bounds = $this->getBounds ($this->routes[$i]->route);

                // Nothing to see here, so move on to the next route.
                $i++;
            }
        }

        return $mergeCount;
    }

    public function setBounds ()
    {
        // Update bounds information for each route.
        foreach ($this->routes as $route)
        {
            $bounds = $this->getBounds ($route->route);

            if ($route->bounds != $bounds)
            {
                $route->bounds = $bounds;
            }
        }
    }

    public function analyze ()
    {
        $result = (object)[];

        $result->boundsErrorCount = 0;
        $result->distanceCounts = [];

        $result->intraPathDuplicatePoints = 0;
        $result->intraTrailInterPathDuplicatePoints = 0;

        // Determine bounds for each route and check to current bounds property.
        // If they are different, record an error.
        for ($p1 = 0; $p1 < count($this->routes); $p1++)
        {
            $path = $this->routes[$p1];

            $bounds = $this->getBounds ($path->route);

            if ($path->bounds != $bounds)
            {
                $result->boundsErrorCount++;
            }

            // Determine longest distance between points in route.
            $points = $path->route;
            for ($i = 0; $i < count ($path->route) - 1; $i++)
            {
                $distance = haversineGreatCircleDistance($points[$i]->lat, $points[$i]->lng, $points[$i + 1]->lat, $points[$i + 1]->lng);

                $bucket = intval($distance / 30) * 30;

                if (!isset ($result->distanceCounts[$bucket]))
                {
                    $result->distanceCounts[$bucket] = 1;
                }
                else
                {
                    $result->distanceCounts[$bucket]++;
                }

                if (!isset ($longestDistance) || $distance > $longestDistance)
                {
                    $longestDistance = $distance;
                }
            }

            // Check for point duplication
            for ($i = 0; $i < count($path->route); $i++)
            {
                // Check point duplication within the path
                for ($j = $i + 1; $j < count($path->route); $j++)
                {
                    if ($path->route[$i]->lat == $path->route[$j]->lat
                        && $path->route[$i]->lng == $path->route[$j]->lng)
                    {
                        $result->intraPathDuplicatePoints++;
                    }
                }

                // Check for point duplication amongst the other paths
                for ($p2 = $p1 + 1; $p2 < count($this->routes); $p2++)
                {
                    $path2 = $this->routes[$p2];

                    for ($j = 0; $j < count($path2->route); $j++)
                    {
                        if ($path->route[$i]->lat == $path2->route[$j]->lat
                            && $path->route[$i]->lng == $path2->route[$j]->lng)
                        {
                            $result->intraTrailInterPathDuplicatePoints++;
                        }
                    }
                }
            }
        }

        if (isset ($longestDistance))
        {
            $result->longestDistance = $longestDistance;
        }

        return $result;
    }

    public function removePathPointDuplicates ()
    {
        foreach ($this->routes as $route)
        {
            for ($i = 0; $i < count($route->route); $i++)
            {
                for ($j = $i + 1; $j < count($route->route);)
                {
                    if ($route->route[$i]->lat == $route->route[$j]->lat
                        && $route->route[$i]->lng == $route->route[$j]->lng)
                    {
                        array_splice($route->route, $j, 1);
                    }
                    else
                    {
                        $j++;
                    }
                }
            }
        }
    }

    public function pathFromPoint ($point, $tolerance)
    {
        $first = true;

        for ($i = 0; $i < count($this->routes); $i++) {
            if (!isset($this->routes[$i]->bounds) || withinBounds($point, $this->routes[$i]->bounds, 0.00027027)) {
                $result = $this->nearestPointOnRoute($point, $this->routes[$i]->route);

                if (($result->distance <= $tolerance) && ($first || $result->distance < $shortestDistance)) {
                    $first = false;

                    $pathIndex = $i;
                    $shortestDistance = $result->distance;
                    $pointIndex = $result->index;
                    $pathPoint = $result->point;
                }
            }
        }

        if (isset($pathIndex))
        {
            $result = (object)[
                "pathIndex" => $pathIndex,
                "pointIndex" => $pointIndex,
                "point" => $pathPoint,
                "distance" => $shortestDistance
            ];

            return $result;
        }
    }

    private function nearestPointOnRoute ($point, $route)
    {
        for ($s = 0; $s < count($route) - 1; $s++) {
            $p = nearestPointOnSegment(
                    (object)["x" => $point->lat, "y" => $point->lng],
                    (object)["x" => $route[$s]->lat, "y" => $route[$s]->lng],
                    (object)["x" => $route[$s + 1]->lat, "y" => $route[$s + 1]->lng]
                    );

            $d = distSquared((object)["x" => $point->lat, "y" => $point->lng], $p);

            if ($s == 0 || $d < $shortestDistance) {
                $shortestDistance = $d;
                $closestEdge = $s;
                $closestPoint = (object)["lat" => $p->x, "lng" => $p->y];
            }
        }

        $result = (object)[];

        $result->index = $closestEdge;
        $result->point = $closestPoint;
        $result->distance = haversineGreatCircleDistance($point->lat, $point->lng, $closestPoint->lat, $closestPoint->lng);

        return $result;
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
}
