<?php
namespace App;
require_once "utilities.php";


function dumpEdges ($graph)
{
    $handle = fopen("edgegraph.dot", "wb");

    if ($handle)
    {
        fwrite($handle, "graph G {\n");

        foreach ($graph->edges as $edgeIndex => $edge)
        {
            unset($edge->drawn);

            $label = "label = \"" . $edgeIndex . ":" . $edge->line_id . "\"";
            //$label = "label=\"" . $edge->forward_cost . "\"";

            drawEdge ($handle, $edge, $label);
/*
            $nodeName = '"' . $nodeIndex . '"';

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
            */
        }

        $attributes = "style=dashed";

        foreach ($graph->splits as $edgeIndex => $edge)
        {
            $label = "label = \"" . $edgeIndex . ":" . $edge->line_id . "\"";
            //$label = "label=\"" . $edge->forward_cost . "\"";

            if (isset($edge->start_node))
            {
                $startNodeName = '"' . $edge->start_node . '"';
            }

            if (isset($edge->end_node))
            {
                $endNodeName = '"' . $edge->end_node . '"';
            }

            if (isset($edge->start_node) && isset($edge->end_node))
            {
                fwrite($handle, $startNodeName . " -- " . $endNodeName . " [ " . $label . " " . $attributes . "];\n");
            }
            elseif (isset($edge->start_node))
            {
                $deadEndCount++;
                fwrite($handle, $startNodeName . " -- DE" . $deadEndCount . " [ " . $label . " " . $attributes . "];\n");
            }
            elseif (isset($edge->end_node))
            {
                $deadEndCount++;
                fwrite($handle, $endNodeName . " -- DE" . $deadEndCount . " [ " . $label . " " . $attributes . "];\n");
            }
        }

        fwrite($handle, "start [color=green, penwidth=5 ];\n");
        fwrite($handle, "end [color=red, penwidth=5 ];\n");

        fwrite($handle, "}\n");

        fclose ($handle);

        system ("dot -Tsvg edgegraph.dot > edgegraph.svg");
    }
}


function drawEdge ($handle, $edge, $label)
{
    static $deadEndCount = 0;

    if (!isset($edge->drawn))
    {
        $attributes = "";

        if (isset($edge->selectedEdge))
        {
            $attributes = "color=blue penwidth=5";
        }
        elseif (isset($edge->tooCostly))
        {
            $attributes = "color=red penwidth=5";
        }

        if (isset($edge->start_node))
        {
            $startNodeName = '"' . $edge->start_node . '"';
        }

        if (isset($edge->end_node))
        {
            $endNodeName = '"' . $edge->end_node . '"';
        }

        if (isset($edge->start_node) && isset($edge->end_node))
        {
            fwrite($handle, $startNodeName . " -- " . $endNodeName . " [ " . $label . " " . $attributes . "];\n");
        }
        elseif (isset($edge->start_node))
        {
            $deadEndCount++;
            fwrite($handle, $startNodeName . " -- DE" . $deadEndCount . " [ " . $label . " " . $attributes . "];\n");
        }
        elseif (isset($edge->end_node))
        {
            $deadEndCount++;
            fwrite($handle, $endNodeName . " -- DE" . $deadEndCount . " [ " . $label . " " . $attributes . "];\n");
        }

        $edge->drawn = true;
    }
}


function dumpBestEdgeNodes ($graph)
{
    static $deadEndCount = 0;

    $handle = fopen("graph.dot", "wb");

    if ($handle)
    {
        foreach ($graph->edges as $edge)
        {
            unset($edge->drawn);
        }

        fwrite($handle, "graph G {\n");

        $nodes = $graph->nodes;

        foreach ($nodes as $nodeIndex => $node)
        {
            if (isset($node->bestEdge))
            {
                $edge = $graph->edges[$node->bestEdge];

                $label = "label = \"" . $node->bestEdge . ":" . $edge->line_id . "\"";
                //$label = "label=\"" . $edge->forward_cost . "\"";

                drawEdge ($handle, $edge, $label);
            }


            foreach ($node->edges as $edgeIndex)
            {
                if (isset($graph->edges[$edgeIndex]) && isset($graph->edges[$edgeIndex]->tooCostly))
                {
                    $label = "label = \"" . $edgeIndex . ":" . $graph->edges[$edgeIndex]->line_id . "\"";

                    drawEdge ($handle, $graph->edges[$edgeIndex], $label);
                }
            }

            $nodeName = '"' . $nodeIndex . '"';

            if (isset($node->type))
            {
                if ($node->type == "start")
                {
                    fwrite($handle, $nodeName . " [color=green, penwidth=5 ];\n");
                }
                else
                {
                    fwrite($handle, $nodeName . " [color=red, penwidth=5 ];\n");
                }
            }
            elseif (isset ($node->cost))
            {
                fwrite ($handle, $nodeName . " [ label=\"" . $nodeIndex . "\n" . $node->cost . "\" ];\n");
            }
        }

        fwrite($handle, "}\n");

        fclose ($handle);

        system ("dot -Tsvg graph.dot > graph.svg");
    }
}


function addNewAnchor (&$newAnchors, $anchor)
{
    if (count($newAnchors) == 0)
    {
        $newAnchors[] = $anchor;
//        error_log(json_encode($newAnchors));
    }
    elseif ($anchor->point->lat != $newAnchors[0]->point->lat || $anchor->point->lng != $newAnchors[0]->point->lng)
    {
        if (count($newAnchors) >= 1 && $anchor->next->edge_id != $newAnchors[0]->prev->edge_id)
        {
            error_log("next and previous trails don't match: next: " . $anchor->next->edge_id . ", prev: " . $newAnchors[0]->prev->edge_id);
            error_log(json_encode($anchor));
        }

        // Determine if we should replace the previously pushed anchor
        // or add a new one. If the anchor at position 0 is between
        // the new one and the one at position 1, then we can just replace
        // the one at position 0.
        if (count($newAnchors) > 1 && !isset($newAnchors[0]->next->file) && $anchor->next->edge_id == $newAnchors[0]->prev->edge_id &&
            $anchor->next->edge_id == $newAnchors[1]->prev->edge_id && (($anchor->next->fraction > $newAnchors[0]->prev->fraction &&
                $newAnchors[0]->next->fraction > $newAnchors[1]->prev->fraction) ||
                ($anchor->next->fraction < $newAnchors[0]->prev->fraction && $newAnchors[0]->next->fraction < $newAnchors[1]->prev->fraction)))
        {
//             error_log("Replacing " . json_encode($newAnchors[0]));
//             error_log("with " . json_encode($anchor));

            $newAnchors[0] = $anchor;
//            error_log(json_encode($newAnchors));
        }
        else
        {
            // Push the anchor onto the front of the array
            array_splice($newAnchors, 0, 0, array (
                $anchor
            ));
//             error_log(json_encode($newAnchors));
        }
    }
}


function getOtherNodeIndex ($edge, $nodeIndex)
{
    if (isset($edge->start_node) && $edge->start_node != $nodeIndex)
    {
        return $edge->start_node;
    }

    if (isset($edge->end_node) && $edge->end_node != $nodeIndex)
    {
        return $edge->end_node;
    }
}


function getCostToNode ($prevNodeIndex, $nextNodeIndex, $edge, $graph)
{
    $prevNode = $graph->nodes[$prevNodeIndex];
    $nextNode = $graph->nodes[$nextNodeIndex];

    if ($edge->start_node == $prevNodeIndex)
    {
        $cost = $edge->forward_cost;
    }
    else
    {
        $cost = $edge->backward_cost;
    }

    if ($cost <= 0)
    {
        exit;
    }

//    if (isset ($prevNode->cost))
    {
        if ($prevNode->cost < 0)
        {
            error_log ($prevNode->cost);

            exit;
        }
        $cost += $prevNode->cost;
    }

    return $cost;
}


function traverseEdge ($edgeIndex, $prevNodeIndex, $graph, $endType)
{
    $cost = null;
    $nextNodeIndex = null;
    $foundEnd = false;
    $foundBetterPath = false;

//    error_log ("traversing edge " . $edgeIndex . " from " . $prevNodeIndex);

    $prevNode = $graph->nodes[$prevNodeIndex];

    if (!isset($prevNode->bestEdge) || $prevNode->bestEdge != $edgeIndex)
    {
        $edge = $graph->edges[$edgeIndex];

        $nextNodeIndex = getOtherNodeIndex($edge, $prevNodeIndex);

        if (isset($nextNodeIndex))
        {
            Graph::loadNode ($nextNodeIndex, $edgeIndex, $graph, $endType);

            if (isset($graph->nodes[$nextNodeIndex]))
            {
                // Carry the costs forward. The cost is the cost
                // to get to the previous node (the node's cost) plus
                // the cost of this edge.
                $cost = getCostToNode ($prevNodeIndex, $nextNodeIndex, $edge, $graph);

    //            error_log ("cost = " . $cost);

                if ($cost <= 0)
                {
                    exit;
                }

                $nextNode = $graph->nodes[$nextNodeIndex];

                if (!isset($nextNode->cost) || $cost < $nextNode->cost)
                {
                    if (!isset($nextNode->visitCount))
                    {
                        $nextNode->visitCount = 0;
                        $nextNode->visitCosts = [];
                    }

                    $nextNode->visitCosts[] = isset ($nextNode->cost) ? $nextNode->cost : null;
                    $nextNode->visitCount++;

    //                 if ($nextNode->visitCount > 100)
    //                 {
    //                     echo json_encode ($nextNode->visitCosts);
    //                     exit;
    //                 }

                    // The cost to get to the next node on this edge
                    // is less than the previously "best edge". Set
                    // the "best edge" to this edge and push the node
                    // onto the queue.
                    $nextNode->bestEdge = $edgeIndex;

    //                 if (isset ($nextNode->cost))
    //                 {
    //                     error_log ("replacing cost " . $nextNode->cost . " with " . $cost);
    //                 }
                    if ($nextNodeIndex == 16776)
                    {
                        if (isset($nextNode->cost))
                        {
                            error_log ('Changing cost from ' . $nextNode->cost . ' to ' . $cost);
                        }
                        else
                        {
                            error_log ('Changing cost from ' . 'null' . ' to ' . $cost);
                        }
                    }

                    if (isset($nextNode->cost))
                    {
                        $foundBetterPath = true;
                    }

                    $nextNode->cost = $cost;

    //                error_log ("traversed to next node: " . $nextNodeIndex);

    //                 if (isset ($nextNode->cost))
    //                 {
    //                     error_log ("node cost = " . $nextNode->cost);
    //                 }

                    $foundEnd = (isset($nextNode->type) && $nextNode->type == $endType);
                }
                else
                {
                    $cost = null;
    //                error_log ("too costly");
                    $edge->tooCostly = true;
                }
            }
            else
            {
                $nextNodeIndex = null;
                $edge->deadEnd = true;
            }
        }
    }

    return [$cost, $nextNodeIndex, $foundEnd, $foundBetterPath];
}


function logTerminusInfo ($terminus)
{
//     error_log("\tPoint: " . json_encode($terminus->point));
//     error_log("\ttrailName: " . $terminus->trail->name);
//     error_log("\ttrailType: " . $terminus->trail->type);
//     error_log("\ttrailCN: " . $terminus->trail->cn);
//     error_log("\tpathIndex: " . $terminus->pathIndex);
//     error_log("\tpointIndex: " . $terminus->pointIndex);
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


function insertNode ($type, $terminus, $graph)
{
    $splitEdge = (object)[];

    $splitEdge->start_fraction = $terminus->start_fraction;
    $splitEdge->fraction = $terminus->fraction;
    $splitEdge->end_fraction = $terminus->end_fraction;
    $splitEdge->startEdgeIndex = $graph->splitEdgeSeq--;
    $splitEdge->endEdgeIndex = $graph->splitEdgeSeq--;
    $splitEdge->start_node = $terminus->start_node;
    $splitEdge->mid_node = $type;
    $splitEdge->end_node = $terminus->end_node;
    $splitEdge->line_id = $terminus->line_id;

    $graph->splits[$terminus->edge_id] = $splitEdge;

    $newNode = (object)[
        "edges" => [$splitEdge->startEdgeIndex, $splitEdge->endEdgeIndex],
        "point" => $terminus->point, //(object)["lat" => $coordinates[1], "lng" => $coordinates[0]],
        "type" => $type,
        "costToEnd" => []
    ];

    list ($forwardCost, $backwardCost) = Graph::computeLineSubstringCost ($terminus->line_id, $terminus->start_fraction, $terminus->fraction);

    $edge0 = (object)[
        "start_node" => $terminus->start_node,
        "end_node" => $type,
        "start_fraction"=> $terminus->start_fraction,
        "end_fraction" => $terminus->fraction,
        "forward_cost" => $forwardCost,
        "backward_cost" => $backwardCost,
        "line_id" => $terminus->line_id,
        "edge_id" => $terminus->original_edge_id
    ];

    list ($forwardCost, $backwardCost) = Graph::computeLineSubstringCost ($terminus->line_id, $terminus->fraction, $terminus->end_fraction);

    $edge1 = (object)[
        "start_node" => $type,
        "end_node" => $terminus->end_node,
        "start_fraction"=> $terminus->fraction,
        "end_fraction" => $terminus->end_fraction,
        "forward_cost" => $forwardCost,
        "backward_cost" => $backwardCost,
        "line_id" => $terminus->line_id,
        "edge_id" => $terminus->original_edge_id
    ];

    if (isset ($terminus->start_node) && isset($graph->nodes[$terminus->start_node]))
    {
        substituteEdgeIndex ($graph->nodes[$terminus->start_node], $terminus->edge_id, $splitEdge->startEdgeIndex);
    }

    if (isset ($terminus->end_node) && isset($graph->nodes[$terminus->end_node]))
    {
        substituteEdgeIndex ($graph->nodes[$terminus->end_node], $terminus->edge_id, $splitEdge->endEdgeIndex);
    }

    $graph->nodes[$type] =  $newNode;
    $graph->edges[$splitEdge->startEdgeIndex] = $edge0;
    $graph->edges[$splitEdge->endEdgeIndex] = $edge1;
}


function setupTerminusNode ($terminus, $type, $graph)
{
    $terminus->original_edge_id = $terminus->edge_id;

    // Has the edge been split?
    while (isset($graph->splits[$terminus->edge_id]))
    {
        $split = $graph->splits[$terminus->edge_id];

        if ($terminus->fraction >= $split->start_fraction && $terminus->fraction < $split->fraction)
        {
            $terminus->edge_id = $split->startEdgeIndex;
            $terminus->end_fraction = $split->fraction;
            $terminus->end_node = $split->mid_node;
        }
        else
        {
            $terminus->edge_id = $split->endEdgeIndex;
            $terminus->start_fraction = $split->fraction;
            $terminus->start_node = $split->mid_node;
        }
    }

    insertNode ($type, $terminus, $graph);

}


function traverseRouteToEnd ($nodeIndex, $graph, $bestCost, $endType)
{
    while (isset ($nodeIndex))
    {
        $node = $graph->nodes[$nodeIndex];

        if (isset ($node->bestEdge))
        {
            list ($cost, $nodeIndex, $foundEnd, $foundBetterPath) = traverseEdge($node->bestEdge, $nodeIndex, $graph, $endType);

            if (isset($cost) && $foundEnd)
            {
                if (!isset($bestCost) || $cost < $bestCost)
                {
                    $bestCost = $cost;
                }

                return $bestCost;
            }
        }
        else
        {
            $nodeIndex = null;
        }
    }
}


function traverseToEnd ($edgeIndex, $prevNodeIndex, $graph)
{
    error_log ("found path to end");

    $cost = null;
    $foundEnd = false;

    for (;;)
    {
        $node = $graph->nodes[$prevNodeIndex];
        $edge = $graph->edges[$edgeIndex];
        $nextNodeIndex = getOtherNodeIndex($edge, $prevNodeIndex);
        $nextNode = $graph->nodes[$nextNodeIndex];

        $cost = getCostToNode ($prevNodeIndex, $nextNodeIndex, $edge, $graph);

        if ($cost < $nextNode->cost)
        {
            $nextNode->bestEdge = $edgeIndex;

            if ($nextNodeIndex == 16776)
            {
                error_log ("replacing cost " . $nextNode->cost . " with " . $cost);
            }

            $nextNode->cost = $cost;

            $foundEnd = (isset($nextNode->type) && $nextNode->type == "end");

            if ($foundEnd)
            {
                break;
            }

            $prevNodeIndex = null;
            if (!isset($nextNode->pathToEnd))
            {
                break;
            }

            $prevNodeIndex = $nextNodeIndex;
            $edgeIndex = $nextNode->pathToEnd;
        }
        else
        {
            break;
        }
    }

    return [$cost, $foundEnd];
}


function markPathToEnd ($graph)
{
    error_log ("Updating path to end");

    $nodeIndex = "end";
    while (isset ($nodeIndex))
    {
        $node = $graph->nodes[$nodeIndex];

        if (isset ($node->bestEdge))
        {
            $edgeIndex = $node->bestEdge;

            $edge = $graph->edges[$edgeIndex];

            $nodeIndex = getOtherNodeIndex($edge, $nodeIndex);

            if (isset($nodeIndex))
            {
                $nextNode = $graph->nodes[$nodeIndex];
                $nextNode->pathToEnd = $edgeIndex;
            }
        }
        else
        {
            $nodeIndex = null;
        }
    }
}


function getNodeSortCost ($node)
{
    $costFactor = 1.0;
    $distanceFactor = 1.0;

    return $node->cost * $costFactor + $node->costToEnd["end"] * $distanceFactor;
}


function removeDeadEndNodesAndEdges ($nodeIndex, $graph)
{
    $deadEndEdges = 0;

    $node = $graph->nodes[$nodeIndex];

    for ($i = 0; $i < count($node->edges);)
    {
        $edgeIndex = $node->edges[$i];

        if (isset($graph->edges[$edgeIndex]->deadEnd) && $graph->edges[$edgeIndex]->deadEnd)
        {
            array_splice ($node->edges, $i, 1);

            $deadEndEdges++;
        }
        else
        {
            $i++;
        }
    }

    if (count($node->edges) == 1)
    {
        $graph->edges[$node->edges[0]]->deadEnd = true;
        $otherNodeIndex = getOtherNodeIndex ($graph->edges[$node->edges[0]], $nodeIndex);

        unset ($graph->nodes[$nodeIndex]);

        $deadEndEdges += removeDeadEndNodesAndEdges($otherNodeIndex, $graph);
    }

    return $deadEndEdges;
}


function findRoute ($graph, $startRoute)
{
    $foundEndCount = 0;
    $prunedCount = 0;
    $maxTraversals = 0;
    $maxQueueSize = 0;
    $searchersTerminated = 0;
    $deadEndNodes = 0;
    $deadEndEdges = 0;

    if (isset($startRoute))
    {
        foreach ($graph->edges as $edgeIndex => $edge)
        {
            if ($startRoute[1].node_id == $edge->start_node)
            {
                $cost = $edge->backward_cost;
                break;
            }
            elseif ($startRoute[1].node_id == $edge->end_node)
            {
                $cost = $edge->forward_cost;
                break;
            }
        }

        if (isset($cost))
        {
            for ($i = 1; $i < $startRoute->count () - 1; $i++)
            {
                Graph::loadNode ($startRoute[$i]->node_id, $edgeIndex, $graph);

                $graph->nodes[$startRoute[$i]->node_id]->cost = $cost;

                $edgeIndex = $startRoute[$i]->next_edge_id;
                $edge = $graph[$edgeIndex];

                if ($edge->start_node == $startRoute[$i]->node_id)
                {
                    $cost += $graph->edges[$edgeIndex]->forward_cost;
                }
                else
                {
                    $cost += $graph->edges[$edgeIndex]->backward_cost;
                }
            }
        }
    }

    $bestCost = null;

    $nodes = [];

    array_push($nodes, (object)[
        "index" => "start",
        "endType" => "end",
        "traversals" => 0,
        "nodesVisited" => [],
        "nodeCosts" => []
    ]);

    $graph->nodes["start"]->cost = 0;
    $graph->nodes["start"]->costToEnd["end"] = Graph::costBetweenNodes("start", "end", $graph);

    $pathToEndFound = false;

    while (count($nodes) > 0)
    {
        if (count($nodes) > $maxQueueSize)
        {
            $maxQueueSize = count($nodes);
        }

        // Pop off a node from the queue
        $nodeIndex = $nodes[0]->index;
        $endType = $nodes[0]->endType;
        $traversals = $nodes[0]->traversals;
        $nodesVisited = $nodes[0]->nodesVisited;
        $nodeCosts = $nodes[0]->nodeCosts;
        array_splice($nodes, 0, 1);

        $node = $graph->nodes[$nodeIndex];
        $node->queued = false;

        if ($traversals > $maxTraversals)
        {
            $maxTraversals = $traversals;
        }

        if (count ($node->edges) <= 1)
        {
            $deadEndNodes++;
        }

        // For each edge connected to this node...
        foreach ($node->edges as $edgeIndex)
        {
            if (isset($graph->edges[$edgeIndex]->deadEnd) && $graph->edges[$edgeIndex]->deadEnd)
            {
                error_log ("skipping deadend edge");
                continue;
            }

            if (isset($node->pathToEnd) && $edgeIndex == $node->pathToEnd)
            {
                list ($cost, $foundEnd) = traverseToEnd ($edgeIndex, $nodeIndex, $graph);

                if ($foundEnd)
                {
                    markPathToEnd ($graph);

                    if (!isset($bestCost) || $cost < $bestCost)
                    {
                        $bestCost = $cost;

                        // Now that we know a cost to reach the end,
                        // traverse the nodes in the queue and remove any that are too high of a cost.
                        /*for ($i = 0; $i < count($nodes);)
                        {
                            $node = $graph->nodes[$nodes[$i]->index];

                            if (isset($node->cost) && $node->cost + $node->costToEnd[$nodes[$i]->endType] >= $bestCost)
                            {
                                 error_log ('Removing node from queue for too high of a cost'); //: best cost '. $bestCost . ', node cost: ' . $graph->nodes[$nodes[$i]->index]->cost);
                                 array_splice ($nodes, $i, 1);
                            }
                            else
                            {
                                $i++;
                            }
                        }*/
                    }

                    error_log ('Found end: cost: ' . $cost . ', bestCost: ' . $bestCost);
                    $foundEndCount++;
                }
            }
            else
            {
                list ($cost, $nextNodeIndex, $foundEnd, $foundBetterPath) = traverseEdge($edgeIndex, $nodeIndex, $graph, $endType);

            // If the edge was traversed then $cost will be set
            if (isset($cost))
            {
                if ($foundEnd)
                {
                    //$pathToEndFound = true;

//                    markPathToEnd ($graph);

                    if (!isset($bestCost) || $cost < $bestCost)
                    {
                        $bestCost = $cost;

                        // Now that we know a cost to reach the end,
                        // traverse the nodes in the queue and remove any that are too high of a cost.
                        /*
                        for ($i = 0; $i < count($nodes);)
                        {
                            $node = $graph->nodes[$nodes[$i]->index];

                            if (isset($node->cost) && $node->cost + $node->costToEnd[$nodes[$i]->endType] >= $bestCost)
                            {
                                 error_log ('Removing node from queue for too high of a cost'); //: best cost '. $bestCost . ', node cost: ' . $graph->nodes[$nodes[$i]->index]->cost);
                                 array_splice ($nodes, $i, 1);
                            }
                            else
                            {
                                $i++;
                            }
                        }*/
                    }

                    error_log ('Found end: cost: ' . $cost . ', bestCost: ' . $bestCost);
                    $foundEndCount++;
                }
                else if ($nextNodeIndex !== null)
                {
                    if ($foundBetterPath)
                    {
                        // Find any searchers that have this node in their path
                        // and remove them.

                        for ($i = 0; $i < count($nodes);)
                        {
                            if (array_search ($nextNodeIndex, $nodes[$i]->nodesVisited) !== false)
                            {
                                $graph->nodes[$nodes[$i]->index]->queued = false;
                                array_splice($nodes, $i, 1);
                                $searchersTerminated++;
                            }
                            else
                            {
                                $i++;
                            }
                        }
                    }

                    $nextNode = $graph->nodes[$nextNodeIndex];

                    // Add the node to the queue if it is not already queued
                    // and the cost is less than the cost to the end, if known.
                    if ((!isset($nextNode->queued) || !$nextNode->queued) /*&&
                        (!isset($bestCost) || $cost + $nextNode->costToEnd[$endType] < $bestCost)*/)
                    {
                        $newSearcher = (object)[
                            "index" => $nextNodeIndex,
                            "endType" => $endType,
                            "traversals" => $traversals + 1,
                            "nodesVisited" => [],
                            "nodeCosts" => []
                        ];

                        if (array_search ($nextNodeIndex, $nodesVisited) !== false)
                        {
                            error_log ('Searcher already visited node');
                            error_log ('nodes: ' . json_encode($nodesVisited));
                            error_log ('costs: ' . json_encode($nodeCosts));
                            error_log ('new node: ' . $nextNodeIndex);
                            error_log ('new cost: ' . $cost);
                            error_log ('current node cost: ' . $graph->nodes[$nextNodeIndex]->cost);
                        }

                        array_splice($newSearcher->nodesVisited, 0, 0, $nodesVisited);
                        $newSearcher->nodesVisited[] = $nextNodeIndex;

                        array_splice($newSearcher->nodeCosts, 0, 0, $nodeCosts);
                        $newSearcher->nodeCosts[] = $cost;

                        // Find best position for the new searcher and insert into
                        // array of nodes.
                        $newSearcherCost = getNodeSortCost ($nextNode);

                        foreach ($nodes as $index => $searcher)
                        {
                            if ($newSearcherCost < getNodeSortCost ($graph->nodes[$searcher->index]))
                            {
                                array_splice ($nodes, $index, 0, array($newSearcher));
                                $nextNode->queued = true;
                                break;
                            }
                        }

                        if (!isset($nextNode->queued) || !$nextNode->queued)
                        {
                            $nodes[] = $newSearcher;
                            $nextNode->queued = true;
                        }
                    }
                    else
                    {
                        $prunedCount++;
                    }
                }
            }
            else
            {
                $prunedCount++;
            }
            }
        }

       $deadEndEdges += removeDeadEndNodesAndEdges ($nodeIndex, $graph);
    }

    error_log ('Best final cost: ' . $bestCost);
    error_log ('Found end number of times: ' . $foundEndCount);
    error_log ('Searches pruned: ' . $prunedCount);
    error_log ('Searches terminated: ' . $searchersTerminated);
    error_log ('Dead End Nodes: ' . $deadEndNodes);
    error_log ('Dead End Edges: ' . $deadEndEdges);
    error_log ('Max Edge traversals: ' . $maxTraversals);
    error_log ('Max queue size: ' . $maxQueueSize);

    $visitCounts = [];
    $visitPoint = [];
    foreach ($graph->nodes as $nodeIndex => $node)
    {
        if (!isset($node->visitCount)) $node->visitCount = 0;
        if (!isset($visitCounts[$node->visitCount])) $visitCounts[$node->visitCount] = 0;
        if (!isset($visitPoint[$node->visitCount])) $visitPoint[$node->visitCount] = null;

        $visitCounts[$node->visitCount]++;
        $visitPoint[$node->visitCount] = $nodeIndex;
    }

    error_log ('Node visits:');
    ksort ($visitCounts);
    foreach ($visitCounts as $key => $value)
    {
        $node = $graph->nodes[$visitPoint[$key]];

        $costToEnd = null;
        if (isset($node->costToEnd["end"]))
        {
            $costToEnd = $node->costToEnd["end"];
        }

        $cost = null;
        if (isset($node->cost))
        {
            $cost = $node->cost;
        }

        error_log ('Nodes visited ' . $key . ' times: ' . $value .
            ', lat: ' . $node->point->lat . ', lng: ' . $node->point->lng .
            ', cost: ' . $cost . ', costToEnd: '. $costToEnd . ', node index: ' . $visitPoint[$key]);
    }
}


function generateAnchors ($graph)
{
    $newAnchors = [ ];

    $nodeIndex = "end";

    while (isset($nodeIndex))
    {
        $node = $graph->nodes[$nodeIndex];

        $anchor = (object)[ ];
        $anchor->point = $node->point;

        if (is_int($nodeIndex) && $nodeIndex >= 0)
        {
            $anchor->node_id = $nodeIndex;
        }

        if (isset($prevEdge))
        {
            // Add the information to get to the next node
            $anchor->next = (object)[ ];

            if (isset ($prevEdge->edge_id))
            {
                $anchor->next->edge_id = $prevEdge->edge_id;
            }
            else
            {
                $anchor->next->edge_id = $prevBestEdgeIndex;
            }

            if (isset($prevEdge->start_node) && $prevEdge->start_node == $nodeIndex)
            {
                $anchor->next->fraction = $prevEdge->start_fraction;
            }
            elseif (isset($prevEdge->end_node) && $prevEdge->end_node == $nodeIndex)
            {
                $anchor->next->fraction = $prevEdge->end_fraction;
            }
        }
        else
        {
            $anchor->type = "end";
        }

        if (isset($node->bestEdge))
        {
            $edge = $graph->edges[$node->bestEdge];
//             error_log("edge index : " . $node->bestEdge);

            $anchor->prev = (object)[ ];

            if ($node->bestEdge < 0)
            {
                $anchor->prev->edge_id = $edge->edge_id;
            }
            else
            {
                $anchor->prev->edge_id = $node->bestEdge;
            }

            if (isset($edge->start_node) && $edge->start_node == $nodeIndex)
            {
                $anchor->prev->fraction = $edge->start_fraction;
                $nodeIndex = $edge->end_node;
            }
            elseif (isset($edge->end_node) && $edge->end_node == $nodeIndex)
            {
                $anchor->prev->fraction = $edge->end_fraction;
                $nodeIndex = $edge->start_node;
            }
            else
            {
                error_log("**** no previous or next ****");
            }

            $edge->selectedEdge = true;

            $prevEdge = $edge;
            $prevBestEdgeIndex = $node->bestEdge;
        }
        else
        {
            // No best edge from this node? Are we at the start node?
            unset($nodeIndex);

//             error_log ("reached last node");

            if ($node->type == "start")
            {
                $anchor->type = "start";
            }
            else
            {
                error_log ("Not at the start node");
            }
        }

        addNewAnchor($newAnchors, $anchor);
    }

    // If we have less than two anchors or if the start
    // and end anchors were not tagged correctly then
    // assume there was an error and clear out all anchors.
    if (count($newAnchors) < 2 ||
        ((!isset($newAnchors[0]->type) || $newAnchors[0]->type != "start") &&
        (!isset($newAnchors[count($newAnchors) - 1]->type) || $newAnchors[count($newAnchors) - 1]->type != "end")))
    {
        $newAnchors = [];
    }

    return $newAnchors;
}


function findPath ($start, $end, $startRoute = null, $dumpGraph = false)
{
    $startResult = Map::getTrailFromPoint($start);

//    error_log("Start Information");
//    logTerminusInfo($startResult);

    $endResult = Map::getTrailFromPoint($end);

//     error_log("End Information");
//     logTerminusInfo($endResult);

//     $startTile = Map::getTileNameFromPoint($startResult->point);
//     $endTile = Map::getTileNameFromPoint($endResult->point);

    // Create an empty graph
    $graph = (object)["nodes" => [], "edges" => [], "splits" => [], "splitEdgeSeq" => -1];

    setupTerminusNode ($startResult, "start", $graph);//, $startTile);
    setupTerminusNode ($endResult, "end", $graph);

    findRoute ($graph, $startRoute);

    $newAnchors = generateAnchors($graph);

    if ($dumpGraph)
    {
        dumpEdges ($graph);
        dumpBestEdgeNodes ($graph);
    }

    return $newAnchors;
}
