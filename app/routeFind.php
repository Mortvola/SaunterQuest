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
        error_log("---------------");
    }
}


function dumpBestEdgeNodes ($graph)
{
    global $fileGraphMap;
    static $deadEndCount = 0;

    $handle = fopen("graph.dot", "wb");

    if ($handle)
    {
        fwrite($handle, "graph G {\n");

        foreach ($fileGraphMap as $tile => $graph)
        {
            $nodes = $graph->nodes;

            for ($i = 0; $i < count($nodes); $i++)
            {
                $node = $nodes[$i];

                if (isset($node->bestEdge))
                {
                    $edge = $graph->edges[$node->bestEdge];

                    $label = "label = \"" . $edge->cn . ":" . $edge->pathIndex . "\"";
                    //$label = "label=\"" . $edge->forwardCost . "\"";
                    $attributes = "";

                    if (isset($edge->prev->nodeIndex))
                    {
                        $startNodeName = '"' . $tile . ":" . $edge->prev->nodeIndex . '"';
                    }

                    if (isset($edge->next->nodeIndex))
                    {
                        $endNodeName = '"' . $tile . ":" . $edge->next->nodeIndex . '"';
                    }

                    if (isset($edge->prev->nodeIndex) && isset($edge->next->nodeIndex))
                    {
                        fwrite($handle, $startNodeName . " -- " . $endNodeName . " [ " . $label . $attributes . "];\n");
                    }
                    elseif (isset($edge->prev->nodeIndex))
                    {
                        $deadEndCount++;
                        fwrite($handle, $startNodeName . " -- DE" . $deadEndCount . " [ " . $label . $attributes . "];\n");
                    }
                    elseif (isset($edge->next->nodeIndex))
                    {
                        $deadEndCount++;
                        fwrite($handle, $endNodeName . " -- DE" . $deadEndCount . " [ " . $label . $attributes . "];\n");
                    }
                }

                $nodeName = '"' . $tile . ":" . $i . '"';

                if (isset($node->type))
                {

                    if ($node->type == "start")
                    {
                        fwrite($handle, $nodeName . " [color=green, penwidth=5 ];\n");
                    }
                    elseif (isset($node->fileConnection))
                    {

                        fwrite($handle, $nodeName . " [color=blue];\n");
                    }
                    else
                    {
                        fwrite($handle, $nodeName . " [color=red, penwidth=5 ];\n");
                    }
                }
                elseif (isset ($node->cost))
                {
                    if (isset ($node->prior))
                    {
                        fwrite ($handle, $nodeName . " [color=red ];\n");
                    }
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
    elseif ($anchor->lat != $newAnchors[0]->lat || $anchor->lng != $newAnchors[0]->lng)
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
        $fileGraphMap[$fileName] = json_decode(file_get_contents(base_path("trails/" . $fileName . ".inter.json")));
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

function traverseEdge ($edgeIndex, $fromNodeIndex, $bestCost, $graph, $graphFile, &$nodes)
{
    $foundEnd = false;
    $cost = null;

    $prevNode = $graph->nodes[$fromNodeIndex];
    $edge = $graph->edges[$edgeIndex];

    if (!isset($edge))
    {
        error_log("edge index: " . $edgeIndex);
        error_log("number of edges: " . count($graph->edges));
    }

    $nextNodeIndex = getOtherNodeIndex($edge, $fromNodeIndex);

    if (isset($nextNodeIndex))
    {
        $nextNode = $graph->nodes[$nextNodeIndex];

        // We carry the costs forward. The cost is the cost
        // to get to the previous node (the node's cost) and
        // the cost of this edge.
        if ($edge->prev->nodeIndex == $fromNodeIndex)
        {
            $cost = $edge->forwardCost;
        }
        else
        {
            $cost = $edge->backwardCost;
        }

        if (isset ($prevNode->cost))
        {
            $cost += $prevNode->cost;
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
                error_log("Found end");
                $prevNode->prior = true;
                $foundEnd = true;
            }
            else
            {
                if (isset($nextNode->fileConnection))
                {
                    error_log ("Looking for connections");

                    $otherGraphInfo = getOtherGraphInfo ($nextNode);

                    foreach ($otherGraphInfo as $graphInfo)
                    {
                        $graphInfo->graph->nodes[$graphInfo->nodeIndex]->cost = $cost;
                        $graphInfo->graph->nodes[$graphInfo->nodeIndex]->bestEdge = $edgeIndex;

                        error_log ("traversing file boundary: file: " . $graphInfo->file . ", node index: " . $graphInfo->nodeIndex);

                        array_push($nodes, (object)[
                            "index" => $graphInfo->nodeIndex,
                            "file" => $graphInfo->file
                        ]);
                    }
                }
                else
                {
                    array_push($nodes, (object)[
                        "index" => $nextNodeIndex,
                        "file" => $graphFile
                    ]);
                }
            }
        }
        elseif (isset($nextNode->type) && $nextNode->type == "end")
        {
            error_log("Found end");
            $prevNode->prior = true;
        }
    }

    $edge->visited = true;

    return [$foundEnd, $cost];
}

function getOtherGraphInfo ($node)
{
    $graphInfo = [];

//     foreach ($node->fileConnections as $fileConnection)
     {
        $otherGraph = getGraph($node->fileConnection->file);

        for ($otherNodeIndex = 0; $otherNodeIndex < count($otherGraph->nodes); $otherNodeIndex++)
        {
            $otherNode = $otherGraph->nodes[$otherNodeIndex];

            if (isset($otherNode->fileConnection))
            {
//                foreach ($otherNode->fileConnections as $otherFileConnection)
                {
                    if ($otherNode->fileConnection->id == $node->fileConnection->id)
                    {
//                        error_log("this id: " . $fileConnection->id . " other id: " . $otherFileConnection->id);
                        break;
                    }
                }

//                 if ($otherFileConnection->id == $fileConnection->id)
//                 {
//                     break;
//                 }
            }
        }

        if ($otherNodeIndex >= count($otherGraph->nodes))
        {
            throw new \Exception("file connector not found: file: " . $node->fileConnection->file . ", id: " . $node->fileConnection->id);
        }

        $graphInfo[] = (object)["file" => $node->fileConnection->file, "graph" => $otherGraph, "nodeIndex" => $otherNodeIndex];
    }

    return $graphInfo;
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
    $forwardCost = 0;
    $backwardCost = 0;

    for ($p = $startPointIndex; $p < $endPointIndex; $p++)
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

    return [$forwardCost, $backwardCost];
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
        "forwardCost" => $cost1[0],
        "backwardCost" => $cost1[1],
        "prev" => (object)[
            "pointIndex" => $edge->prev->pointIndex
        ],
        "next" => (object)[
            "nodeIndex" => count($graph->nodes),
            "pointIndex" => $pointIndex
        ],
    ];

    if (isset($edge->prev->nodeIndex))
    {
        $edge1->prev->nodeIndex = $edge->prev->nodeIndex;
        substituteEdgeIndex ($graph->nodes[$edge->prev->nodeIndex], $edgeIndex, count($graph->edges));
    }

    $edge2 = (object)[
        "type" => $edge->type,
        "cn" => $edge->cn,
        "pathIndex" => $edge->pathIndex,
        "forwardCost" => $cost2[0],
        "backwardCost" => $cost2[1],
        "prev" => (object)[
            "nodeIndex" => count($graph->nodes),
            "pointIndex" => $pointIndex
        ],
        "next" => (object)[
            "pointIndex" => $edge->next->pointIndex
        ],
    ];

    if (isset($edge->next->nodeIndex))
    {
        $edge2->next->nodeIndex = $edge->next->nodeIndex;
        substituteEdgeIndex ($graph->nodes[$edge->next->nodeIndex], $edgeIndex, count($graph->edges) + 1);
    }

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

        if (!isset($edge->split))
        {
            if ($edge->cn == $terminus->trail->cn && $edge->pathIndex == $terminus->pathIndex &&
                $edge->prev->pointIndex <= $terminus->pointIndex && $terminus->pointIndex < $edge->next->pointIndex)
            {
                // Found the start edge. Insert a node and add two edges to replace the current edge.

                $cost1 = computeCost ($edge->prev->pointIndex, $terminus->pointIndex, $terminus->trail->paths[$terminus->pathIndex]->points);
                $cost2 = computeCost ($terminus->pointIndex, $edge->next->pointIndex, $terminus->trail->paths[$terminus->pathIndex]->points);

                $newNodeIndex = insertNode ($terminus->point, $terminus->pointIndex, $edgeIndex, $cost1, $cost2, $graph);

                $edge->split = true;

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


function findRoute ($startNodeIndex, $startTile)
{
    global $handle;

    $foundEnd = false;
    $bestCost = null;

    $nodes = [];

    array_push($nodes, (object)[
        "index" => $startNodeIndex,
        "file" => $startTile
    ]);

    while (count($nodes) > 0)
    {
        // Sort the nodes from lowest cost to highest cost
        usort($nodes, "App\sortComparison");

        error_log ("Node queue:");
        foreach ($nodes as $node)
        {
            $graph = getGraph($node->file);

            $logMessage = "index: " . $node->index . ", tile: " . $node->file;

            if (isset($graph->nodes[$node->index]->fileConnection))
            {
                $logMessage .= ", fileConnection";
            }

            error_log ($logMessage);
        }
        error_log ("End of Node queue");

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

            list ($foundEnd, $cost) = traverseEdge($edgeIndex, $nodeIndex, $bestCost, $graph, $graphFile, $nodes);

            if ($foundEnd)
            {
                if (!isset($bestCost))
                {
                    $bestCost = $cost;
                }
                elseif ($cost < $bestCost)
                {
                    $bestCost = $cost;
                }
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
}


function findPath ($start, $end)
{
    global $handle;

    $startResult = Map::getTrailFromPoint($start);

    error_log("Start Information");
    logTerminusInfo($startResult);

    $endResult = Map::getTrailFromPoint($end);

    error_log("End Information");
    logTerminusInfo($endResult);

    $startTile = Map::getTileNameFromPoint($startResult->point);
    $endTile = Map::getTileNameFromPoint($endResult->point);

    $startNodeIndex = setupTerminusNode ($startResult, "start", $startTile);
    $endNodeIndex = setupTerminusNode ($endResult, "end", $endTile);

    error_log ("Starting tile: " . $startTile);

    findRoute ($startNodeIndex, $startTile);

    $newAnchors = [ ];

//    if ($foundEnd)
    {
        error_log("******** find path backwards ******");

        $graph = getGraph($endTile);
        $nodeIndex = $endNodeIndex;

        $file = $endTile;

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
                // Add the information to get to the next node
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

            if (isset($node->fileConnection))
            {
                // Find the connection with the best edge.
                $otherGraphInfo = getOtherGraphInfo ($node);

                unset ($bestEdgeNodeIndex);

                foreach ($otherGraphInfo as $graphInfo)
                {
                    if (isset($graphInfo->graph->nodes[$graphInfo->nodeIndex]->bestEdge))
                    {
                        if (!isset($bestEdgeNodeIndex))
                        {
                            $bestEdgeNodeIndex = $graphInfo->nodeIndex;
                            $bestEdgeNodeGraph = $graphInfo->graph;
                            $bestEdgeFile = $graphInfo->file;
                        }
                        else if ($bestEdgeNodeIndex != $graphInfo->nodeIndex && $bestEdgeFile != $graphInfo->file)
                        {
                            throw new \Exception("file connections with multiple best edges");
                        }
                    }
                }

                if (isset($bestEdgeNodeIndex))
                {
                    $anchor->next->file = $file;
                    $nodeIndex = $bestEdgeNodeIndex;
                    $graph = $bestEdgeNodeGraph;
                    $node = $graph->nodes[$bestEdgeNodeIndex];
                    $file = $bestEdgeFile;
                    error_log("node index: " . $nodeIndex);
                }
                else
                {
                    error_log ("file connection with no best edge");
                }
            }

            if (isset($node->bestEdge))
            {
                $edge = $graph->edges[$node->bestEdge];
                error_log("edge index : " . $node->bestEdge);

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

    return $newAnchors;
}
