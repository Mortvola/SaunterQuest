<?php

namespace App;


class Trail
{
    public $name;
    public $type;
    public $cn;
    public $paths;

    public static function fromJSON ($jsonString)
    {
        $input = json_decode($jsonString);

        $trail = new Trail;

        $trail->type = $input->type;
        $trail->cn = $input->cn;

        if (isset ($input->name))
        {
            $trail->name = $input->name;
        }

        if (isset($input->routes))
        {
            $trail->paths = $input->routes;
        }
        else
        {
            $trail->paths = $input->paths;
        }

        for ($i = 0; $i < count($trail->paths); $i++)
        {
            $path = $trail->paths[$i];

            if (isset ($path->route))
            {
                $path->points = $path->route;
                unset($path->route);
            }

            if (isset($path->feature))
            {
                unset($path->feature);
            }

            if (isset($path->from))
            {
                $path->from = Trail::updateFileConnection ($path->from);
            }

            if (isset ($path->to))
            {
                $path->to = Trail::updateFileConnection ($path->to);
            }
        }

        return $trail;
    }

    private static function updateFileConnection ($connection)
    {
        if (!preg_match('/[NS]\d{3,4}[EW]\d{3,4}:\d+/', $connection))
        {
            if (preg_match ('/.*([NS]\d{3,4}[EW]\d{3,4}).*:(\d+)/', $connection, $matches))
            {
                if ($matches[1] && $matches[2])
                {
                    $connection = $matches[1] . ':' . $matches[2];
                }
                else
                {
                    error_log ("Invalid from property");
                }
            }
            else
            {
                error_log ("Invalid from property");
            }
        }

        return $connection;
    }


    public function combinePaths ()
    {
        $mergeCount = 0;

        for ($i = 0; $i < count($this->paths);)
        {
            $path1 = $this->paths[$i];
            $points1 = $path1->points;

            unset($overallMin);
            for ($j = $i + 1; $j < count($this->paths); $j++)
            {
                $path2 = $this->paths[$j];

                if ((isset($path1->from) && isset($path2->from)) || (isset($path1->to) && isset($path2->to)))
                {
                    continue;
                }

                $points2 = $path2->points;

                $result = pointsEndpointConnectivity($points1, $points2);

                if (!isset($overallMin)) {
                    $overallMin = $result->distance;
                    $bestPath2 = $j;
                    $bestResult = $result;
                } else if ($result->distance < $overallMin) {
                    $overallMin = $result->distance;
                    $bestPath2 = $j;
                    $bestResult = $result;
                }
            }

            if (isset($overallMin) && $overallMin <= 33)
            {
                if ($bestResult->first == 0)
                {
                    if ($bestResult->reverse)
                    {
                        $this->paths[$i]->points = array_merge ($points1, array_reverse($this->paths[$bestPath2]->points));
                    }
                    else
                    {
                        $this->paths[$i]->points = array_merge ($points1, $this->paths[$bestPath2]->points);
                    }
                }
                else
                {
                    if ($bestResult->reverse)
                    {
                        $this->paths[$i]->points = array_merge (array_reverse($this->paths[$bestPath2]->points), $points1);
                    }
                    else
                    {
                        $this->paths[$i]->points = array_merge ($this->paths[$bestPath2]->points, $points1);
                    }
                }

                // Move any file connection information to the path from the other path
                if (isset($this->paths[$bestPath2]->from))
                {
                    var_dump ($this->paths[$bestPath2]);

                    if (isset ($this->paths[$i]->from))
                    {
                        error_log ("Path merging into already has 'from' information (cn: " . $this->cn . ", dst pathIndex: " . $i . ", src pathIndex: " . $bestPath2);
                    }

                    $this->paths[$i]->from = $this->paths[$bestPath2]->from;
                }

                if (isset($this->paths[$bestPath2]->to))
                {
                    if (isset ($this->paths[$i]->to))
                    {
                        error_log ("Path merging into already has 'to' information (cn: " . $this->cn . ", dst pathIndex: " . $i . ", src pathIndex: " . $bestPath2);
                    }

                    $this->paths[$i]->to = $this->paths[$bestPath2]->to;
                }

                // Remove the entry that was merged into the first
                array_splice ($this->paths, $bestPath2, 1);

                $mergeCount++;

                // Since we merged then we need to compare the newly merged
                // points against all the other paths so don't increment
                // the index.
            }
            else
            {
                //todo: if the current path had merges then we need to recalculate the
                // bounds.
                $this->paths[$i]->bounds = $this->getBounds ($this->paths[$i]->points);

                // Nothing to see here, so move on to the next path.
                $i++;
            }
        }

        return $mergeCount;
    }

    public function mergeTrail ($trail)
    {
        foreach ($trail->paths as $path)
        {
            $this->paths[] = $path;
        }
    }

    public function setBounds ()
    {
        // Update bounds information for each path.
        foreach ($this->paths as $path)
        {
            $bounds = $this->getBounds ($path->points);

            if ($path->bounds != $bounds)
            {
                $path->bounds = $bounds;
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
        $result->interFileFromConnections = 0;
        $result->interFileToConnections = 0;

        // Determine bounds for each path and check to current bounds property.
        // If they are different, record an error.
        for ($p1 = 0; $p1 < count($this->paths); $p1++)
        {
            $path = $this->paths[$p1];

            $bounds = $this->getBounds ($path->points);

            if ($path->bounds != $bounds)
            {
                $result->boundsErrorCount++;
            }

            if (isset($path->from))
            {
                $result->interFileFromConnections++;
            }

            if (isset($path->to))
            {
                $result->interFileToConnections++;
            }

            // Determine longest distance between points in path.
            $points = $path->points;
            for ($i = 0; $i < count ($path->points) - 1; $i++)
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
            for ($i = 0; $i < count($path->points); $i++)
            {
                // Check point duplication within the path
                for ($j = $i + 1; $j < count($path->points); $j++)
                {
                    if ($path->points[$i]->lat == $path->points[$j]->lat
                        && $path->points[$i]->lng == $path->points[$j]->lng)
                    {
                        $result->intraPathDuplicatePoints++;
                    }
                }

                // Check for point duplication amongst the other paths
                for ($p2 = $p1 + 1; $p2 < count($this->paths); $p2++)
                {
                    $path2 = $this->paths[$p2];

                    for ($j = 0; $j < count($path2->points); $j++)
                    {
                        if ($path->points[$i]->lat == $path2->points[$j]->lat
                            && $path->points[$i]->lng == $path2->points[$j]->lng)
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
        foreach ($this->paths as $path)
        {
            for ($i = 0; $i < count($path->points); $i++)
            {
                for ($j = $i + 1; $j < count($path->points);)
                {
                    if ($path->points[$i]->lat == $path->points[$j]->lat
                        && $path->points[$i]->lng == $path->points[$j]->lng)
                    {
                        array_splice($path->points, $j, 1);
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

        for ($i = 0; $i < count($this->paths); $i++) {
            if (!isset($this->paths[$i]->bounds) || withinBounds($point, $this->paths[$i]->bounds, 0.00027027)) {
                $result = $this->nearestPointOnPoints($point, $this->paths[$i]->points);

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

    private function nearestPointOnPoints ($point, $points)
    {
        for ($s = 0; $s < count($points) - 1; $s++) {
            $p = nearestPointOnSegment(
                    (object)["x" => $point->lat, "y" => $point->lng],
                (object)["x" => $points[$s]->lat, "y" => $points[$s]->lng],
                (object)["x" => $points[$s + 1]->lat, "y" => $points[$s + 1]->lng]
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

    private function getBounds ($points)
    {
        foreach ($points as $r) {
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
