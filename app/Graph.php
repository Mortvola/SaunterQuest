<?php
namespace App;
require_once app_path("utilities.php");

class Graph
{

    private $name;

    private $graph;

    private $connectors;

    private static $addConnectors = true;

    private const MAX_CONNECTOR_LENGTH = 60;

    public function __construct ($name)
    {
        $this->name = $name;
    }

    public function generate ($trails)
    {
        $allIntersections = [ ];
        $this->connectors = (object)[
            "type" => "connector",
            "cn" => "connector",
            "routes" => [ ]
        ];

        Graph::findIntersections($trails, $allIntersections, $this->connectors);

        Graph::consolidateNodes($allIntersections);

        $edges = Graph::findEdges($allIntersections);

        Graph::assignEdgeCosts($allIntersections, $edges, $trails);

        $this->graph = (object)[ ];
        $this->graph->nodes = array_values($allIntersections);
        $this->graph->edges = $edges;
    }

    public function getFileName ()
    {
        return $this->name . Graph::getExtension();
    }

    public function getFullPath ()
    {
        return Tile::getFolder() . $this->getFileName();
    }

    public static function getExtension ()
    {
        return ".inter.json";
    }

    public static function getFolder ()
    {
        return base_path("trails/");
    }

    public function save ()
    {
        $handle = fopen($this->getFullPath(), "wb");

        if ($handle)
        {
            fwrite($handle, json_encode($this->graph));
            fclose($handle);
        }

        if (count($this->connectors->routes) > 0)
        {
            $handle = fopen(Tile::getFolder() . $this->name . ".connectors.json", "wb");

            if ($handle)
            {
                fwrite($handle, json_encode($this->connectors));
                fclose($handle);
            }
        }
    }

    private static function findInterFileIntersections ($trail, $pathIndex)
    {
        $intersections = [ ];

        $path = $trail->routes[$pathIndex];

        //
        // Add the nodes at the start and end of this path
        // that go to another file, if any.
        //
        if (isset($path->route[0]->from))
        {
            $intersection = (object)[
                "lat" => $path->route[0]->lat,
                "lng" => $path->route[0]->lng,
                "route" => [
                    (object)[
                        "type" => $trail->type,
                        "cn" => $trail->cn,
                        "pathIndex" => $j,
                        "pointIndex" => 0,
                        "pointIndexMax" => count($path->route) - 1
                    ],
                    (object)[
                        "file" => $path->route[0]->from
                    ]
                ]
            ];

            $intersections[] = $intersection;
        }

        if (isset($path->route[count($path->route) - 1]->to))
        {
            $intersection = (object)[
                "lat" => $path->route[count($path->route) - 1]->lat,
                "lng" => $path->route[count($path->route) - 1]->lng,
                "route" => [
                    (object)[
                        "type" => $trail->type,
                        "cn" => $trail->cn,
                        "pathIndex" => $j,
                        "pointIndex" => count($path->route) - 1,
                        "pointIndexMax" => count($path->route) - 1
                    ],
                    (object)[
                        "file" => $path->route[count($path->route) - 1]->to
                    ]
                ]
            ];

            $intersections[] = $intersection;
        }

        return $intersections;
    }

    private static function findIntersections ($trails, &$allIntersections, $connectors)
    {
        $trails = array_values($trails);

        for ($i = 0; $i < count($trails); $i++)
        {
            $trail = $trails[$i];

            echo "processing trail ", $i, "\n";

            for ($j = 0; $j < count($trail->routes); $j++)
            {

                $intersections = Graph::findInterFileIntersections($trail, $j);
                $duplicates = Graph::addIntersections($intersections, $allIntersections);

                if ($duplicates)
                {
                    error_log("Duplicate intersection found when processing " . $trail->cn . " and adding inter-file intersections");
                }

                $intersections = Graph::findPathIntersections($trail, $j, $trail, $j + 1, $connectors);
                $duplicates = Graph::addIntersections($intersections, $allIntersections);

                if ($duplicates)
                {
                    error_log("Duplicate intersection found when processing " . $trail->cn . " against itself");
                }

                for ($k = $i + 1; $k < count($trails); $k++)
                {
                    $otherTrail = $trails[$k];

                    if ($otherTrail->type != "connector")
                    {
                        // error_log("count of other trail routes: ".
                        // count($otherTrail->routes));

                        $intersections = Graph::findPathIntersections($trail, $j, $otherTrail, 0, $connectors);
                        $duplicates = Graph::addIntersections($intersections, $allIntersections);

                        if ($duplicates)
                        {
                            error_log("Duplicate intersection found when processing " . $trail->cn . " against " . $otherTrail->cn);
                        }
                    }
                }
            }
        }
    }

    // todo: could we use the lat/lng as the key to the array instead of
    // iterating through all of the nodes?
    private static function consolidateNodes (&$allIntersections)
    {
        $consolidationCount = 0;

        for ($i = 0; $i < count($allIntersections) - 1; $i++)
        {
            for ($j = $i + 1; $j < count($allIntersections);)
            {
                if ($allIntersections[$i]->lat == $allIntersections[$j]->lat && $allIntersections[$i]->lng == $allIntersections[$j]->lng)
                {
                    // Nodes are the same...
                    // Move the routes from the latter node to the earlier one

                    Graph::mergeIntersectionPaths ($allIntersections[$i], $allIntersections[$j]);

                    // Delete the node
                    array_splice($allIntersections, $j, 1);

                    $consolidationCount++;
                }
                else
                {
                    $j++;
                }
            }
        }

        error_log("Number of nodes consolidated: " . $consolidationCount);
    }

    private static function findEdges ($allIntersections)
    {
        $edges = [ ];

        for ($i = 0; $i < count($allIntersections); $i++)
        {
            $node1 = $allIntersections[$i];

            $debug = false;
            // foreach ($node1->routes as $route)
            // {
            // if ($route->cn == "440010391")
            // {
            // $debug = true;
            // break;
            // }
            // }

            if ($debug)
            {
                error_log("Node: " . json_encode($node1));
            }

            // For each of the paths connected to this node, look for nodes that
            // are connected to the same path.
            for ($k = 0; $k < count($node1->routes); $k++)
            {
                if (!isset($node1->routes[$k]->file))
                {
                    if (!isset($node1->routes[$k]->prevConnected) || !isset($node1->routes[$k]->nextConnected))
                    {
                        if ($debug)
                        {
                            error_log(
                                "search for other junction to match " . $node1->routes[$k]->cn . ", route " . $node1->routes[$k]->pathIndex . ", pointIndex " .
                                $node1->routes[$k]->pointIndex);
                        }

                        unset($foundPrevTerminus);
                        unset($foundNextTerminus);

                        for ($j = $i + 1; $j < count($allIntersections); $j++)
                        {
                            $node2 = $allIntersections[$j];

                            for ($l = 0; $l < count($node2->routes); $l++)
                            {
                                if (!isset($node2->routes[$l]->file) && $node1->routes[$k]->cn == $node2->routes[$l]->cn && $node1->routes[$k]->pathIndex ==
                                    $node2->routes[$l]->pathIndex)
                                {
                                    if (!isset($node1->routes[$k]->prevConnected) && $node1->routes[$k]->pointIndex > $node2->routes[$l]->pointIndex && (!isset(
                                        $foundPrevTerminus) || ($node2->routes[$l]->pointIndex > $foundPrevTerminus->pointIndex)))
                                    {
                                        $foundPrevTerminus = &$node2->routes[$l];
                                        $foundPrevNodeIndex = $j;
                                        $foundPrevRouteIndex = $node2->routes[$l]->pointIndex;
                                    }

                                    if (!isset($node1->routes[$k]->nextConnected) && $node1->routes[$k]->pointIndex < $node2->routes[$l]->pointIndex && (!isset(
                                        $foundNextTerminus) || ($node2->routes[$l]->pointIndex < $foundNextTerminus->pointIndex)))
                                    {
                                        $foundNextTerminus = &$node2->routes[$l];
                                        $foundNextNodeIndex = $j;
                                        $foundNextRouteIndex = $node2->routes[$l]->pointIndex;
                                    }
                                }
                            }
                        }

                        // Add the edge that precedes this node.

                        $edge = (object)[ ];

                        if (!isset($node1->routes[$k]->prevConnected))
                        {
                            $edge->type = $node1->routes[$k]->type;
                            $edge->cn = $node1->routes[$k]->cn;
                            $edge->pathIndex = $node1->routes[$k]->pathIndex;

                            $edge->next = (object)[ ];
                            $edge->next->nodeIndex = $i;
                            $edge->next->pointIndex = $node1->routes[$k]->pointIndex;

                            if (!isset($node1->edges))
                            {
                                $node1->edges = [ ];
                            }

                            $node1->routes[$k]->prevConnected = true;

                            $edge->prev = (object)[ ];

                            if (isset($foundPrevTerminus))
                            {
                                $edge->prev->nodeIndex = $foundPrevNodeIndex;
                                $edge->prev->pointIndex = $foundPrevRouteIndex;

                                if ($debug)
                                {
                                    error_log("Prev Edge: " . json_encode($edge));
                                }

                                array_push($edges, $edge);

                                array_push($node1->edges, count($edges) - 1);

                                if (!isset($allIntersections[$foundPrevNodeIndex]->edges))
                                {
                                    $allIntersections[$foundPrevNodeIndex]->edges = [ ];
                                }

                                array_push($allIntersections[$foundPrevNodeIndex]->edges, count($edges) - 1);

                                $foundPrevTerminus->nextConnected = true;

                                if ($debug)
                                {
                                    error_log("*** found 'prev' edge ***\n" . var_dump_ret($node1->routes[$k]) . "\n" . var_dump_ret($foundPrevTerminus));
                                }
                            }
                            else
                            {
                                if ($edge->next->pointIndex != 0)
                                {
                                    $edge->prev->pointIndex = 0;

                                    if ($debug)
                                    {
                                        error_log("Prev Edge: " . json_encode($edge));
                                    }

                                    array_push($edges, $edge);

                                    array_push($node1->edges, count($edges) - 1);
                                }
                            }
                        }

                        // Add the edge that follows this node
                        if (!isset($node1->routes[$k]->nextConnected))
                        {
                            $edge = (object)[ ];

                            $edge->type = $node1->routes[$k]->type;
                            $edge->cn = $node1->routes[$k]->cn;
                            $edge->pathIndex = $node1->routes[$k]->pathIndex;

                            $edge->prev = (object)[ ];
                            $edge->prev->nodeIndex = $i;
                            $edge->prev->pointIndex = $node1->routes[$k]->pointIndex;

                            if (!isset($node1->edges))
                            {
                                $node1->edges = [ ];
                            }

                            $node1->routes[$k]->nextConnected = true;

                            $edge->next = (object)[ ];

                            if (isset($foundNextTerminus))
                            {
                                $edge->next->nodeIndex = $foundNextNodeIndex;
                                $edge->next->pointIndex = $foundNextRouteIndex;

                                if ($debug)
                                {
                                    error_log("Next Edge: " . json_encode($edge));
                                }

                                array_push($edges, $edge);

                                array_push($node1->edges, count($edges) - 1);

                                if (!isset($allIntersections[$foundNextNodeIndex]->edges))
                                {
                                    $allIntersections[$foundNextNodeIndex]->edges = [ ];
                                }

                                array_push($allIntersections[$foundNextNodeIndex]->edges, count($edges) - 1);

                                $foundNextTerminus->prevConnected = true;

                                if ($debug)
                                {
                                    error_log("*** found 'next' edge ***\n" . var_dump_ret($node1->routes[$k]) . "\n" . var_dump_ret($foundNextTerminus));
                                }
                            }
                            else
                            {
                                if ($edge->prev->pointIndex != $node1->routes[$k]->pointIndexMax)
                                {
                                    $edge->next->pointIndex = $node1->routes[$k]->pointIndexMax;

                                    if ($debug)
                                    {
                                        error_log("Next Edge: " . json_encode($edge));
                                    }

                                    array_push($edges, $edge);

                                    array_push($node1->edges, count($edges) - 1);
                                }
                            }
                        }
                    }
                }
                else
                {
                    $edge = (object)[ ];

                    error_log("node: " . $i . ", route: " . $k . ", file: " . $node1->routes[$k]->file);

                    $edge->file = $node1->routes[$k]->file;
                    $edge->nodeIndex = $i;

                    array_push($edges, $edge);

                    array_push($node1->edges, count($edges) - 1);
                }
            }

            unset($node1->routes);
        }

        return $edges;
    }

    private static function assignEdgeCosts ($allIntersections, $edges, $trails)
    {
        foreach ($edges as $edge)
        {
            $forwardCost = 0;
            $backwardCost = 0;

            if (!isset($edge->file))
            {
                if (!isset($edge->prev->nodeIndex) && !isset($edge->next->nodeIndex))
                {
                    error_log("no node index: " . json_encode($edge));
                }
                else
                {
                    if ($edge->cn == "connector")
                    {
                        if (!isset($edge->prev->nodeIndex) || !isset($edge->next->nodeIndex))
                        {
                            error_log("no node index: " . json_encode($edge));
                        }
                        else
                        {
                            $node1 = $allIntersections[$edge->prev->nodeIndex];
                            $node2 = $allIntersections[$edge->next->nodeIndex];

                            $dx = haversineGreatCircleDistance($node1->lat, $node1->lng, $node2->lat, $node2->lng);

                            if ($dx != 0)
                            {
                                $ele1 = getElevation($node1->lat, $node1->lng);
                                $ele2 = getElevation($node2->lat, $node2->lng);

                                $dh = $ele2 - $ele1;

                                $forwardCost += $dx / metersPerHourGet($dh, $dx);
                                $backwardCost += $dx / metersPerHourGet(-$dh, $dx);
                            }
                        }
                    }
                    else
                    {
                        $points = $trails[$edge->cn]->routes[$edge->pathIndex]->route;

                        // $direction = $edge->prev->pointIndex <
                        // $edge->next->pointIndex ? 1 : -1;

                        for ($p = $edge->prev->pointIndex; $p < $edge->next->pointIndex; $p++)
                        {
                            $dx = haversineGreatCircleDistance($points[$p]->lat, $points[$p]->lng, $points[$p + 1]->lat, $points[$p + 1]->lng);

                            if ($dx != 0)
                            {
                                $ele1 = getElevation($points[$p]->lat, $points[$p]->lng);
                                $ele2 = getElevation($points[$p + 1]->lat, $points[$p + 1]->lng);

                                $dh = $ele2 - $ele1;

                                $forwardCost += $dx / metersPerHourGet($dh, $dx);
                                $backwardCost += $dx / metersPerHourGet(-$dh, $dx);
                            }
                        }
                    }
                }
            }

            $edge->forwardCost = $forwardCost;
            $edge->backwardCost = $backwardCost;
        }
    }

    private static function findPathIntersections ($trail1, $pathIndex, $trail2, $startIndex, $connectors)
    {
        // global $duplicatePointCount;
        // global $overlappingTrailRectscount;
        // global $totalIntersectionsCount;
        $intersections = [ ];

        $r1 = $trail1->routes[$pathIndex];

        for ($k = $startIndex; $k < count($trail2->routes); $k++)
        {
            $r2 = $trail2->routes[$k];

            if (count($r1->bounds) == 0 || count($r2->bounds) == 0 || boundsIntersect($r1->bounds, $r2->bounds, 0.00027027))
            {
                $prevPoint = $r1->route[0];
                // $junctionCount = 0;
                $contiguousJunctionCount = 0;
                $prevHadJunction = false;

                $prevIntersectionCount = count($intersections);

                for ($i = 1; $i < count($r1->route); $i++)
                {
                    if ($prevPoint->lat != $r1->route[$i]->lat && $prevPoint->lng != $r1->route[$i]->lng)
                    {
                        $newIntersections = [ ];

                        if (count($r2->bounds) == 0 || withinBounds($prevPoint, $r2->bounds, 0) || withinBounds($r1->route[$i], $r2->bounds, 0))
                        {
                            // $overlappingTrailRectscount++;

                            $newIntersections = Graph::segmentCrossesTrail($prevPoint, $r1->route[$i], $r2->route);

                            if (count($newIntersections) > 0)
                            {
                                if ($prevHadJunction)
                                {
                                    $contiguousJunctionCount++;
                                }
                                else
                                {
                                    foreach ($newIntersections as $intersection)
                                    {
                                        if (count($intersections) == 0 || ($intersections[count($intersections) - 1]->lat != $intersection->lat && $intersections[count(
                                            $intersections) - 1]->lng != $intersection->lng))
                                        {
                                            array_push($intersections,
                                                (object)[
                                                    "lat" => $intersection->lat,
                                                    "lng" => $intersection->lng,
                                                    "route" => [
                                                        (object)[
                                                            "type" => $trail1->type,
                                                            "cn" => $trail1->cn,
                                                            "pathIndex" => $pathIndex,
                                                            "pointIndex" => $i,
                                                            "pointIndexMax" => count($r1->route) - 1
                                                        ],
                                                        (object)[
                                                            "type" => $trail2->type,
                                                            "cn" => $trail2->cn,
                                                            "pathIndex" => $k,
                                                            "pointIndex" => $intersection->pointIndex,
                                                            "pointIndexMax" => count($r2->route) - 1
                                                        ]
                                                    ]
                                                ]);
                                        }
                                    }
                                }

                                $prevHadJunction = true;
                            }
                            else
                            {

                                $contiguousJunctionCount = 0;
                                $prevHadJunction = false;
                            }
                        }
                        else
                        {
                            $prevHadJunction = false;
                        }

                        if (Graph::$addConnectors && (!isset($newIntersections) || count($newIntersections) == 0))
                        {
                            // If this was the first segment in the route check
                            // to see if there are any nearby
                            // segments in the other route. We may want to add a
                            // connector if close enough.
                            if ($i == 1)
                            {
                                $newIntersection = Graph::addConnector($prevPoint, $r2->route, $connectors);

                                if (isset($newIntersection))
                                {
                                    array_push($intersections,
                                        (object)[
                                            "lat" => $prevPoint->lat,
                                            "lng" => $prevPoint->lng,
                                            "route" => [
                                                (object)[
                                                    "type" => $trail1->type,
                                                    "cn" => $trail1->cn,
                                                    "pathIndex" => $pathIndex,
                                                    "pointIndex" => 0,
                                                    "pointIndexMax" => count($r1->route) - 1
                                                ],
                                                (object)[
                                                    "type" => "connector",
                                                    "cn" => "connector",
                                                    "pathIndex" => $newIntersection->connectorIndex,
                                                    "pointIndex" => 0,
                                                    "pointIndexMax" => 1
                                                ]
                                            ]
                                        ]);

                                    array_push($intersections,
                                        (object)[
                                            "lat" => $newIntersection->lat,
                                            "lng" => $newIntersection->lng,
                                            "route" => [
                                                (object)[
                                                    "type" => "connector",
                                                    "cn" => "connector",
                                                    "pathIndex" => $newIntersection->connectorIndex,
                                                    "pointIndex" => 1,
                                                    "pointIndexMax" => 1
                                                ],
                                                (object)[
                                                    "type" => $trail2->type,
                                                    "cn" => $trail2->cn,
                                                    "pathIndex" => $k,
                                                    "pointIndex" => $newIntersection->pointIndex,
                                                    "pointIndexMax" => count($r2->route) - 1
                                                ]
                                            ]
                                        ]);
                                }
                            }
                            elseif ($i == count($r1->route) - 1)
                            {
                                $newIntersection = Graph::addConnector($r1->route[$i], $r2->route, $connectors);

                                if (isset($newIntersection))
                                {
                                    array_push($intersections,
                                        (object)[
                                            "lat" => $r1->route[$i]->lat,
                                            "lng" => $r1->route[$i]->lng,
                                            "route" => [
                                                (object)[
                                                    "type" => $trail1->type,
                                                    "cn" => $trail1->cn,
                                                    "pathIndex" => $pathIndex,
                                                    "pointIndex" => count($r1->route) - 1,
                                                    "pointIndexMax" => count($r1->route) - 1
                                                ],
                                                (object)[
                                                    "type" => "connector",
                                                    "cn" => "connector",
                                                    "pathIndex" => $newIntersection->connectorIndex,
                                                    "pointIndex" => 0,
                                                    "pointIndexMax" => 1
                                                ]
                                            ]
                                        ]);

                                    array_push($intersections,
                                        (object)[
                                            "lat" => $newIntersection->lat,
                                            "lng" => $newIntersection->lng,
                                            "route" => [
                                                (object)[
                                                    "type" => "connector",
                                                    "cn" => "connector",
                                                    "pathIndex" => $newIntersection->connectorIndex,
                                                    "pointIndex" => 1,
                                                    "pointIndexMax" => 1
                                                ],
                                                (object)[
                                                    "type" => $trail2->type,
                                                    "cn" => $trail2->cn,
                                                    "pathIndex" => $k,
                                                    "pointIndex" => $newIntersection->pointIndex,
                                                    "pointIndexMax" => count($r2->route) - 1
                                                ]
                                            ]
                                        ]);
                                }
                            }
                        }

                        $prevPoint = $r1->route[$i];
                    }
                    else
                    {
                        // $duplicatePointCount++;
                    }
                }

                // If there were no intersections between the two trails then
                // see if they are close enough to connect
                if (Graph::$addConnectors && $prevIntersectionCount < count($intersections))
                {
                    $newIntersection = Graph::addConnector($r2->route[0], $r1->route, $connectors);

                    if (isset($newIntersection))
                    {
                        array_push($intersections,
                            (object)[
                                "lat" => $r2->route[0]->lat,
                                "lng" => $r2->route[0]->lng,
                                "route" => [
                                    (object)[
                                        "type" => $trail2->type,
                                        "cn" => $trail2->cn,
                                        "pathIndex" => $k,
                                        "pointIndex" => 0,
                                        "pointIndexMax" => count($r2->route) - 1
                                    ],
                                    (object)[
                                        "type" => "connector",
                                        "cn" => "connector",
                                        "pathIndex" => $newIntersection->connectorIndex,
                                        "pointIndex" => 0,
                                        "pointIndexMax" => 1
                                    ]
                                ]
                            ]);

                        array_push($intersections,
                            (object)[
                                "lat" => $newIntersection->lat,
                                "lng" => $newIntersection->lng,
                                "route" => [
                                    (object)[
                                        "type" => "connector",
                                        "cn" => "connector",
                                        "pathIndex" => $newIntersection->connectorIndex,
                                        "pointIndex" => 1,
                                        "pointIndexMax" => 1
                                    ],
                                    (object)[
                                        "type" => $trail1->type,
                                        "cn" => $trail1->cn,
                                        "pathIndex" => $pathIndex,
                                        "pointIndex" => $newIntersection->pointIndex,
                                        "pointIndexMax" => count($r1->route) - 1
                                    ]
                                ]
                            ]);
                    }

                    $newIntersection = Graph::addConnector($r2->route[count($r2->route) - 1], $r1->route, $connectors);

                    if (isset($newIntersection))
                    {
                        array_push($intersections,
                            (object)[
                                "lat" => $r2->route[count($r2->route) - 1]->lat,
                                "lng" => $r2->route[count($r2->route) - 1]->lng,
                                "route" => [
                                    (object)[
                                        "type" => $trail2->type,
                                        "cn" => $trail2->cn,
                                        "pathIndex" => $k,
                                        "pointIndex" => count($r2->route) - 1,
                                        "pointIndexMax" => count($r2->route) - 1
                                    ],
                                    (object)[
                                        "type" => "connector",
                                        "cn" => "connector",
                                        "pathIndex" => $newIntersection->connectorIndex,
                                        "pointIndex" => 0,
                                        "pointIndexMax" => 1
                                    ]
                                ]
                            ]);

                        array_push($intersections,
                            (object)[
                                "lat" => $newIntersection->lat,
                                "lng" => $newIntersection->lng,
                                "route" => [
                                    (object)[
                                        "type" => "connector",
                                        "cn" => "connector",
                                        "pathIndex" => $newIntersection->connectorIndex,
                                        "pointIndex" => 1,
                                        "pointIndexMax" => 1
                                    ],
                                    (object)[
                                        "type" => $trail1->type,
                                        "cn" => $trail1->cn,
                                        "pathIndex" => $pathIndex,
                                        "pointIndex" => $newIntersection->pointIndex,
                                        "pointIndexMax" => count($r1->route) - 1
                                    ]
                                ]
                            ]);
                    }
                }
            }
        }

        return $intersections;
    }

    private static function mergeIntersectionPaths ($dest, $src)
    {
        // Move any, non-existing, paths from the source
        // to the destination.
        foreach ($src->route as $r2)
        {
            $found = false;

            if (isset($r2->file))
            {
                foreach ($dest->routes as $r1)
                {
                    if (isset($r1->file) && $r2->file == $r1->file)
                    {
                        $found = true;
                        break;
                    }
                }

                if (!found)
                {
                    array_push($dest->routes, $r2);
                }
            }
            else
            {
                foreach ($dest->routes as $r1)
                {
                    if (!isset($r1->file) && $r2->type == $r1->type && $r2->cn == $r1->cn && $r2->pathIndex == $r1->pathIndex)
                    {
                        $found = true;
                        break;
                    }
                }

                if (!$found)
                {
                    array_push($dest->routes,
                        (object)[
                            "type" => $r2->type,
                            "cn" => $r2->cn,
                            "pathIndex" => $r2->pathIndex,
                            "pointIndex" => $r2->pointIndex,
                            "pointIndexMax" => $r2->pointIndexMax
                        ]);
                }
            }
        }
    }


    private static function addIntersections ($intersections, &$allIntersections)
    {
        $duplicates = false;

        if (count($intersections) > 0)
        {
            foreach ($intersections as $newIntersection)
            {
                $found = false;

                // First determine if we already have an intersection at this
                // lat/lng
                foreach ($allIntersections as $oldIntersection)
                {
                    if ($oldIntersection->lat == $newIntersection->lat && $oldIntersection->lng == $newIntersection->lng)
                    {
                        Graph::mergeIntersectionPaths ($oldIntersection, $newIntersection);

                        $found = true;
                        break;
                    }
                }

                if (!$found)
                {
                    $intersection = (object)[
                        "lat" => $newIntersection->lat,
                        "lng" => $newIntersection->lng
                    ];

                    $intersection->routes = [ ];

                    foreach ($newIntersection->route as $route)
                    {
                        if (isset($route->file))
                        {
                            array_push($intersection->routes, $route);
                        }
                        else
                        {
                            array_push($intersection->routes,
                                (object)[
                                    "type" => $route->type,
                                    "cn" => $route->cn,
                                    "pathIndex" => $route->pathIndex,
                                    "pointIndex" => $route->pointIndex,
                                    "pointIndexMax" => $route->pointIndexMax
                                ]);
                        }
                    }

                    if (!isset($intersection->routes))
                    {
                        error_log ("No routes in new intersection");
                    }

                    array_push($allIntersections, $intersection);
                }
            }
        }

        return $duplicates;
    }

    private static function addConnector ($coord, $route, $connectors)
    {
        $result = pointOnPath($coord, $route, Graph::MAX_CONNECTOR_LENGTH);

        if (isset($result))
        {
            $found = false;

            // Determine if a connector exists betwween the two
            // points.
            foreach ($connectors->routes as $connector)
            {
                if (($connector->route[0]->lat == $coord->lat
                    && $connector->route[0]->lng == $coord->lng
                    && $connector->route[1]->lat == $result->point->lat
                    && $connector->route[1]->lng == $result->point->lng)
                    ||
                    ($connector->route[1]->lat == $coord->lat
                    && $connector->route[1]->lng == $coord->lng
                    && $connector->route[0]->lat == $result->point->lat
                    && $connector->route[0]->lng == $result->point->lng))
                {
                    $found = true;
                    break;
                }
            }

            if (!$found)
            {
                $route = (object)[
                    "route" => [ ]
                ];
                array_push($route->route, (object)[
                    "lat" => $coord->lat,
                    "lng" => $coord->lng
                ]);
                array_push($route->route, $result->point);

                array_push($connectors->routes, $route);

                $intersection = (object)[ ];

                $intersection->connectorIndex = count($connectors->routes) - 1;
                $intersection->pointIndex = $result->pointIndex;
                $intersection->lat = $result->point->lat;
                $intersection->lng = $result->point->lng;

                return $intersection;
            }
        }
    }

    private static function segmentCrossesTrail ($coord1, $coord2, $points)
    {
        // global $duplicatePointCount;
        $intersections = [ ];

        $prevPoint = $points[0];

        for ($i = 1; $i < count($points); $i++)
        {
            if ($prevPoint->lat != $points[$i]->lat && $prevPoint->lng != $points[$i]->lng)
            {
                $intersection = Graph::segmentsIntersection($coord1, $coord2, $prevPoint, $points[$i]);

                if (isset($intersection))
                {
                    if ((isset($prevIntersection) && $prevIntersection == $intersection))
                    {
                        // error_log ("duplicate intersection: \n" .
                        // var_dump_ret($prevIntersection) . "\n" .
                        // var_dump_ret($intersection));
                    }
                    else
                    {
                        // if (count($intersections) > 0)
                        // {
                        // error_log("pushing another intersection: \n" .
                        // var_dump_ret($intersection) . "\nPrevious = \n" .
                        // var_dump_ret($prevIntersection));
                        // error_log($prevIntersection == $intersection ?
                        // "equal" : "not equal");
                        // error_log(var_dump_ret($prevIntersection->lat -
                        // $intersection->lat));
                        // error_log(var_dump_ret($prevIntersection->lng -
                        // $intersection->lng));
                        // }

                        $intersection->pointIndex = $i - 1;

                        array_push($intersections, $intersection);

                        $prevIntersection = $intersection;
                    }
                }

                $prevPoint = $points[$i];
            }
            else
            {
                // $duplicatePointCount++;
            }
        }

        return $intersections;
    }

    private static function segmentsIntersection ($coord1, $coord2, $coord3, $coord4)
    {
        $closeIntersectThreshold = 0;
        $intersectionCount = 0;
        $overlapCount = 0;
        $pointCount = 0;
        $closeIntersectionCount = 0;

        $r = Graph::vector($coord1, $coord2);
        $s = Graph::vector($coord3, $coord4);

        if (($r->x == 0 && $r->y == 0) || $s->x == 0 && $s->y == 0)
        {
            $pointCount++;
            // echo "one of the segments is a point\n";
        }
        else
        {
            $v = Graph::vector($coord1, $coord3);
            $numerator = Graph::crossProduct($v, $s);
            $denominator = Graph::crossProduct($r, $s);

            if ($denominator != 0)
            {
                $t = $numerator / $denominator;
                $u = Graph::crossProduct($v, $r) / $denominator;

                $intersection = (object)[
                    "lat" => $coord1->lat + $t * $r->y,
                    "lng" => $coord1->lng + $t * $r->x
                ];

                if ($t >= 0 && $t <= 1 && $u >= 0 && $u <= 1)
                {
                    // if (!nearlyColinear ($numerator, $r, $s, $coord1,
                    // $coord3))
                    {
                        // var_dump ($numerator);
                        // var_dump ($denominator);
                        // echo "===== first set ==== \n";
                        // var_dump ($coord1);
                        // var_dump ($coord2);
                        // echo "===== r ==== \n";
                        // var_dump ($r);

                        // echo "===== second set ==== \n";
                        // var_dump ($coord3);
                        // var_dump ($coord4);
                        // echo "===== s ==== \n";
                        // var_dump ($s);

                        // echo "===== v ==== \n";
                        // var_dump ($v);

                        // var_dump ($t);
                        // var_dump ($u);

                        // echo "\n\n";

                        $intersectionCount++;
                        return $intersection;
                    }
                }
                elseif ($t >= 0 && $t <= 1)
                {
                    if ($u < 0)
                    {
                        $uIntersection = (object)[
                            "lat" => $coord3->lat + $u * $s->y,
                            "lng" => $coord3->lng + $u * $s->x
                        ];

                        $d = haversineGreatCircleDistance($coord3->lat, $coord3->lng, $uIntersection->lat, $uIntersection->lng);

                        if ($d <= $closeIntersectThreshold)
                        {
                            $closeIntersectionCount++;
                            // echo "close intersection: $d\n";
                            return $intersection;
                        }
                    }
                    elseif ($u > 1)
                    {
                        $uIntersection = (object)[
                            "lat" => $coord3->lat + $u * $s->y,
                            "lng" => $coord3->lng + $u * $s->x
                        ];

                        $d = haversineGreatCircleDistance($coord4->lat, $coord4->lng, $uIntersection->lat, $uIntersection->lng);

                        if ($d <= $closeIntersectThreshold)
                        {
                            $closeIntersectionCount++;
                            // echo "close intersection: $d\n";
                            return $intersection;
                        }
                    }
                    else
                    {
                        $closeIntersectionCount++;
                        // echo "close intersection: $d\n";
                        return $intersection;
                    }
                }
                elseif ($t < 0)
                {
                    $intersection = (object)[
                        "lat" => $coord1->lat + $t * $r->y,
                        "lng" => $coord1->lng + $t * $r->x
                    ];

                    $d = haversineGreatCircleDistance($coord1->lat, $coord1->lng, $intersection->lat, $intersection->lng);

                    if ($d <= $closeIntersectThreshold)
                    {
                        if ($u < 0)
                        {
                            $uIntersection = (object)[
                                "lat" => $coord3->lat + $u * $s->y,
                                "lng" => $coord3->lng + $u * $s->x
                            ];

                            $d = haversineGreatCircleDistance($coord3->lat, $coord3->lng, $uIntersection->lat, $uIntersection->lng);

                            if ($d <= $closeIntersectThreshold)
                            {
                                $closeIntersectionCount++;
                                // echo "close intersection: $d\n";
                                return $intersection;
                            }
                        }
                        elseif ($u > 1)
                        {
                            $uIntersection = (object)[
                                "lat" => $coord3->lat + $u * $s->y,
                                "lng" => $coord3->lng + $u * $s->x
                            ];

                            $d = haversineGreatCircleDistance($coord4->lat, $coord4->lng, $uIntersection->lat, $uIntersection->lng);

                            if ($d <= $closeIntersectThreshold)
                            {
                                $closeIntersectionCount++;
                                // echo "close intersection: $d\n";
                                return $intersection;
                            }
                        }
                        else
                        {
                            $closeIntersectionCount++;
                            // echo "close intersection: $d\n";
                            return $intersection;
                        }
                    }
                }
                elseif ($t > 1)
                {
                    $d = haversineGreatCircleDistance($coord2->lat, $coord2->lng, $intersection->lat, $intersection->lng);

                    if ($d <= $closeIntersectThreshold)
                    {
                        if ($u < 0)
                        {
                            $uIntersection = (object)[
                                "lat" => $coord3->lat + $u * $s->y,
                                "lng" => $coord3->lng + $u * $s->x
                            ];

                            $d = haversineGreatCircleDistance($coord3->lat, $coord3->lng, $uIntersection->lat, $uIntersection->lng);

                            if ($d <= $closeIntersectThreshold)
                            {
                                $closeIntersectionCount++;
                                // echo "close intersection: $d\n";
                                return $intersection;
                            }
                        }
                        elseif ($u > 1)
                        {
                            $uIntersection = (object)[
                                "lat" => $coord3->lat + $u * $s->y,
                                "lng" => $coord3->lng + $u * $s->x
                            ];

                            $d = haversineGreatCircleDistance($coord4->lat, $coord4->lng, $uIntersection->lat, $uIntersection->lng);

                            if ($d <= $closeIntersectThreshold)
                            {
                                $closeIntersectionCount++;
                                // echo "close intersection: $d\n";
                                return $intersection;
                            }
                        }
                        else
                        {
                            $closeIntersectionCount++;
                            // echo "close intersection: $d\n";
                            return $intersection;
                        }
                    }
                }
            }
            else
            {
                if ($numerator == 0)
                {
                    $denominator = Graph::dotProduct($r, $r);

                    if ($denominator != 0)
                    {
                        // segments are colinear
                        $t0 = Graph::dotProduct(Graph::vector($coord1, $coord3), $r) / $denominator;
                        $t1 = $t0 + Graph::dotProduct($s, $r) / $denominator;

                        if (Graph::dotProduct($s, $r) > 0)
                        {
                            if ($t0 < 1 && $t1 > 0)
                            {
                                $overlapCount++;
                                // echo "segments are colinear and overlap\n";
                            }
                        }
                        else
                        {
                            if ($t1 < 1 && $t0 > 0)
                            {
                                $overlapCount++;
                                // echo "segments are colinear and overlap\n";
                            }
                        }
                    }
                }
                else
                {
                    // segments are parallel
                    // echo "segments are parallel\n";
                }
            }
        }
    }

    private static function vector ($p1, $p2)
    {
        return (object)[
            "x" => $p2->lng - $p1->lng,
            "y" => $p2->lat - $p1->lat
        ];
    }

    private static function crossProduct ($v1, $v2)
    {
        return $v1->x * $v2->y - $v1->y * $v2->x;
    }

    private static function dotProduct ($v1, $v2)
    {
        return $v1->x * $v2->x + $v1->y * $v2->y;
    }
}
