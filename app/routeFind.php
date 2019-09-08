<?php
namespace App;
require_once "coordinates.php";
require_once "routeFile.php";
require_once "utilities.php";

$handle = null;

function dump_node ($nodeIndex, $graph)
{
    if (isset($nodeIndex))
    {
        error_log("---------------");
        error_log("Node Index: " . $nodeIndex);

        $node = $graph->nodes[$nodeIndex];

        error_log("Number of edges: " . count($node->edges));

        for ($i = 0; $i < count($node->edges); $i++)
        {
            $edge = $graph->edges[$node->edges[$i]];

            if (isset($edge->file))
            {
                error_log("edge index: " . $node->edges[$i] . ", route to file " . $edge->file . ". " . (isset($edge->visited) ? "Visited" : ""));
            }
            else
            {
                if (!isset($edge->prev->nodeIndex))
                {
                    error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . (isset($edge->visited) ? "Visited" : ""));
                }
                elseif ($edge->prev->nodeIndex != $nodeIndex)
                {
                    error_log(
                        "edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->prev->nodeIndex . ". " .
                        (isset($edge->visited) ? "Visited" : ""));
                }

                if (!isset($edge->next->nodeIndex))
                {
                    error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . (isset($edge->visited) ? "Visited" : ""));
                }
                elseif ($edge->next->nodeIndex != $nodeIndex)
                {
                    error_log(
                        "edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->next->nodeIndex . ". " .
                        (isset($edge->visited) ? "Visited" : ""));
                }

                if (!isset($edge->next->nodeIndex) && !isset($edge->prev->nodeIndex))
                {
                    error_log("edge index: " . $node->edges[$i] . ", no route");
                }
            }
        }
        error_log("---------------");
    }
}


// Convenience method for creating start and end anchors
function createAnchor ($anchorInfo, $anchorType)
{
    $anchor = (object)[ ];
    $anchor->lat = $anchorInfo->point->lat;
    $anchor->lng = $anchorInfo->point->lng;
    $anchor->type = $anchorType;

    $trailName = $anchorInfo->trail->type . ':' . $anchorInfo->trail->cn . ':' . $anchorInfo->pathIndex;

    if ($anchorType == "start")
    {
        $anchor->next = (object)[ ];
        $anchor->next->trailName = $trailName;
        $anchor->next->routeIndex = $anchorInfo->pointIndex;
    }
    else
    {
        $anchor->prev = (object)[ ];
        $anchor->prev->trailName = $trailName;
        $anchor->prev->routeIndex = $anchorInfo->pointIndex;
    }

    return $anchor;
}


function addNewAnchor (&$newAnchors, $anchor)
{
    if ($anchor->lat != $newAnchors[0]->lat || $anchor->lng != $newAnchors[0]->lng)
    {
        if (count($newAnchors) >= 1 && isset($anchor->next->file))
        {
            // Push the anchor onto the front of the array
            array_splice($newAnchors, 0, 0, array (
                $anchor
            ));
        }
        else
        {
            if (count($newAnchors) >= 1 && $anchor->next->trailName != $newAnchors[0]->prev->trailName)
            {
                error_log("next and previous trails don't match: next: " . $anchor->next->trailName . ", prev: " . $newAnchors[0]->prev->trailName);
                error_log(json_encode($anchor));
            }

            // Determine if we should replace the previously pushed anchor
            // or add a new one. If the anchor at position 0 is between
            // the new one and the one at position 1, then we can just replace
            // the one at position 0.
            if (count($newAnchors) > 1 && !isset($newAnchors[0]->next->file) && $anchor->next->trailName == $newAnchors[0]->prev->trailName &&
                $anchor->next->trailName == $newAnchors[1]->prev->trailName && (($anchor->next->routeIndex > $newAnchors[0]->prev->routeIndex &&
                $newAnchors[0]->next->routeIndex > $newAnchors[1]->prev->routeIndex) ||
                ($anchor->next->routeIndex < $newAnchors[0]->prev->routeIndex && $newAnchors[0]->next->routeIndex < $newAnchors[1]->prev->routeIndex)))
            {
                error_log("Replacing " . json_encode($newAnchors[0]));
                error_log("with " . json_encode($anchor));

                $newAnchors[0] = $anchor;
            }
            else
            {
                // Push the anchor onto the front of the array
                array_splice($newAnchors, 0, 0, array (
                    $anchor
                ));
            }
        }
    }
}

function translateFileName ($fileName)
{
    $fileName = explode(":", $fileName)[0];

    $parts = explode(".", $fileName);

    return $parts[0] . ".inter.json";
}

$fileGraphMap = [ ];

function getGraph ($fileName)
{
    global $fileGraphMap;

    if ($fileGraphMap == null)
    {
        $fileGraphMap = [ ];
    }

    if (!array_key_exists($fileName, $fileGraphMap))
    {
        $fileGraphMap[$fileName] = json_decode(file_get_contents(base_path($fileName)));
    }

    return $fileGraphMap[$fileName];
}

function getOtherNodeIndex ($edge, $nodeIndex)
{
    if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex != $nodeIndex)
    {
        return $edge->prev->nodeIndex;
    }
    elseif (isset($edge->next->nodeIndex) && $edge->next->nodeIndex != $nodeIndex)
    {
        return $edge->next->nodeIndex;
    }
    else
    {
        error_log("no matching previous or next");
    }
}

function pushNode ($edgeIndex, $fromNodeIndex, $graph, $graphFile, &$nodes, $endResult)
{
    global $endGraphFile;
    global $handle;

    $foundEnd = false;

    $node = $graph->nodes[$fromNodeIndex];
    $edge = $graph->edges[$edgeIndex];

    if (!isset($edge))
    {
        error_log("edge index: " . $edgeIndex);
        error_log("number of edges: " . count($graph->edges));
    }

    if (isset($edge->file))
    {
        error_log("edge with file found: " . $edge->file);

        $nextNodeIndex = $edge->nodeIndex;

        $nextNode = $graph->nodes[$nextNodeIndex];

        $nextNode->bestEdge = $edgeIndex;

        array_push($nodes, (object)[
            "index" => $nextNodeIndex,
            "file" => $graphFile
        ]);
    }
    else
    {
        // error_log("End graph file: " . $endGraphFile . ", curent file: " .
        // $graphFile);

        if ($graphFile == $endGraphFile && $edge->cn == $endResult->trail->cn && $edge->route == $endResult->pathIndex &&
            ($endResult->pointIndex >= $edge->prev->routeIndex && $endResult->pointIndex <= $edge->next->routeIndex))
        {
            error_log("Found end. Last edge " . $edgeIndex);
            error_log(var_dump_ret($edge));
            $foundEnd = true;
        }
        else
        {
            // if ($edge->cn == "5059.002691")
            // {
            // $cost = $node->cost;
            // }
            // else
            {
                $cost = $node->cost + $edge->cost;
            }

            $nextNodeIndex = getOtherNodeIndex($edge, $fromNodeIndex);

            if (isset($nextNodeIndex))
            {
                $nextNode = $graph->nodes[$nextNodeIndex];

                if (!isset($nextNode->cost) || $cost < $nextNode->cost)
                {
                    $nextNode->bestEdge = $edgeIndex;

                    if (!isset($nextNode->cost))
                    {
                        error_log("found cheaper path to node");
                    }

                    $nextNode->cost = $cost;
                    array_push($nodes, (object)[
                        "index" => $nextNodeIndex,
                        "file" => $graphFile
                    ]);

                    if ($handle)
                    {
                        fwrite($handle, $fromNodeIndex . " -> " . $nextNodeIndex . ";\n");
                    }

                    // For now, until we get an edge cost, use the last edge
                    // traversed
                    // as the best edge.
                    // $node->bestEdge = $edgeIndex;
                }
            }
        }
    }

    $edge->visited = true;

    return $foundEnd;
}

function getOtherGraphInfo ($edge)
{
    $otherFile = translateFileName($edge->file);

    $otherGraph = getGraph($otherFile);

    $id = explode(":", $edge->file)[1];

    for ($otherEdgeIndex = 0; $otherEdgeIndex < count($otherGraph->edges); $otherEdgeIndex++)
    {
        $e = $otherGraph->edges[$otherEdgeIndex];

        if (isset($e->file))
        {
            $parts = explode(":", $e->file);

            error_log("this id: " . $id . " other id: " . $parts[1]);
            if ($parts[1] == $id)
            {
                $otherNodeIndex = $e->nodeIndex;

                break;
            }
        }
    }

    if (!isset($otherNodeIndex))
    {
        error_log("file connector not found: file: " . $otherFile . ", id: " . $id);
    }

    return [
        $otherFile,
        $otherGraph,
        $otherEdgeIndex,
        $otherNodeIndex
    ];
}

function sortComparison ($a, $b)
{
    $aGraph = getGraph($a->file);
    $bGraph = getGraph($b->file);

    if ($aGraph->nodes[$a->index]->cost < $bGraph->nodes[$b->index]->cost)
    {
        return -1;
    }

    if ($aGraph->nodes[$a->index]->cost > $bGraph->nodes[$b->index]->cost)
    {
        return 1;
    }

    return 0;
}

function logTerminusInfo ($terminus)
{
    error_log("\tPoint: " . json_encode($terminus->point));
    error_log("\ttrailName: " . $terminus->trail->name);
    error_log("\ttrailType: " . $terminus->trail->type);
    error_log("\ttrailCN: " . $terminus->trail->cn);
    error_log("\tpathIndex: " . $terminus->pathIndex);
    error_log("\tpointIndex: " . $terminus->pointIndex);
}


function setupInitialNodes ($startResult, $endResult, $graphFile, $graph, &$nodes, &$noNodeAnchors)
{
    global $handle;

    // Find the edge we are starting on and push its connected nodes onto the
    // queue.
    for ($i = 0; $i < count($graph->edges); $i++)
    {
        $edge = $graph->edges[$i];

        if (!isset($edge->file))
        {
            if ($edge->cn == $startResult->trail->cn && $edge->route == $startResult->pathIndex)
            {
                error_log("Start Route Index: " . $startResult->pointIndex);
                error_log("Edge start route index: " . $edge->prev->routeIndex);
                error_log("Edge end route index: " . $edge->next->routeIndex);
            }

            if ($edge->cn == $startResult->trail->cn && $edge->route == $startResult->pathIndex && ($edge->prev->routeIndex <= $startResult->pointIndex) &&
                ($startResult->pointIndex < $edge->next->routeIndex))
            {
                error_log(json_encode($edge));

                // If the end is also on this same edge then we
                // want to push on to the node list the node in the opposite side
                // of the edge from the end point.
                // Otherwise, just push on the tweo nodes on the current edge, if any.
                if ($edge->cn == $endResult->trail->cn && $edge->route == $endResult->pathIndex && ($edge->prev->routeIndex <= $endResult->pointIndex) &&
                    ($endResult->pointIndex < $edge->next->routeIndex))
                {
                    error_log ("Edge is on same edge as start");

                    if ($startResult->pointIndex > $endResult->pointIndex)
                    {
                        if (isset($edge->next->nodeIndex))
                        {
                            $graph->nodes[$edge->next->nodeIndex]->bestEdge = $i;
                            $graph->nodes[$edge->next->nodeIndex]->cost = 0;
                            array_push($nodes, (object)[
                                "index" => $edge->next->nodeIndex,
                                "file" => $graphFile
                            ]);

                            if ($handle)
                            {
                                fwrite($handle, "S -> " . $edge->next->nodeIndex . ";\n");
                            }

                            dump_node($edge->next->nodeIndex, $graph);
                        }
                    }
                    elseif ($startResult->pointIndex < $endResult->pointIndex)
                    {
                        if (isset($edge->prev->nodeIndex))
                        {
                            $graph->nodes[$edge->prev->nodeIndex]->bestEdge = $i;
                            $graph->nodes[$edge->prev->nodeIndex]->cost = 0;
                            array_push($nodes, (object)[
                                "index" => $edge->prev->nodeIndex,
                                "file" => $graphFile
                            ]);

                            if ($handle)
                            {
                                fwrite($handle, "S -> " . $edge->prev->nodeIndex . ";\n");
                            }

                            dump_node($edge->prev->nodeIndex, $graph);
                        }
                    }

                    // These are used if a path is not found by navigating the nodes
                    $noNodeAnchors = [ ];

                    array_push($noNodeAnchors, createAnchor($startResult, "start"));
                    array_push($noNodeAnchors, createAnchor($endResult, "end"));
                }
                else
                {
                    if (isset($edge->prev->nodeIndex))
                    {
                        $graph->nodes[$edge->prev->nodeIndex]->bestEdge = $i;
                        $graph->nodes[$edge->prev->nodeIndex]->cost = 0;
                        array_push($nodes, (object)[
                            "index" => $edge->prev->nodeIndex,
                            "file" => $graphFile
                        ]);

                        if ($handle)
                        {
                            fwrite($handle, "S -> " . $edge->prev->nodeIndex . ";\n");
                        }

                        dump_node($edge->prev->nodeIndex, $graph);
                    }

                    if (isset($edge->next->nodeIndex))
                    {
                        $graph->nodes[$edge->next->nodeIndex]->bestEdge = $i;
                        $graph->nodes[$edge->next->nodeIndex]->cost = 0;
                        array_push($nodes, (object)[
                            "index" => $edge->next->nodeIndex,
                            "file" => $graphFile
                        ]);

                        if ($handle)
                        {
                            fwrite($handle, "S -> " . $edge->next->nodeIndex . ";\n");
                        }

                        dump_node($edge->next->nodeIndex, $graph);
                    }
                }

                $edge->visited = true;

                break;
            }
        }
    }
}


function findPath ($start, $end)
{
    global $handle;
    global $endGraphFile;

    $startResult = Map::getTrailFromPoint($start);

    error_log("Start Information");
    logTerminusInfo($startResult);

    $endResult = Map::getTrailFromPoint($end);

    error_log("End Information");
    logTerminusInfo($endResult);

    $startGraphFile = "trails/" . Map::getTileNameFromPoint($startResult->point) . ".inter.json";
    $endGraphFile = "trails/" . Map::getTileNameFromPoint($endResult->point) . ".inter.json";

    $graphFile = $startGraphFile;
    $graph = getGraph($graphFile);

    if ($handle)
    {
        fwrite($handle, "digraph G {\n");
    }

    $nodes = [ ];

    setupInitialNodes ($startResult, $endResult, $graphFile, $graph, $nodes, $noNodeAnchors);

    if (isset($noNodeAnchors) && count($noNodeAnchors) > 0)
    {
        error_log("No Node Segments: " . json_encode($noNodeAnchors));
    }

    // todo: get cost of trail to first nodes

    $foundEnd = false;

    while (count($nodes) > 0)
    {
        // Sort the nodes from lowest cost to highest cost
        usort($nodes, "App\sortComparison");

        error_log("current node queue:");
        // var_dump($nodes);

        // Pop off a node from the queue
        $nodeIndex = $nodes[0]->index;
        $graphFile = $nodes[0]->file;

        $graph = getGraph($graphFile);

        dump_node($nodeIndex, $graph);

        array_splice($nodes, 0, 1);

        error_log("current node:" . $nodeIndex);

        $node = $graph->nodes[$nodeIndex];

        error_log("node: " . json_encode($node));
        error_log("Best edge: " . $node->bestEdge);

        // For each edge connected to this node...
        foreach ($node->edges as $edgeIndex)
        {
            $edge = $graph->edges[$edgeIndex];

            if (isset($edge->file))
            {
                error_log("edge index: " . $edgeIndex . ", edge file: " . $edge->file);
            }
            else
            {
                error_log("edge index: " . $edgeIndex . ", edge CN: " . $edge->cn);
            }

            if (!isset($edge->visited))
            {
                // var_dump($endResult->trail->cn);
                // var_dump($edge);

                if (isset($edge->file))
                {
                    // Find edge that has matching "file" connection identifier
                    // and get the node index

                    list ($otherFile, $otherGraph, $otherEdgeIndex, $otherNodeIndex) = getOtherGraphInfo($edge);

                    if (isset($otherNodeIndex))
                    {
                        if ($otherNodeIndex >= count($otherGraph->nodes))
                        {
                            error_log("other node index exceeds node array");
                        }

                        $otherNode = $otherGraph->nodes[$otherNodeIndex];
                        $otherNode->cost = $node->cost;

                        error_log("edge: " . json_encode($edge));
                        error_log("Other edge index: " . $otherEdgeIndex);
                        error_log("Other node index: " . $otherNodeIndex);
                        error_log("Other node: " . json_encode($otherNode));

                        $foundEnd = pushNode($otherEdgeIndex, $otherNodeIndex, $otherGraph, $otherFile, $nodes, $endResult);
                    }
                    else
                    {
                        error_log("corresponding node not found in " . $otherFile);
                    }

                    $edge->visited = true;
                }
                else
                {
                    $foundEnd = pushNode($edgeIndex, $nodeIndex, $graph, $graphFile, $nodes, $endResult);
                }
            }

            if ($foundEnd)
            {
                error_log("End found");
                // var_dump($nodes);
                $nodes = [ ];
                break;
            }
        }
    }

    if ($handle)
    {
        if (isset($nodeIndex))
        {
            fwrite($handle, $nodeIndex . " -> E;\n");
        }

        fwrite($handle, "edge [color=red]\n");
    }
    //

    $newAnchors = [ ];

    if ($foundEnd)
    {
        error_log("******** find path backwards ******");

        $anchor = createAnchor ($endResult, "end");
        array_push($newAnchors, $anchor);

        if ($handle && isset($nodeIndex))
        {
            fwrite($handle, $nodeIndex . " -> E;\n");
        }

        if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex == $nodeIndex)
        {
            $nextRouteIndex = $edge->prev->routeIndex;
        }
        elseif (isset($edge->next->nodeIndex) && $edge->next->nodeIndex == $nodeIndex)
        {
            $nextRouteIndex = $edge->next->routeIndex;
        }

        $trailName = $endResult->trail->type . ':' . $endResult->trail->cn . ':' . $endResult->pathIndex;

        while (isset($nodeIndex))
        {
            $node = $graph->nodes[$nodeIndex];
            error_log("node index: " . $nodeIndex);

            if (isset($node->bestEdge))
            {
                $edge = $graph->edges[$node->bestEdge];
                error_log("edge index : " . $node->bestEdge);

                $anchor = (object)[ ];

                $anchor->lat = $node->lat;
                $anchor->lng = $node->lng;

                $anchor->next = (object)[ ];
                $anchor->next->trailName = $trailName;
                $anchor->next->routeIndex = $nextRouteIndex;

                if (isset($edge->file))
                {
                    list ($otherFile, $otherGraph, $otherEdgeIndex, $otherNodeIndex) = getOtherGraphInfo($edge);

                    if (isset($otherNodeIndex))
                    {
                        error_log("other edge: " . json_encode($otherGraph->edges[$otherEdgeIndex]));
                        $graphFile = $otherFile;
                        $graph = $otherGraph;
                        $nodeIndex = $otherNodeIndex;
                        $node = $graph->nodes[$nodeIndex];

                        $edge = $graph->edges[$node->bestEdge];

                        $anchor->next->file = $graph->edges[$otherEdgeIndex]->file;
                    }
                }

                $trailName = $edge->type . ":" . $edge->cn . ":" . $edge->route;

                error_log("trail name: " . $trailName);
                error_log("edge: " . json_encode($edge));

                $anchor->prev = (object)[ ];
                $anchor->prev->trailName = $trailName;

                if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex == $nodeIndex)
                {
                    if ($handle)
                    {
                        fwrite($handle, $edge->next->nodeIndex . " -> " . $nodeIndex . ";\n");
                    }

                    $anchor->prev->routeIndex = $edge->prev->routeIndex;
                    $nodeIndex = $edge->next->nodeIndex;
                    $nextRouteIndex = $edge->next->routeIndex;
                }
                elseif (isset($edge->next->nodeIndex) && $edge->next->nodeIndex == $nodeIndex)
                {
                    if ($handle)
                    {
                        fwrite($handle, $edge->prev->nodeIndex . " -> " . $nodeIndex . ";\n");
                    }

                    $anchor->prev->routeIndex = $edge->next->routeIndex;
                    $nodeIndex = $edge->prev->nodeIndex;
                    $nextRouteIndex = $edge->prev->routeIndex;
                }
                else
                {
                    error_log("**** no previous or next ****");

                    unset($nodeIndex);
                }

                // error_log("startGraphFile: " . $startGraphFile . ", startCN:
                // " . $startResult->trail->cn . ", startRoute: " .
                // $startResult->pathIndex);
                // error_log("graphFile: " . $graphFile . ", edge CN: " .
                // $edge->cn . ", edge route: " . $edge->route);

                // Are we back at the start? If so, unset the node index so that
                // we can exit the loop.
                if ($graphFile == $startGraphFile && $edge->cn == $startResult->trail->cn && $edge->route == $startResult->pathIndex &&
                    ($startResult->pointIndex >= $edge->prev->routeIndex && $startResult->pointIndex <= $edge->next->routeIndex))
                {
                    error_log("Found start: startRoute: " . $startResult->pathIndex);
                    unset($nodeIndex);
                }
            }
            else
            {
                error_log("**** no best edge ****");

                unset($nodeIndex);
            }

            error_log(json_encode($anchor));

            addNewAnchor($newAnchors, $anchor);
        }

        $anchor = createAnchor ($startResult, "start");
        addNewAnchor($newAnchors, $anchor);

        // error_log(json_encode($newAnchors));
    }
    elseif (isset($noNodeAnchors))
    {
        error_log ("Using no node anchors\n");
        $newAnchors = $noNodeAnchors;
    }

    if ($handle)
    {
        fwrite($handle, "}\n");
        fclose($handle);
    }

    return $newAnchors;
}
