<?php
namespace App;
require_once app_path('routeFile.php');
require_once app_path('routeFind.php');

class Route
{
    private $hikeId;
    private $anchors;
    private $segments;

    public function __construct ($hikeId)
    {
        $this->hikeId = $hikeId;
    }

    public function get ()
    {
        if (!isset($this->segments))
        {
            $this->load ();
        }

        return $this->segments;
    }

    public function getDistance ()
    {
        if (!isset($this->segments))
        {
            $this->load ();
        }

        if (count($this->segments) > 0)
        {
            return $this->segments[count($this->segments) - 1]->dist;
        }

        return 0;
    }

    public function load ()
    {
        $this->loadAnchors ();
        $this->segments = getRouteFromFile($this->anchors);

        if ($this->segments == null)
        {
            $this->segments = [ ];
        }
    }

    public function setStart ($point)
    {
        if (!isset($this->anchors))
        {
            $this->loadAnchors();
        }

        if (count($this->anchors) == 0)
        {
            array_push($this->anchors,
                (object)[
                    "point" => $point,
                    "dist" => 0,
                    "ele" => getElevation($point->lat, $point->lng),
                    "type" => "start"
                ]);
        }
        else
        {
            // Find "start" and "end"
            for ($i = 0; $i < count($this->anchors); $i++)
            {
                if (isset($this->anchors[$i]->type))
                {
                    if ($this->anchors[$i]->type == "end")
                    {
                        $endIndex = $i;
                    }
                    elseif ($this->anchors[$i]->type == "start")
                    {
                        $startIndex = $i;
                    }
                }
            }

            if (isset($startIndex))
            {
                // Start exists, update it.

                $this->anchors[$startIndex]->point = $point;
                $this->anchors[$startIndex]->dist = 0;
                $this->anchors[$startIndex]->ele = getElevation($point->lat, $point->lng);
            }
            else
            {
                // Start doesn't exist, add it

                array_splice($this->anchors, 0, 0,
                    array((object)[
                        "point" => $point,
                        "dist" => 0,
                        "ele" => getElevation($point->lat, $point->lng),
                        "type" => "start"
                    ]));

                $startIndex = 0;
                $endIndex = count($this->anchors) - 1;
            }

            if (isset($startIndex) && isset($endIndex))
            {
                $newSegments = findPath($this->anchors[$startIndex]->point, $this->anchors[$endIndex]->point);

                if (isset($newSegments) && count($newSegments) > 0)
                {
                    $this->anchors = $newSegments;
                }
            }
        }
    }

    public function setEnd ($point)
    {
        if (!isset($this->anchors))
        {
            $this->load();
        }

        if (count($this->anchors) == 0)
        {
            array_push($this->anchors,
                (object)[
                    "point" => $point,
                    "dist" => 0,
                    "ele" => getElevation($point->lat, $point->lng),
                    "type" => "end"
                ]);
        }
        else
        {
            // Find "start" and "end"
            for ($i = 0; $i < count($this->anchors); $i++)
            {
                if (isset($this->anchors[$i]->type))
                {
                    if ($this->anchors[$i]->type == "end")
                    {
                        $endIndex = $i;

                        break;
                    }
                    elseif ($this->anchors[$i]->type == "start")
                    {
                        $startIndex = $i;
                    }
                }
            }

            if (isset($endIndex))
            {
                // End exists, update it.

                $this->anchors[$endIndex]->point = $point;
                $this->anchors[$endIndex]->dist = 0;
                $this->anchors[$endIndex]->ele = getElevation($point->lat, $point->lng);
            }
            else
            {
                // End doesn't exist, add it

                array_push($this->anchors,
                    (object)[
                        "point" => $point,
                        "dist" => 0,
                        "ele" => getElevation($point->lat, $point->lng),
                        "type" => "end"
                    ]);

                $endIndex = count($this->anchors) - 1;
            }

            if (isset($startIndex) && isset($endIndex))
            {
                $newSegments = findPath($this->anchors[$startIndex]->point, $this->anchors[$endIndex]->point);

                if (isset($newSegments) && count($newSegments) > 0)
                {
                    $this->anchors = $newSegments;
                }
            }
        }
    }


    public function addWaypoint ($point)
    {
        if (!isset($this->anchors))
        {
            $this->loadAnchors();
        }

        $anchors = [];

        foreach ($this->anchors as $anchor)
        {
            if (isset($anchor->type) && in_array($anchor->type, ['start', 'waypoint', 'end']))
            {
                $anchors[] = $anchor;
            }
        }

        $newAnchor = (object)[
                "point" => $point,
                "dist" => 0,
                "ele" => getElevation($point->lat, $point->lng),
                "type" => "waypoint"
            ];

        array_splice ($anchors, 1, 0, array($newAnchor));

        $this->getRouteFromAnchors ($anchors);
    }

    public function updateWaypoint ($waypointId, $point)
    {
        if (!isset($this->anchors))
        {
            $this->loadAnchors();
        }

        $anchors = [];

        foreach ($this->anchors as $anchor)
        {
            if (isset($anchor->type) &&
                in_array($anchor->type, ['start', 'waypoint', 'end']))
            {
                if (isset($anchor->id) && $anchor->id == $waypointId)
                {
                    $anchor->point = $point;
                }

                $anchors[] = $anchor;
            }
        }

        $this->getRouteFromAnchors ($anchors);
    }

    public function deleteWaypoint ($waypointId)
    {
        if (!isset($this->anchors))
        {
            $this->loadAnchors();
        }

        $anchors = [];

        foreach ($this->anchors as $anchor)
        {
            if (isset($anchor->type) &&
                in_array($anchor->type, ['start', 'waypoint', 'end']) &&
                (!isset($anchor->id) || $anchor->id != $waypointId))
            {
                $anchors[] = $anchor;
            }
        }

        $this->getRouteFromAnchors ($anchors);
    }

    public function setWaypointOrder ($order)
    {
        if (!isset($this->anchors))
        {
            $this->loadAnchors();
        }

        $anchors = [];

        foreach ($this->anchors as $anchor)
        {
            if (isset($anchor->type))
            {
                if ($anchor->type == 'start')
                {
                    $anchor->sortKey = -1;
                }
                elseif ($anchor->type == 'waypoint')
                {
                    $anchor->sortKey = array_search ($anchor->id, $order);
                }
                else if ($anchor->type == 'end')
                {
                    $anchor->sortKey = PHP_INT_MAX;
                }

                $anchors[] = $anchor;
            }
        }

        usort($anchors, function ($a, $b)
        {
            return $a->sortKey - $b->sortKey;
        });

        $this->getRouteFromAnchors ($anchors);
    }

    public function getRouteFromAnchors ($anchors)
    {
        if (count($anchors) >= 2)
        {
            $finalAnchors = [];
            $wayPointId = 0;

            for ($i = 0; $i < count($anchors) - 1; $i++)
            {
                $newAnchors = findPath($anchors[$i]->point, $anchors[$i + 1]->point);

                error_log("New Anchors: " . json_encode($newAnchors));

                if (count($finalAnchors) == 0)
                {
                    array_splice ($finalAnchors, 0, 0, $newAnchors);
                }
                else
                {
                    $newAnchors[0]->type = "waypoint";
                    if (isset($anchors[$i]->id))
                    {
                        $newAnchors[0]->id = $anchors[$i]->id;
                    }
                    else
                    {
                        $newAnchors[0]->id = $wayPointId++;
                    }

                    $newAnchors[0]->prev = $finalAnchors[count($finalAnchors) - 1]->prev;
                    array_splice ($finalAnchors, count($finalAnchors) - 1, 1, $newAnchors);
                }
            }

            $this->anchors = $finalAnchors;

            error_log('Final Anchors: ' . json_encode($this->anchors));
        }
    }

    public function findRoute ($dumpGraph = false)
    {
        if (!isset($this->anchors))
        {
            $this->loadAnchors();
        }

        $anchors = [];

        foreach ($this->anchors as $anchor)
        {
            if (isset($anchor->type) &&
                in_array($anchor->type, ['start', 'waypoint', 'end']))
            {
                $anchors[] = $anchor;
            }
        }

        $this->getRouteFromAnchors ($anchors);
    }

    public function save ()
    {
        $folder = getHikeFolder ($this->hikeId);

        if (!file_exists($folder))
        {
            mkdir($folder);
        }

        // Write the data to the file.
        $fileName = $this->getRouteFileName($this->hikeId);
        file_put_contents($fileName, json_encode($this->anchors));
    }

    public function loadAnchors ()
    {
        $fileName = $this->getRouteFileName($this->hikeId);

        $this->anchors = [ ];

        if (file_exists($fileName))
        {
            $this->anchors = json_decode(file_get_contents($fileName));

            if ($this->anchors == null)
            {
                $this->anchors = [ ];
            }
            else
            {
                // Ensure the array is not an object and is indexed numerically
                if (!is_array($this->anchors))
                {
                    $objectVars = get_object_vars($this->anchors);

                    if ($this->anchors)
                    {
                        $this->anchors = array_values($objectVars);
                    }
                }
            }
        }
    }

    private function getRouteFileName ($hikeId)
    {
        return getHikeFolder($hikeId) . "route.json";
    }



}
