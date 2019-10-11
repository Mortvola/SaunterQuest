<?php
namespace App;
require_once app_path("utilities.php");

class Graph
{

    private $name;

    private $graph;

    private $connectors;

    private const MAX_CONNECTOR_LENGTH = 60;

    private const CONNECTOR_TRAIL_TYPE = "connector";
    private const CONNECTOR_CN = "connector";


    public function __construct ($name)
    {
        $this->name = $name;
    }

    public function generate ($trails)
    {
        $allIntersections = [ ];
        $this->connectors = (object)[
            "type" => Graph::CONNECTOR_TRAIL_TYPE,
            "cn" => Graph::CONNECTOR_CN,
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

        $path = $trail->paths[$pathIndex];

        //
        // Add the nodes at the start and end of this path
        // that go to another file, if any.
        //
        if (isset($path->from))
        {
            $intersection = (object)[
                "lat" => $path->points[0]->lat,
                "lng" => $path->points[0]->lng,
                "route" => [
                    (object)[
                        "type" => $trail->type,
                        "cn" => $trail->cn,
                        "pathIndex" => $pathIndex,
                        "pointIndex" => 0,
                        "pointIndexMax" => count($path->points) - 1
                    ]
                ]
            ];

            list($file, $connectionId) = explode (":", $path->from);
            $intersection->fileConnection = (object)["file" => $file, "id" => $connectionId];

            $intersections[] = $intersection;
        }

        if (isset($path->to))
        {
            $intersection = (object)[
                "lat" => $path->points[count($path->points) - 1]->lat,
                "lng" => $path->points[count($path->points) - 1]->lng,
                "route" => [
                    (object)[
                        "type" => $trail->type,
                        "cn" => $trail->cn,
                        "pathIndex" => $pathIndex,
                        "pointIndex" => count($path->points) - 1,
                        "pointIndexMax" => count($path->points) - 1
                    ]
                ]
            ];

            list($file, $connectionId) = explode (":", $path->to);
            $intersection->fileConnection = (object)["file" => $file, "id" => $connectionId];

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

            for ($j = 0; $j < count($trail->paths); $j++)
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

                    if ($otherTrail->type != Graph::CONNECTOR_TRAIL_TYPE)
                    {
                        // error_log("count of other trail routes: ".
                        // count($otherTrail->paths));

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
            if (!isset($allIntersections[$i]->fileConnection))
            {
                for ($j = $i + 1; $j < count($allIntersections);)
                {
                    if (!isset($allIntersections[$j]->fileConnection) && $allIntersections[$i]->lat == $allIntersections[$j]->lat && $allIntersections[$i]->lng == $allIntersections[$j]->lng)
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
        }

        error_log("Number of nodes consolidated: " . $consolidationCount);
    }

    private static function findEdges ($allIntersections)
    {
        $edges = [ ];

        for ($i = 0; $i < count($allIntersections); $i++)
        {
            $node1 = $allIntersections[$i];

            if (!isset($node1->edges))
            {
                $node1->edges = [ ];
            }

            // For each of the paths connected to this node, look for nodes that
            // are connected to the same path.
            for ($k = 0; $k < count($node1->routes); $k++)
            {
                $path1 = $node1->routes[$k];

                if (!isset($path1->startConnected) || !isset($path1->endConnected))
                {
                    unset($foundStartTerminus);
                    unset($foundEndTerminus);

                    for ($j = $i + 1; $j < count($allIntersections); $j++)
                    {
                        $node2 = $allIntersections[$j];

                        for ($l = 0; $l < count($node2->routes); $l++)
                        {
                            $path2 = $node2->routes[$l];

                            if ($path1->cn == $path2->cn && $path1->pathIndex == $path2->pathIndex)
                            {
                                if (!isset($path1->startConnected) && $path1->pointIndex > $path2->pointIndex && (!isset(
                                    $foundStartTerminus) || ($path2->pointIndex > $foundStartTerminus->pointIndex)))
                                {
                                    $foundStartTerminus = $path2;
                                    $foundStartNodeIndex = $j;
                                    $foundStartPointIndex = $path2->pointIndex;
                                }

                                if (!isset($path1->endConnected) && $path1->pointIndex < $path2->pointIndex && (!isset(
                                    $foundEndTerminus) || ($path2->pointIndex < $foundEndTerminus->pointIndex)))
                                {
                                    $foundEndTerminus = $path2;
                                    $foundEndNodeIndex = $j;
                                    $foundEndPointIndex = $path2->pointIndex;
                                }
                            }
                        }
                    }

                    // There are three possible cases:
                    // 1. The path pass through the node.
                    // 2. The path starts at the node.
                    // 3. the path ends at the node.

                    // Add the edge that precedes this node.

                    if (!isset($path1->startConnected))
                    {
                        $edge = (object)[ ];

                        $edge->type = $path1->type;
                        $edge->cn = $path1->cn;
                        $edge->pathIndex = $path1->pathIndex;

                        $edge->next = (object)[ ];
                        $edge->next->nodeIndex = $i;
                        $edge->next->pointIndex = $path1->pointIndex;

                        $edge->prev = (object)[ ];

                        if (isset($foundStartTerminus))
                        {
                            $edge->prev->nodeIndex = $foundStartNodeIndex;
                            $edge->prev->pointIndex = $foundStartPointIndex;

                            array_push($edges, $edge);

                            array_push($node1->edges, count($edges) - 1);

                            if (!isset($allIntersections[$foundStartNodeIndex]->edges))
                            {
                                $allIntersections[$foundStartNodeIndex]->edges = [ ];
                            }

                            array_push($allIntersections[$foundStartNodeIndex]->edges, count($edges) - 1);

                            $foundStartTerminus->endConnected = true;
                        }
                        else if ($path1->pointIndex != 0)
                        {
                            // If the path doesn't start at this node (the point index is not zero)
                            // then add an edge that represents an edge that goes to no node (a dead end).
                            $edge->prev->pointIndex = 0;

                            array_push($edges, $edge);

                            array_push($node1->edges, count($edges) - 1);
                        }

                        $path1->startConnected = true;
                    }

                    // Add the edge that follows this node
                    if (!isset($path1->endConnected))
                    {
                        $edge = (object)[ ];

                        $edge->type = $path1->type;
                        $edge->cn = $path1->cn;
                        $edge->pathIndex = $path1->pathIndex;

                        $edge->prev = (object)[ ];
                        $edge->prev->nodeIndex = $i;
                        $edge->prev->pointIndex = $path1->pointIndex;

                        $edge->next = (object)[ ];

                        if (isset($foundEndTerminus))
                        {
                            $edge->next->nodeIndex = $foundEndNodeIndex;
                            $edge->next->pointIndex = $foundEndPointIndex;

                            array_push($edges, $edge);

                            array_push($node1->edges, count($edges) - 1);

                            if (!isset($allIntersections[$foundEndNodeIndex]->edges))
                            {
                                $allIntersections[$foundEndNodeIndex]->edges = [ ];
                            }

                            array_push($allIntersections[$foundEndNodeIndex]->edges, count($edges) - 1);

                            $foundEndTerminus->startConnected = true;
                        }
                        else if ($path1->pointIndex != $path1->pointIndexMax)
                        {
                            // If the path doesn't end at this node (the point index is not the max index)
                            // then add an edge that represents an edge that goes to no node (a dead end).
                            $edge->next->pointIndex = $path1->pointIndexMax;

                            array_push($edges, $edge);

                            array_push($node1->edges, count($edges) - 1);
                        }

                        $path1->endConnected = true;
                    }
                }
            }

            unset($node1->routes);
        }

        return $edges;
    }

    private static function assignEdgeCosts ($allIntersections, $edges, $trails)
    {
        $elevation = new Elevation;

        foreach ($edges as $edge)
        {
            $forwardCost = 0;
            $backwardCost = 0;

            if (!isset($edge->prev->nodeIndex) && !isset($edge->next->nodeIndex))
            {
                error_log("no node index: " . json_encode($edge));
            }
            else
            {
                if ($edge->cn == Graph::CONNECTOR_CN)
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
                            $ele1 = $elevation->getElevation($node1->lat, $node1->lng);
                            $ele2 = $elevation->getElevation($node2->lat, $node2->lng);

                            $dh = $ele2 - $ele1;

                            $forwardCost += $dx / metersPerHourGet($dh, $dx);
                            $backwardCost += $dx / metersPerHourGet(-$dh, $dx);
                        }
                    }
                }
                else
                {
                    $points = $trails[$edge->cn]->paths[$edge->pathIndex]->points;

                    // $direction = $edge->prev->pointIndex <
                    // $edge->next->pointIndex ? 1 : -1;

                    for ($p = $edge->prev->pointIndex; $p < $edge->next->pointIndex; $p++)
                    {
                        $dx = haversineGreatCircleDistance($points[$p]->lat, $points[$p]->lng, $points[$p + 1]->lat, $points[$p + 1]->lng);

                        if ($dx != 0)
                        {
                            $ele1 = $elevation->getElevation($points[$p]->lat, $points[$p]->lng);
                            $ele2 = $elevation->getElevation($points[$p + 1]->lat, $points[$p + 1]->lng);

                            $dh = $ele2 - $ele1;

                            $forwardCost += $dx / metersPerHourGet($dh, $dx);
                            $backwardCost += $dx / metersPerHourGet(-$dh, $dx);
                        }
                    }
                }
            }

            $edge->forwardCost = $forwardCost;
            $edge->backwardCost = $backwardCost;
        }
    }

    private static function addConnectorIntersections (&$intersections, $trail1, $pathIndex1, $pointIndex1, $trail2, $pathIndex2, $newIntersection)
    {
        $path1 = $trail1->paths[$pathIndex1];
        $path2 = $trail2->paths[$pathIndex2];

        if ($path1->points[$pointIndex1]->lat == $newIntersection->lat
            && $path1->points[$pointIndex1]->lng == $newIntersection->lng)
        {
            error_log ("Connector connecting the same point!");
        }
        else
        {
            array_push($intersections,
                (object)[
                    "lat" => $path1->points[$pointIndex1]->lat,
                    "lng" => $path1->points[$pointIndex1]->lng,
                    "route" => [
                        (object)[
                            "type" => $trail1->type,
                            "cn" => $trail1->cn,
                            "pathIndex" => $pathIndex1,
                            "pointIndex" => $pointIndex1,
                            "pointIndexMax" => count($path1->points) - 1
                        ],
                        (object)[
                            "type" => Graph::CONNECTOR_TRAIL_TYPE,
                            "cn" => Graph::CONNECTOR_CN,
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
                            "type" => Graph::CONNECTOR_TRAIL_TYPE,
                            "cn" => Graph::CONNECTOR_CN,
                            "pathIndex" => $newIntersection->connectorIndex,
                            "pointIndex" => 1,
                            "pointIndexMax" => 1
                        ],
                        (object)[
                            "type" => $trail2->type,
                            "cn" => $trail2->cn,
                            "pathIndex" => $pathIndex2,
                            "pointIndex" => $newIntersection->pointIndex,
                            "pointIndexMax" => count($path2->points) - 1
                        ]
                    ]
                ]);
        }
    }

    private static function findPathIntersections ($trail1, $pathIndex, $trail2, $startIndex, $connectors)
    {
        // global $duplicatePointCount;
        // global $overlappingTrailRectscount;
        // global $totalIntersectionsCount;
        $intersections = [ ];

        $r1 = $trail1->paths[$pathIndex];

        for ($k = $startIndex; $k < count($trail2->paths); $k++)
        {
            $r2 = $trail2->paths[$k];

            if (count($r1->bounds) == 0 || count($r2->bounds) == 0 || boundsIntersect($r1->bounds, $r2->bounds, 0.00027027))
            {
                $prevPoint = $r1->points[0];
                // $junctionCount = 0;
                $contiguousJunctionCount = 0;
                $prevHadJunction = false;

                $prevIntersectionCount = count($intersections);

                for ($i = 1; $i < count($r1->points); $i++)
                {
                    if ($prevPoint->lat != $r1->points[$i]->lat && $prevPoint->lng != $r1->points[$i]->lng)
                    {
                        $newIntersections = [ ];

                        if (count($r2->bounds) == 0 || withinBounds($prevPoint, $r2->bounds, 0) || withinBounds($r1->points[$i], $r2->bounds, 0))
                        {
                            // $overlappingTrailRectscount++;

                            $newIntersections = Graph::segmentCrossesTrail($prevPoint, $r1->points[$i], $r2->points);

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
                                                            "pointIndexMax" => count($r1->points) - 1
                                                        ],
                                                        (object)[
                                                            "type" => $trail2->type,
                                                            "cn" => $trail2->cn,
                                                            "pathIndex" => $k,
                                                            "pointIndex" => $intersection->pointIndex,
                                                            "pointIndexMax" => count($r2->points) - 1
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

                        if (!isset($newIntersections) || count($newIntersections) == 0)
                        {
                            // If this was the first or the last segment in the route check
                            // to see if there are any nearby
                            // segments in the other route. We may want to add a
                            // connector if close enough.
                            if ($i == 1)
                            {
                                $newIntersection = Graph::addConnector($r1->points[0], $r2->points, $connectors);

                                if (isset($newIntersection))
                                {
                                    Graph::addConnectorIntersections ($intersections, $trail1, $pathIndex, 0, $trail2, $k, $newIntersection);
                                }
                            }
                            elseif ($i == count($r1->points) - 1)
                            {
                                $newIntersection = Graph::addConnector($r1->points[$i], $r2->points, $connectors);

                                if (isset($newIntersection))
                                {
                                    Graph::addConnectorIntersections ($intersections, $trail1, $pathIndex, $i, $trail2, $k, $newIntersection);
                                }
                            }
                        }

                        $prevPoint = $r1->points[$i];
                    }
                    else
                    {
                        // $duplicatePointCount++;
                    }
                }

                // If there were no intersections between the two trails then
                // see if they are close enough to connect
                if ($prevIntersectionCount >= count($intersections))
                {
                    $newIntersection = Graph::addConnector($r2->points[0], $r1->points, $connectors);

                    if (isset($newIntersection))
                    {
                        Graph::addConnectorIntersections ($intersections, $trail2, $k, 0, $trail1, $pathIndex, $newIntersection);
                    }

                    $newIntersection = Graph::addConnector($r2->points[count($r2->points) - 1], $r1->points, $connectors);

                    if (isset($newIntersection))
                    {
                        Graph::addConnectorIntersections ($intersections, $trail2, $k, count($r2->points) - 1, $trail1, $pathIndex, $newIntersection);
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

            foreach ($dest->routes as $r1)
            {
                if ($r2->type == $r1->type && $r2->cn == $r1->cn && $r2->pathIndex == $r1->pathIndex)
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


    private static function addIntersections ($intersections, &$allIntersections)
    {
        $duplicates = false;

        if (count($intersections) > 0)
        {
            foreach ($intersections as $newIntersection)
            {
                $found = false;

                if (!isset($newIntersection->fileConnection)) // We don't combine file connection nodes
                {
                    // First determine if we already have an intersection at this
                    // lat/lng
                    foreach ($allIntersections as $oldIntersection)
                    {
                        if (!isset($oldIntersection->fileConnection) && $oldIntersection->lat == $newIntersection->lat && $oldIntersection->lng == $newIntersection->lng)
                        {
                            Graph::mergeIntersectionPaths ($oldIntersection, $newIntersection);

                            $found = true;
                            break;
                        }
                    }
                }

                if (!$found)
                {
                    $intersection = (object)[
                        "lat" => $newIntersection->lat,
                        "lng" => $newIntersection->lng
                    ];

                    if (isset($newIntersection->fileConnection))
                    {
                        $intersection->fileConnection = $newIntersection->fileConnection;
                    }

                    $intersection->routes = [ ];

                    foreach ($newIntersection->route as $route)
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

    private static function addConnector ($coord, $points, $connectors)
    {
        $result = pointOnPath($coord, $points, Graph::MAX_CONNECTOR_LENGTH);

        if (isset($result))
        {
            if ($result->point->lat == $coord->lat && $result->point->lng == $coord->lng)
            {
                error_log ('addConnector: point and found point are the same.');
            }

            $found = false;

            // Determine if a connector exists between the two
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
