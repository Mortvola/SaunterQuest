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


function getCostToNode ($prevNodeIndex, $nextNodeIndex, $edge, $graph, $direction)
{
    $prevNode = $graph->nodes[$prevNodeIndex];
    $nextNode = $graph->nodes[$nextNodeIndex];

    if ($edge->start_node == $prevNodeIndex)
    {
        if ($direction == "forward")
        {
            $cost = $edge->forward_cost;
        }
        else
        {
            $cost = $edge->backward_cost;
        }
    }
    else
    {
        if ($direction == "forward")
        {
            $cost = $edge->backward_cost;
        }
        else
        {
            $cost = $edge->forward_cost;
        }
    }

    if ($cost <= 0)
    {
        exit;
    }

    if (isset ($prevNode->cost[$direction]))
    {
        if ($prevNode->cost[$direction] < 0)
        {
            error_log ($prevNode->cost[$direction]);

            exit;
        }
        $cost += $prevNode->cost[$direction];
    }

    return $cost;
}


function traverseEdge ($edgeIndex, $prevNodeIndex, $graph, $direction, $endType)
{
    $cost = null;
    $nextNodeIndex = null;
    $foundEnd = null;

//    error_log ("traversing edge " . $edgeIndex . " from " . $prevNodeIndex . ", direction: " .$direction);

    $prevNode = $graph->nodes[$prevNodeIndex];

    if (!isset($prevNode->bestEdge[$direction]) || $prevNode->bestEdge[$direction] != $edgeIndex)
    {
        $edge = $graph->edges[$edgeIndex];

        $nextNodeIndex = getOtherNodeIndex($edge, $prevNodeIndex);

        if (isset($nextNodeIndex))
        {
            Graph::loadNode ($nextNodeIndex, $edgeIndex, $graph, $endType);

            // We carry the costs forward. The cost is the cost
            // to get to the previous node (the node's cost) plus
            // the cost of this edge.
            $cost = getCostToNode ($prevNodeIndex, $nextNodeIndex, $edge, $graph, $direction);

//            error_log ("cost = " . $cost);

            if ($cost <= 0)
            {
                exit;
            }

            $nextNode = $graph->nodes[$nextNodeIndex];

            if (!isset($nextNode->cost[$direction]) || $cost < $nextNode->cost[$direction])
            {
                if (!isset($nextNode->visitCount))
                {
                    $nextNode->visitCount = 0;
                    $nextNode->visitCosts = [];
                }

                $nextNode->visitCosts[] = isset ($nextNode->cost[$direction]) ? $nextNode->cost[$direction] : null;
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
                $nextNode->bestEdge[$direction] = $edgeIndex;
                $nextNode->cost[$direction] = $cost;

//                error_log ("traversed to next node: " . $nextNodeIndex);

//                 if (isset ($nextNode->cost[$direction]))
//                 {
//                     error_log ("node cost = " . $nextNode->cost[$direction]);
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
    }

    return [$cost, $nextNodeIndex, $foundEnd];
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
        "cost" => [],
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


function traverseRouteToEnd ($nodeIndex, $direction, $otherDirection, $graph, $bestCost, $endType)
{
    while (isset ($nodeIndex))
    {
        $node = $graph->nodes[$nodeIndex];

        if (isset ($node->bestEdge[$otherDirection]))
        {
            list ($cost, $nodeIndex, $foundEnd) = traverseEdge($node->bestEdge[$otherDirection], $nodeIndex, $graph, $direction, $endType);

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


function findRoute ($graph, $startRoute)
{
    $foundEndCount = 0;
    $prunedCount = 0;
    $maxTraversals = 0;

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
        "direction" => "forward",
        "endType" => "end",
        "traversals" => 0
    ]);

     $graph->nodes["start"]->cost["forward"] = 0;
     $graph->nodes["start"]->costToEnd["end"] = Graph::costBetweenNodes("start", "end", $graph);

    array_push($nodes, (object)[
        "index" => "end",
        "direction" => "backward",
        "endType" => "start",
        "traversals" => 0
    ]);

    $graph->nodes["end"]->cost["backward"] = 0;
    $graph->nodes["end"]->costToEnd["start"] = Graph::costBetweenNodes("end", "start", $graph);

//     foreach ($nodes as $node)
//     {
//         error_log ($graph->nodes[$node->index]->cost[$node->direction] + $node->distance . ': ' . $node->direction);
//     }

    while (count($nodes) > 0)
    {
        // Sort the nodes from lowest cost to highest cost
        usort($nodes, function ($a, $b) use ($graph)
        {
            $costFactor = 1.0;

            $nodeA = $graph->nodes[$a->index];
            $nodeB = $graph->nodes[$b->index];

            if (!isset($nodeA->costToEnd[$a->endType]))
            {
                $nodeA->costToEnd[$a->endType] = Graph::costBetweenNodes($a->index, $a->endType, $graph);
            }

            $nodeAcost = $nodeA->cost[$a->direction] * $costFactor + $nodeA->costToEnd[$a->endType];

            if (!isset($nodeB->costToEnd[$b->endType]))
            {
                $nodeB->costToEnd[$b->endType] = Graph::costBetweenNodes($b->index, $b->endType, $graph);
            }

            $nodeBcost = $nodeB->cost[$b->direction] * $costFactor + $nodeB->costToEnd[$b->endType];

            if ($nodeAcost < $nodeBcost)
            {
                return -1;
            }

            if ($nodeAcost > $nodeBcost)
            {
                return 1;
            }

            return 0;
        });

        // Pop off a node from the queue
        $nodeIndex = $nodes[0]->index;
        $direction = $nodes[0]->direction;
        $endType = $nodes[0]->endType;
        $traversals = $nodes[0]->traversals;
        array_splice($nodes, 0, 1);

        $node = $graph->nodes[$nodeIndex];
        $node->queued = false;

        if ($traversals > $maxTraversals)
        {
            $maxTraversals = $traversals;
        }

        // For each edge connected to this node...
        foreach ($node->edges as $edgeIndex)
        {
            list ($cost, $nextNodeIndex, $foundEnd) = traverseEdge($edgeIndex, $nodeIndex, $graph, $direction, $endType);

            // If the edge was traversed then $cost will be set
            if (isset($cost))
            {
                if ($foundEnd)
                {
                    if (!isset($bestCost) || $cost < $bestCost)
                    {
                        $bestCost = $cost;

                        // Now that we know a cost to reach the end,
                        // traverse the nodes in the queue and remove any that are too high of a cost.
                        for ($i = 0; $i < count($nodes);)
                        {
                            $node = $graph->nodes[$nodes[$i]->index];

                            if (isset($node->cost[$nodes[$i]->direction]) && $node->cost[$nodes[$i]->direction] + $node->costToEnd[$nodes[$i]->endType] >= $bestCost)
                            {
                                error_log ('Removing node from queue for too high of a cost'); //: best cost '. $bestCost . ', node cost: ' . $graph->nodes[$nodes[$i]->index]->cost[$direction]);
                                array_splice ($nodes, $i, 1);
                            }
                            else
                            {
                                $i++;
                            }
                        }
                    }

                    error_log ('Found end: ' . $direction . ', cost: ' . $cost . ', bestCost: ' . $bestCost);
                    $foundEndCount++;
                }
                else
                {
                    $node = $graph->nodes[$nextNodeIndex];

                    if (!isset($node->costToEnd[$endType]))
                    {
                        $node->costToEnd[$endType] = Graph::costBetweenNodes($nextNodeIndex, $endType, $graph);
                    }

                    // Add the node to the queue if it is not already queued
                    // and the cost is less than the cost to the end, if known.
                    if ((!isset($node->queued) || !$node->queued) &&
                        (!isset($bestCost) || $cost + $node->costToEnd[$endType] < $bestCost))
                    {
                        array_push($nodes, (object)[
                            "index" => $nextNodeIndex,
                            "direction" => $direction,
                            "endType" => $endType,
                            "traversals" => $traversals + 1
                        ]);

                        $node->queued = true;
                    }
                    else
                    {
                        $prunedCount++;
                    }

                    if ($direction == "backward" && isset($nextNode->cost["forward"]))
                    {
                        error_log("traversing " . $direction . ' and found ' . "forward");

                        $cost = traverseRouteToEnd ($nextNodeIndex, $direction, "forward", $graph, $bestCost, "start");

                        if (issset($cost) && (!isset($bestCost) || $cost < $bestCost))
                        {
                            $bestCost = $cost;

                            // Now that we know a cost to reach the end,
                            // traverse the nodes in the queue and remove any that are too high of a cost.
                            for ($i = 0; $i < count($nodes);)
                            {
                                $node = $graph->nodes[$nodes[$i]->index];

                                if (isset($node->cost[$nodes[$i]->direction]) && $node->cost[$nodes[$i]->direction] + $node->costToEnd[$nodes[$i]->endType] >= $bestCost)
                                {
                                    error_log ('Removing node from queue for too high of a cost: best cost '. $bestCost . ', node cost: ' . $graph->nodes[$nodes[$i]->index]->cost[$direction]);
                                    array_splice ($nodes, $i, 1);
                                }
                                else
                                {
                                    $i++;
                                }
                            }
                        }

                        error_log ('Found end 1' . $direction);
                        return;
                    }
                    elseif ($direction == "forward" && isset($nextNode->cost["backward"]))
                    {
                        error_log("traversing " . $direction . ' and found ' . "backward");

                        // The forward graph reached the backward graph. Follow the backward
                        // graph to the end, updating forward costs along the way.

                        $cost = traverseRouteToEnd ($nextNodeIndex, $direction, "backward", $graph, $bestCost, "end");

                        if (issset($cost) && (!isset($bestCost) || $cost < $bestCost))
                        {
                            $bestCost = $cost;

                            // Now that we know a cost to reach the end,
                            // traverse the nodes in the queue and remove any that are too high of a cost.
                            for ($i = 0; $i < count($nodes);)
                            {
                                $node = $graph->nodes[$nodes[$i]->index];

                                if (isset($node->cost[$nodes[$i]->direction]) && $node->cost[$nodes[$i]->direction] + $node->costToEnd[$nodes[$i]->endType] >= $bestCost)
                                {
                                    error_log ('Removing node from queue for too high of a cost: best cost '. $bestCost . ', node cost: ' . $graph->nodes[$nodes[$i]->index]->cost[$direction]);
                                    array_splice ($nodes, $i, 1);
                                }
                                else
                                {
                                    $i++;
                                }
                            }
                        }

                        error_log ('Found end 2' . $direction);
                        return;
                    }
                }
            }
            else
            {
                $prunedCount++;
            }
        }
    }

    error_log ('Best final cost: ' . $bestCost);
    error_log ('Found end number of times: ' . $foundEndCount);
    error_log ('Searches pruned: ' . $prunedCount);
    error_log ('Edge traversals: ' . $maxTraversals);

    $visitCounts = [];
    foreach ($graph->nodes as $node)
    {
        if (!isset($node->visitCount)) $node->visitCount = 0;
        if (!isset($visitCounts[$node->visitCount])) $visitCounts[$node->visitCount] = 0;

        $visitCounts[$node->visitCount]++;
    }

    error_log ('Node visits:');
    foreach ($visitCounts as $key => $value)
    {
        error_log ('Node visited ' . $key . ' times: ' . $value);
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

        if (isset($node->bestEdge["forward"]))
        {
            $edge = $graph->edges[$node->bestEdge["forward"]];
//             error_log("edge index : " . $node->bestEdge);

            $anchor->prev = (object)[ ];

            if ($node->bestEdge["forward"] < 0)
            {
                $anchor->prev->edge_id = $edge->edge_id;
            }
            else
            {
                $anchor->prev->edge_id = $node->bestEdge["forward"];
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
            $prevBestEdgeIndex = $node->bestEdge["forward"];
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
