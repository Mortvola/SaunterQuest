<?php
namespace App;
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


function dumpBestEdgeNodes ($graph)
{
    static $deadEndCount = 0;

    $handle = fopen("graph.dot", "wb");

    if ($handle)
    {
        fwrite($handle, "graph G {\n");

        $nodes = $graph->nodes;

        for ($i = 0; $i < count($nodes); $i++)
        {
            $node = $nodes[$i];

            if (isset($node->bestEdge))
            {
                $edge = $graph->edges[$node->bestEdge];

                if (isset($edge->file))
                {
                    fwrite($handle, "n" . $edge->nodeIndex . " -- " . $edge->file . " [ " . $attributes . "];\n");
                }
                else
                {
                    //$label = "label = \"" . $edge->cn . ":" . $edge->pathIndex . "\"";
                    $label = "label=\"" . $edge->cost . "\"";
                    $attributes = "";

                    if (isset($edge->prev->nodeIndex) && isset($edge->next->nodeIndex))
                    {
                        fwrite($handle, "n" . $edge->prev->nodeIndex . " -- n" . $edge->next->nodeIndex . " [ " . $label . $attributes . "];\n");
                    }
                    elseif (isset($edge->prev->nodeIndex))
                    {
                        $deadEndCount++;
                        fwrite($handle, "n" . $edge->prev->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $attributes . "];\n");
                    }
                    elseif (isset($edge->next->nodeIndex))
                    {
                        $deadEndCount++;
                        fwrite($handle, "n" . $edge->next->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $attributes . "];\n");
                    }
                }
            }

            if (isset($node->type))
            {
                if ($node->type == "start")
                {
                    fwrite($handle, "n" . $i . " [ label=\"" . $node->cost . "\", color=green, penwidth=5 ];\n");
                }
                else
                {
                    fwrite($handle, "n" . $i . " [ label=\"" . $node->cost . "\", color=red, penwidth=5 ];\n");
                }
            }
            else if (isset ($node->cost))
            {
                if (isset ($node->prior))
                {
                    fwrite ($handle, "n" . $i . " [ label=\"" . $node->cost . "\", color=red ];\n");
                }
                else
                {
                    fwrite ($handle, "n" . $i . " [ label=\"" . $node->cost . "\"];\n");
                }
            }
        }

        fwrite($handle, "}\n");

        fclose ($handle);
    }
}


function addNewAnchor (&$newAnchors, $anchor)
{
    if (count($newAnchors) == 0)
    {
        $newAnchors[] = $anchor;
    }
    else if ($anchor->lat != $newAnchors[0]->lat || $anchor->lng != $newAnchors[0]->lng)
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
                $anchor->next->trailName == $newAnchors[1]->prev->trailName && (($anchor->next->pointIndex > $newAnchors[0]->prev->pointIndex &&
                    $newAnchors[0]->next->pointIndex > $newAnchors[1]->prev->pointIndex) ||
                    ($anchor->next->pointIndex < $newAnchors[0]->prev->pointIndex && $newAnchors[0]->next->pointIndex < $newAnchors[1]->prev->pointIndex)))
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
//        error_log("no matching previous or next");
    }
}

function pushNode ($edgeIndex, $fromNodeIndex, $bestCost, $graph, $graphFile, &$nodes)
{
    $foundEnd = false;
    $cost = null;

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
        $nextNodeIndex = getOtherNodeIndex($edge, $fromNodeIndex);

        if (isset($nextNodeIndex))
        {
            $nextNode = $graph->nodes[$nextNodeIndex];

            // We carry the costs forward. The cost is the cost
            // to get to the previous node (the node's cost) and
            // the cost of this edge.
            $cost = $edge->cost;

            if (isset ($node->cost))
            {
                $cost += $node->cost;
            }

            if (($bestCost == null || $cost < $bestCost) &&
                (!isset($nextNode->cost) || $cost < $nextNode->cost))
            {
                // The cost to get to the next node on this edge
                // is less than the previously "best edge". Set
                // the "best edge" to this edge and push the node
                // onto the queue.
                $nextNode->bestEdge = $edgeIndex;

                $nextNode->cost = $cost;

                if (isset($nextNode->type) && $nextNode->type == "end")
                {
                    $node->prior = true;
                    $foundEnd = true;
                }
                else
                {
                    array_push($nodes, (object)[
                        "index" => $nextNodeIndex,
                        "file" => $graphFile
                    ]);
                }
            }
            else if (isset($nextNode->type) && $nextNode->type == "end")
            {
                $node->prior = true;
            }
        }
    }

    $edge->visited = true;

    return [$foundEnd, $cost];
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


function substituteEdgeIndex ($node, $oldIndex, $newIndex)
{
    for ($j = 0; $j < count ($node->edges); $j++)
    {
        if ($node->edges[$j] == $oldIndex)
        {
            $node->edges[$j] = $newIndex;

            break;
        }
    }
}


function computeCost ($startPointIndex, $endPointIndex, $points)
{
    $cost = 0;

    for ($p = $startPointIndex; $p < $endPointIndex; $p++)
    {
        $dx = haversineGreatCircleDistance($points[$p]->lat, $points[$p]->lng, $points[$p + 1]->lat, $points[$p + 1]->lng);

        if ($dx != 0)
        {
            $ele1 = getElevation($points[$p]->lat, $points[$p]->lng);
            $ele2 = getElevation($points[$p + 1]->lat, $points[$p + 1]->lng);

            $dh = $ele2 - $ele1;

            $cost += $dx / metersPerHourGet($dh, $dx);
        }
    }

    return $cost;
}


function insertNode ($point, $pointIndex, $edgeIndex, $cost1, $cost2, $graph)
{
    $edge = $graph->edges[$edgeIndex];

    $newNode = (object)[
        "lat" => $point->lat,
        "lng" => $point->lng,
        "edges" => [count($graph->edges), count($graph->edges) + 1]
    ];

    $edge1 = (object)[
        "type" => $edge->type,
        "cn" => $edge->cn,
        "pathIndex" => $edge->pathIndex,
        "cost" => $cost1,
        "prev" => (object)[
            "nodeIndex" => $edge->prev->nodeIndex,
            "pointIndex" => $edge->prev->pointIndex
        ],
        "next" => (object)[
            "nodeIndex" => count($graph->nodes),
            "pointIndex" => $pointIndex
        ],
    ];

    $edge2 = (object)[
        "type" => $edge->type,
        "cn" => $edge->cn,
        "pathIndex" => $edge->pathIndex,
        "cost" => $cost2,
        "prev" => (object)[
            "nodeIndex" => count($graph->nodes),
            "pointIndex" => $pointIndex
        ],
        "next" => (object)[
            "nodeIndex" => $edge->next->nodeIndex,
            "pointIndex" => $edge->next->pointIndex
        ],
    ];

    substituteEdgeIndex ($graph->nodes[$edge->prev->nodeIndex], $edgeIndex, count($graph->edges));
    substituteEdgeIndex ($graph->nodes[$edge->next->nodeIndex], $edgeIndex, count($graph->edges) + 1);

    array_push($graph->nodes, $newNode);
    array_push($graph->edges, $edge1);
    array_push($graph->edges, $edge2);

    return count($graph->nodes) - 1; // Return the new node index
}


function setupTerminusNode ($terminus, $type, $graphFile)
{
    global $handle;

    $graph = getGraph($graphFile);

    // Find the edge the terminus is on and split, inserting a new node
    // into the node list and two edges.
    for ($edgeIndex = 0; $edgeIndex < count($graph->edges); $edgeIndex++)
    {
        $edge = $graph->edges[$edgeIndex];

        if (!isset($edge->file))
        {
            if ($edge->cn == $terminus->trail->cn && $edge->pathIndex == $terminus->pathIndex &&
                $edge->prev->pointIndex <= $terminus->pointIndex && $terminus->pointIndex < $edge->next->pointIndex)
            {
                // Found the start edge. Insert a node and add two edges to replace the current edge.

                $cost1 = computeCost ($edge->prev->pointIndex, $terminus->pointIndex, $terminus->trail->routes[$terminus->pathIndex]->route);
                $cost2 = computeCost ($terminus->pointIndex, $edge->next->pointIndex, $terminus->trail->routes[$terminus->pathIndex]->route);

                $newNodeIndex = insertNode ($terminus->point, $terminus->pointIndex, $edgeIndex, $cost1, $cost2, $graph);

                $graph->nodes[$newNodeIndex]->type = $type;

                if ($graph->nodes[$newNodeIndex]->type == "start")
                {
                    $graph->nodes[$newNodeIndex]->cost = 0;
                }

                return $newNodeIndex;
            }
        }
    }
}


function findRoute ($startNodeIndex, $startGraphFile)
{
    global $handle;

    $foundEnd = false;
    $bestCost = null;

    $nodes = [];

    array_push($nodes, (object)[
        "index" => $startNodeIndex,
        "file" => $startGraphFile
    ]);

    while (count($nodes) > 0)
    {
        // Sort the nodes from lowest cost to highest cost
        usort($nodes, "App\sortComparison");

//         error_log("current node queue:");
//         var_dump($nodes);

        // Pop off a node from the queue
        $nodeIndex = $nodes[0]->index;
        $graphFile = $nodes[0]->file;

        $graph = getGraph($graphFile);

//        dump_node($nodeIndex, $graph);

        array_splice($nodes, 0, 1);

//        error_log("current node:" . $nodeIndex);

        $node = $graph->nodes[$nodeIndex];

//         error_log("node: " . json_encode($node));
//         error_log("Best edge: " . $node->bestEdge);

        // For each edge connected to this node...
        foreach ($node->edges as $edgeIndex)
        {
            $edge = $graph->edges[$edgeIndex];

//             if (isset($edge->file))
//             {
//                 error_log("edge index: " . $edgeIndex . ", edge file: " . $edge->file);
//             }
//             else
//             {
//                 error_log("edge index: " . $edgeIndex . ", edge CN: " . $edge->cn);
//             }

//            if (!isset($edge->visited))
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

                        list ($foundEnd, $cost) = pushNode($otherEdgeIndex, $otherNodeIndex, $bestCost, $otherGraph, $otherFile, $nodes);

                        if ($foundEnd)
                        {
                            if ($bestCost == null)
                            {
                                $bestCost = $cost;
                            }
                            else if ($cost < $bestCost)
                            {
                                $bestCost = $cost;
                            }
                        }
                    }
                    else
                    {
                        error_log("corresponding node not found in " . $otherFile);
                    }

                    $edge->visited = true;
                }
                else
                {
                    list ($foundEnd, $cost) = pushNode($edgeIndex, $nodeIndex, $bestCost, $graph, $graphFile, $nodes);

                    if ($foundEnd)
                    {
                        if (!isset($bestCost))
                        {
                            $bestCost = $cost;
                        }
                        else if ($cost < $bestCost)
                        {
                            $bestCost = $cost;
                        }
                    }
                }
            }

//             if ($foundEnd)
//             {
//                 error_log("End found");
//                 // var_dump($nodes);
//                 $nodes = [ ];
//                 break;
//             }
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

    if ($handle)
    {
        fwrite($handle, "digraph G {\n");
    }

    $startNodeIndex = setupTerminusNode ($startResult, "start", $startGraphFile);
    $endNodeIndex = setupTerminusNode ($endResult, "end", $endGraphFile);

    findRoute ($startNodeIndex, $startGraphFile);

    $newAnchors = [ ];

//    if ($foundEnd)
    {
        error_log("******** find path backwards ******");

        $graph = getGraph($endGraphFile);
        $nodeIndex = $endNodeIndex;

//        dumpBestEdgeNodes ($graph);

        while (isset($nodeIndex))
        {
            $node = $graph->nodes[$nodeIndex];
            error_log("node index: " . $nodeIndex);

            $anchor = (object)[ ];

            $anchor->lat = $node->lat;
            $anchor->lng = $node->lng;

            if (isset($prevEdge))
            {
                $anchor->next = (object)[ ];
                $anchor->next->trailName = $prevEdge->type . ":" . $prevEdge->cn . ":" . $prevEdge->pathIndex;

                if (isset($prevEdge->prev->nodeIndex) && $prevEdge->prev->nodeIndex == $nodeIndex)
                {
                    $anchor->next->pointIndex = $prevEdge->prev->pointIndex;
                }
                elseif (isset($prevEdge->next->nodeIndex) && $prevEdge->next->nodeIndex == $nodeIndex)
                {
                    $anchor->next->pointIndex = $prevEdge->next->pointIndex;
                }
            }
            else
            {
                $anchor->type = "end";
            }

            if (isset($node->bestEdge))
            {
                $edge = $graph->edges[$node->bestEdge];
                error_log("edge index : " . $node->bestEdge);

//                 if (isset($edge->file))
//                 {
//                     list ($otherFile, $otherGraph, $otherEdgeIndex, $otherNodeIndex) = getOtherGraphInfo($edge);

//                     if (isset($otherNodeIndex))
//                     {
//                         error_log("other edge: " . json_encode($otherGraph->edges[$otherEdgeIndex]));
//                         $graphFile = $otherFile;
//                         $graph = $otherGraph;
//                         $nodeIndex = $otherNodeIndex;
//                         $node = $graph->nodes[$nodeIndex];

//                         $edge = $graph->edges[$node->bestEdge];

//                         $anchor->next->file = $graph->edges[$otherEdgeIndex]->file;
//                     }
//                 }

//                 error_log("trail name: " . $trailName);
//                 error_log("edge: " . json_encode($edge));

                $anchor->prev = (object)[ ];
                $anchor->prev->trailName = $edge->type . ":" . $edge->cn . ":" . $edge->pathIndex;

                if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex == $nodeIndex)
                {
                    $anchor->prev->pointIndex = $edge->prev->pointIndex;
                    $nodeIndex = $edge->next->nodeIndex;
                }
                elseif (isset($edge->next->nodeIndex) && $edge->next->nodeIndex == $nodeIndex)
                {
                    $anchor->prev->pointIndex = $edge->next->pointIndex;
                    $nodeIndex = $edge->prev->nodeIndex;
                }
                else
                {
                    error_log("**** no previous or next ****");
                }

                $prevEdge = $edge;
            }
            else
            {
                // No best edge from this node? Are we at the start node?
                unset($nodeIndex);

                error_log ("reached last node");

                if ($node->type == "start")
                {
                    $anchor->type = "start";
                }
                else
                {
                    error_log ("Not at the start node");
                }
            }

            error_log(json_encode($anchor));

            addNewAnchor($newAnchors, $anchor);
        }

        // If we have less than two anchors or if the start
        // and end anchors were not tagged correctly then
        // assume there was an error and clear out all anchors.
        if (count($newAnchors) < 2 ||
            ($newAnchors[0]->type != "start" && $newAnchors[count($newAnchors) - 1]->type != "end"))
        {
            $newAnchors = [];
        }
    }

    if ($handle)
    {
        fwrite($handle, "}\n");
        fclose($handle);
    }

    return $newAnchors;
}
