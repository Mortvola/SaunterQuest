<?php
namespace App;
require_once "utilities.php";

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

            if (!isset($edge->start_node))
            {
                error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . (isset($edge->visited) ? "Visited" : ""));
            }
            elseif ($edge->start_node != $nodeIndex)
            {
                error_log(
                    "edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->start_node . ". " .
                    (isset($edge->visited) ? "Visited" : ""));
            }

            if (!isset($edge->end_node))
            {
                error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . (isset($edge->visited) ? "Visited" : ""));
            }
            elseif ($edge->end_node != $nodeIndex)
            {
                error_log(
                    "edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->end_node . ". " .
                    (isset($edge->visited) ? "Visited" : ""));
            }

            if (!isset($edge->end_node) && !isset($edge->start_node))
            {
                error_log("edge index: " . $node->edges[$i] . ", no route");
            }
        }
        error_log("---------------");
    }
}


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
        error_log(json_encode($newAnchors));
    }
    elseif ($anchor->point->lat != $newAnchors[0]->point->lat || $anchor->point->lng != $newAnchors[0]->point->lng)
    {
        if (count($newAnchors) >= 1 && $anchor->next->line_id != $newAnchors[0]->prev->line_id)
        {
            error_log("next and previous trails don't match: next: " . $anchor->next->line_id . ", prev: " . $newAnchors[0]->prev->line_id);
            error_log(json_encode($anchor));
        }

        // Determine if we should replace the previously pushed anchor
        // or add a new one. If the anchor at position 0 is between
        // the new one and the one at position 1, then we can just replace
        // the one at position 0.
        if (count($newAnchors) > 1 && !isset($newAnchors[0]->next->file) && $anchor->next->line_id == $newAnchors[0]->prev->line_id &&
            $anchor->next->line_id == $newAnchors[1]->prev->line_id && (($anchor->next->fraction > $newAnchors[0]->prev->fraction &&
                $newAnchors[0]->next->fraction > $newAnchors[1]->prev->fraction) ||
                ($anchor->next->fraction < $newAnchors[0]->prev->fraction && $newAnchors[0]->next->fraction < $newAnchors[1]->prev->fraction)))
        {
            error_log("Replacing " . json_encode($newAnchors[0]));
            error_log("with " . json_encode($anchor));

            $newAnchors[0] = $anchor;
            error_log(json_encode($newAnchors));
        }
        else
        {
            // Push the anchor onto the front of the array
            array_splice($newAnchors, 0, 0, array (
                $anchor
            ));
            error_log(json_encode($newAnchors));
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

function traverseEdge ($edgeIndex, $fromNodeIndex, $bestCost, $graph, &$nodes)
{
    $foundEnd = false;
    $cost = null;

    $prevNode = $graph->nodes[$fromNodeIndex];

    if (!isset($prevNode->bestEdge) || $prevNode->bestEdge != $edgeIndex)
    {
        $edge = $graph->edges[$edgeIndex];

        if (!isset($edge))
        {
            error_log("edge index: " . $edgeIndex);
            error_log("number of edges: " . count($graph->edges));
        }

        $nextNodeIndex = getOtherNodeIndex($edge, $fromNodeIndex);

        if (isset($nextNodeIndex))
        {
            loadNode ($nextNodeIndex, $edgeIndex, $graph);

            $nextNode = $graph->nodes[$nextNodeIndex];

            // We carry the costs forward. The cost is the cost
            // to get to the previous node (the node's cost) and
            // the cost of this edge.
            if ($edge->start_node == $fromNodeIndex)
            {
                $cost = $edge->forward_cost;
            }
            else
            {
                $cost = $edge->backward_cost;
            }

            if (isset ($prevNode->cost))
            {
                $cost += $prevNode->cost;
            }

            if (($bestCost === null || $cost < $bestCost) &&
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
                    array_push($nodes, (object)[
                        "index" => $nextNodeIndex
                    ]);
                }
            }
            else
            {
                $edge->tooCostly = true;
            }
        }
    }

    return [$foundEnd, $cost];
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


function loadNode ($nodeIndex, $edgeIndex, $graph)
{
    // Load the node if the node index is valid and it isn't already loaded
    if (isset ($nodeIndex) && !isset($graph->nodes[$nodeIndex]))
    {
        $sql = "select ST_AsGeoJSON(ST_Transform(way, 4326)) AS point
            from nav_nodes
            where id = :nodeId:";

        $node = \DB::connection('pgsql')->select (str_replace (":nodeId:", $nodeIndex, $sql));

        $coordinates = json_decode($node[0]->point)->coordinates;

        $newNode = (object)[
            "edges" => [$edgeIndex],
            "point" => (object)["lat" => $coordinates[1], "lng" => $coordinates[0]]
        ];

        $graph->nodes[$nodeIndex] = $newNode;

        // Load the edges at the start and end nodes associated with this edge.
        $sql = "select id, start_node, end_node, start_fraction, end_fraction, forward_cost, backward_cost, line_id
                from nav_edges
                where (start_node = :nodeId: OR end_node = :nodeId:)
                and id != :edgeId:";

        $edges = \DB::connection('pgsql')->select (str_replace(":nodeId:", $nodeIndex, str_replace (":edgeId:", $edgeIndex, $sql)));

        foreach ($edges as $edge)
        {
            $edgeIndex = $edge->id;

            // If this edge was previously split...
            while (isset($graph->splits[$edgeIndex]))
            {
                $split = $graph->splits[$edgeIndex];

                if ($split->start_node == $nodeIndex)
                {
                    $edgeIndex = $split->startEdgeIndex;
                }
                else
                {
                    $edgeIndex = $split->endEdgeIndex;
                }
            }

            // If the edge is not already in the edge array then add it.
            if (!isset ($graph->edges[$edgeIndex]))
            {
                $graph->edges[$edgeIndex] = $edge;
            }
            else
            {
                $edge = $graph->edges[$edgeIndex];
            }

            if (isset($graph->nodes[$edge->start_node]) &&
                !array_search($edgeIndex, $graph->nodes[$edge->start_node]->edges))
            {
                $graph->nodes[$edge->start_node]->edges[] = $edgeIndex;
            }

            if (isset($graph->nodes[$edge->end_node]) &&
                !array_search($edgeIndex, $graph->nodes[$edge->end_node]->edges))
            {
                $graph->nodes[$edge->end_node]->edges[] = $edgeIndex;
            }
        }
    }
}


function insertNode ($type, $terminus, $cost0, $cost1, $graph)
{
    $coordinates = json_decode($terminus->point)->coordinates;

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

    $graph->splits[$terminus->id] = $splitEdge;

    $newNode = (object)[
        "edges" => [$splitEdge->startEdgeIndex, $splitEdge->endEdgeIndex],
        "point" => (object)["lat" => $coordinates[1], "lng" => $coordinates[0]],
        "type" => $type
    ];

    if ($type == "start")
    {
        $newNode->cost = 0;
    }

    $edge0 = (object)[
        "start_node" => $terminus->start_node,
        "end_node" => $type,
        "start_fraction"=> $terminus->start_fraction,
        "end_fraction" => $terminus->fraction,
        "forward_cost" => $cost0[0],
        "backward_cost" => $cost0[1],
        "line_id" => $terminus->line_id
    ];

    $edge1 = (object)[
        "start_node" => $type,
        "end_node" => $terminus->end_node,
        "start_fraction"=> $terminus->fraction,
        "end_fraction" => $terminus->end_fraction,
        "forward_cost" => $cost1[0],
        "backward_cost" => $cost1[1],
        "line_id" => $terminus->line_id
    ];

    if (isset ($terminus->start_node) && isset($graph->nodes[$terminus->start_node]))
    {
        substituteEdgeIndex ($graph->nodes[$terminus->start_node], $terminus->id, $splitEdge->startEdgeIndex);
    }

    if (isset ($terminus->end_node) && isset($graph->nodes[$terminus->end_node]))
    {
        substituteEdgeIndex ($graph->nodes[$terminus->end_node], $terminus->id, $splitEdge->endEdgeIndex);
    }

    $graph->nodes[$type] =  $newNode;
    $graph->edges[$splitEdge->startEdgeIndex] = $edge0;
    $graph->edges[$splitEdge->endEdgeIndex] = $edge1;
}


function setupTerminusNode ($terminus, $type, $graph)
{
    // Has the edge been split?
    while (isset($graph->splits[$terminus->id]))
    {
        $split = $graph->splits[$terminus->id];

        if ($terminus->fraction >= $split->start_fraction && $terminus->fraction < $split->fraction)
        {
            $terminus->id = $split->startEdgeIndex;
            $terminus->end_fraction = $split->fraction;
            $terminus->end_node = $split->mid_node;
        }
        else
        {
            $terminus->id = $split->endEdgeIndex;
            $terminus->start_fraction = $split->fraction;
            $terminus->start_node = $split->mid_node;
        }
    }

    $cost1 = 0;
    $cost2 = 0;
    //$cost1 = computeCost ($edge->prev->pointIndex, $terminus->pointIndex, $terminus->trail->paths[$terminus->pathIndex]->points);
    //$cost2 = computeCost ($terminus->pointIndex, $edge->next->pointIndex, $terminus->trail->paths[$terminus->pathIndex]->points);

    insertNode ($type, $terminus, $cost1, $cost2, $graph);

}


function findRoute ($graph)
{
    $foundEnd = false;
    $bestCost = null;

    $nodes = [];

    array_push($nodes, (object)[
        "index" => "start"
    ]);

    while (count($nodes) > 0)
    {
        // Sort the nodes from lowest cost to highest cost
        usort($nodes, function ($a, $b) use ($graph)
        {
            if ($graph->nodes[$a->index]->cost < $graph->nodes[$b->index]->cost)
            {
                return -1;
            }

            if ($graph->nodes[$a->index]->cost > $graph->nodes[$b->index]->cost)
            {
                return 1;
            }

            return 0;
        });

        error_log ("Node queue:");
        foreach ($nodes as $node)
        {
            $msg = "index: " . $node->index;

            $msg .= " {";
            if (isset($graph->nodes[$node->index]->edges))
            {
                foreach ($graph->nodes[$node->index]->edges as $edgeIndex)
                {
                    $msg .= $edgeIndex . ",";
                }
            }
            $msg .= "}";

            error_log ("\t" . $msg);
        }

        error_log ("End of Node queue");

//         error_log("current node queue:");
//         var_dump($nodes);

        // Pop off a node from the queue
        $nodeIndex = $nodes[0]->index;
        array_splice($nodes, 0, 1);

        $node = $graph->nodes[$nodeIndex];

        // For each edge connected to this node...
        foreach ($node->edges as $edgeIndex)
        {
            list ($foundEnd, $cost) = traverseEdge($edgeIndex, $nodeIndex, $bestCost, $graph, $nodes);

            if ($foundEnd)
            {
                if (!isset($bestCost) || $bestCost === null)
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
}

function generateAnchors ($graph)
{
    $newAnchors = [ ];

    $nodeIndex = "end";

    while (isset($nodeIndex))
    {
        $node = $graph->nodes[$nodeIndex];
        error_log("node index: " . $nodeIndex);

        $anchor = (object)[ ];

        $anchor->point = $node->point;

        if (isset($prevEdge))
        {
            // Add the information to get to the next node
            $anchor->next = (object)[ ];
            $anchor->next->line_id = $prevEdge->line_id;

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
            error_log("edge index : " . $node->bestEdge);

            $anchor->prev = (object)[ ];
            $anchor->prev->line_id = $edge->line_id;

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

    return $newAnchors;
}


function findPath ($start, $end, $dumpGraph = false)
{
    $startResult = Map::getTrailFromPoint($start);

    error_log("Start Information");
    logTerminusInfo($startResult);

    $endResult = Map::getTrailFromPoint($end);

    error_log("End Information");
    logTerminusInfo($endResult);

//     $startTile = Map::getTileNameFromPoint($startResult->point);
//     $endTile = Map::getTileNameFromPoint($endResult->point);

    // Create an empty graph
    $graph = (object)["nodes" => [], "edges" => [], "splits" => [], "splitEdgeSeq" => -1];

    setupTerminusNode ($startResult, "start", $graph);//, $startTile);
    setupTerminusNode ($endResult, "end", $graph);

    findRoute ($graph);

    $newAnchors = generateAnchors($graph);

    if ($dumpGraph)
    {
        dumpEdges ($graph);
        dumpBestEdgeNodes ($graph);
    }

    return $newAnchors;
}
