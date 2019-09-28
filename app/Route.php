<?php
namespace App;
require_once app_path('routeFile.php');
require_once app_path('routeFind.php');

class Route
{
    private $hikeId;

    private $segments;

    public function __construct ($hikeId)
    {
        $this->hikeId = $hikeId;
    }

    public static function get ($userHikeId)
    {
        $fileName = getRouteFileName($userHikeId);
        $segments = getRouteFromFile($fileName);

        if ($segments == null)
        {
            $segments = [ ];
        }

        return json_encode($segments);
    }

    public function load ()
    {
        $fileName = getRouteFileName($this->hikeId);
        $this->segments = getRouteFromFile($fileName);

        if ($this->segments == null)
        {
            $this->segments = [ ];
        }
    }

    public function setStart ($point)
    {
        if (!isset($segments))
        {
            $this->load();
        }

        if (count($this->segments) == 0)
        {
            array_push($this->segments,
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
            for ($i = 0; $i < count($this->segments); $i++)
            {
                if (isset($this->segments[$i]->type))
                {
                    if ($this->segments[$i]->type == "end")
                    {
                        $endIndex = $i;
                    }
                    elseif ($this->segments[$i]->type == "start")
                    {
                        $startIndex = $i;
                    }
                }
            }

            if (isset($startIndex))
            {
                // Start exists, update it.

                $this->segments[$startIndex]->point = $point;
                $this->segments[$startIndex]->dist = 0;
                $this->segments[$startIndex]->ele = getElevation($point->lat, $point->lng);
            }
            else
            {
                // Start doesn't exist, add it

                array_splice($this->segments, 0, 0,
                    (object)[
                        "point" => $point,
                        "dist" => 0,
                        "ele" => getElevation($point->lat, $point->lng),
                        "type" => "start"
                    ]);

                $startIndex = 0;
                $endIndex = count($this->segments) - 1;
            }

            if (isset($startIndex) && isset($endIndex))
            {
                $newSegments = findPath($this->segments[$startIndex]->point, $this->segments[$endIndex]->point);

                if (isset($newSegments) && count($newSegments) > 0)
                {
                    $this->segments = $newSegments;
                }
            }
        }
    }

    public function setEnd ($point)
    {
        if (!isset($segments))
        {
            $this->load();
        }

        if (count($this->segments) == 0)
        {
            array_push($this->segments,
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
            for ($i = 0; $i < count($this->segments); $i++)
            {
                if (isset($this->segments[$i]->type))
                {
                    if ($this->segments[$i]->type == "end")
                    {
                        $endIndex = $i;

                        break;
                    }
                    elseif ($this->segments[$i]->type == "start")
                    {
                        $startIndex = $i;
                    }
                }
            }

            if (isset($endIndex))
            {
                // End exists, update it.

                $this->segments[$endIndex]->point = $point;
                $this->segments[$endIndex]->dist = 0;
                $this->segments[$endIndex]->ele = getElevation($point->lat, $point->lng);
            }
            else
            {
                // End doesn't exist, add it

                array_push($this->segments,
                    (object)[
                        "point" => $point,
                        "dist" => 0,
                        "ele" => getElevation($point->lat, $point->lng),
                        "type" => "end"
                    ]);

                $endIndex = count($this->segments) - 1;
            }

            if (isset($startIndex) && isset($endIndex))
            {
                $newSegments = findPath($this->segments[$startIndex]->point, $this->segments[$endIndex]->point);

                if (isset($newSegments) && count($newSegments) > 0)
                {
                    $this->segments = $newSegments;
                }
            }
        }
    }

    public function findRoute ($dumpGraph = false)
    {
        if (!isset($segments))
        {
            $this->load();
        }

        $newSegments = findPath($this->segments[0]->point, $this->segments[count($this->segments) - 1]->point, $dumpGraph);

        if (isset($newSegments) && count($newSegments) > 0)
        {
            $this->segments = $newSegments;
        }
    }

    public function save ()
    {
        $folder = getHikeFolder ($this->hikeId);

        if (!file_exists($folder))
        {
            mkdir($folder);
        }

        // Write the data to the file.
        $fileName = getRouteFileName($this->hikeId);
        file_put_contents($fileName, json_encode($this->segments));
    }
}
