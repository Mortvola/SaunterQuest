<?php

$nodesToDraw = [];

function dump_node($nodeIndex, $graph)
{
    if (isset($nodeIndex)) {
        error_log("---------------");
        error_log("Node Index: " . $nodeIndex);

        $node = &$graph->nodes[$nodeIndex];

        error_log("Number of edges: " . count($node->edges));

        for ($i = 0; $i < count($node->edges); $i++) {
            $edge = &$graph->edges[$node->edges[$i]];

            if (isset($edge->file)) {
                error_log("edge index: " . $node->edges[$i] . ", route to file " . $edge->file . ". " . isset($edge->visited));
            } else {
                if (!isset($edge->prev->nodeIndex)) {
                    error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . isset($edge->visited));
                } elseif ($edge->prev->nodeIndex != $nodeIndex) {
                    error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->prev->nodeIndex . ". " . isset($edge->visited));
                }

                if (!isset($edge->next->nodeIndex)) {
                    error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . isset($edge->visited));
                } elseif ($edge->next->nodeIndex != $nodeIndex) {
                    error_log("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->next->nodeIndex . ". " . isset($edge->visited));
                }

                if (!isset($edge->next->nodeIndex) && !isset($edge->prev->nodeIndex)) {
                    error_log("edge index: " . $node->edges[$i] . ", no route");
                }

                error_log(json_encode($edge));
            }
        }
        error_log("---------------");
    }
}

function writeEdge ($edge, $color, $weight, $graph, $handle)
{
    global $nodesToDraw;
    static $deadEndCount = 0;

    if (isset($edge->type) && $edge->type == "connector") {
        $color = "red";
    }

    $attributes = ",color=" . $color . ",penwidth=" . $weight;

    if (isset($edge->file)) {
        fwrite($handle, "n" . $edge->nodeIndex . " -- " . $edge->file . " [ " . $attributes . "];\n");
    } else {
        $label = "label = \"" . $edge->cn . ":" . $edge->pathIndex . "\"";

        if (isset($edge->prev->nodeIndex) && isset($edge->next->nodeIndex)) {
            fwrite($handle, "n" . $edge->prev->nodeIndex . " -- n" . $edge->next->nodeIndex . " [ " . $label . $attributes . "];\n");
        }
        elseif (isset($edge->prev->nodeIndex)) {
            $deadEndCount++;
            fwrite($handle, "n" . $edge->prev->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $attributes . "];\n");
        } elseif (isset($edge->next->nodeIndex)) {
            $deadEndCount++;
            fwrite($handle, "n" . $edge->next->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $attributes . "];\n");
        }
    }

    if (isset ($edge->prev->nodeIndex))
    {
        if (!isset($graph->nodes[$edge->prev->nodeIndex]->done) || !$graph->nodes[$edge->prev->nodeIndex]->done)
        {
            $nodesToDraw[] = $edge->prev->nodeIndex;
            $graph->nodes[$edge->prev->nodeIndex]->done = true;
        }
    }

    if (isset ($edge->next->nodeIndex))
    {
        if (!isset($graph->nodes[$edge->next->nodeIndex]->done) || !$graph->nodes[$edge->next->nodeIndex]->done)
        {
            $nodesToDraw[] = $edge->next->nodeIndex;
            $graph->nodes[$edge->next->nodeIndex]->done = true;
        }
    }

    $edge->done = true;
}


function drawNodeEdges ($graph, $nodes, $handle)
{
    $newNodes = [];

    foreach ($nodes as $nodeIndex)
    {
        $node = $graph->nodes[$nodeIndex];

        foreach ($node->edges as $edgeIndex)
        {
            $edge = $graph->edges[$edgeIndex];

            if (!isset($edge->done) || !$edge->done)
            {
                writeEdge ($edge, "black", 1, $graph, $handle);

                if (isset($edge->prev->nodeIndex))
                {
                    $newNodes[] = $edge->prev->nodeIndex;
                }

                if (isset($edge->next->nodeIndex))
                {
                    $newNodes[] = $edge->next->nodeIndex;
                }
            }
        }
    }

    return $newNodes;
}


function writeNodeAttributes ($graph, $handle)
{
    global $nodesToDraw;

    foreach ($nodesToDraw as $nodeIndex)
    {
        $node = $graph->nodes[$nodeIndex];

        $color = "";

        if (isset($node->fileConnections))
        {
            $color = 'color=blue';
        }

//        fwrite($handle, "n" . $nodeIndex . ' [ pos="' . $node->lat . ',' . $node->lng . '!"' . "];\n");
        fwrite($handle, "n" . $nodeIndex . ' [ ' . $color . "];\n");
    }
}


function dumpGraph($graph, $cn, $pathIndex, $depth)
{
    $handle = fopen("graph.dot", "wb");

    if ($handle) {

        fwrite($handle, "graph G {\n");

//      for ($i = 0; $i < count($graph->nodes); $i++)
//      {
//          $node = $graph->nodes[$i];

//          fwrite ($handle, "n" . $i . " [ pos = \"" . $node->lng * 400 . "," . $node->lat * 400 . "!\" ];\n");
//      }

        $nodes = [];

        for ($i = 0; $i < count($graph->edges); $i++) {
            $edge = $graph->edges[$i];

            if ($edge->cn != $cn)// || $edge->pathIndex != $pathIndex)
            {
            	continue;
            }

            writeEdge ($edge, "green", 3, $graph, $handle);

            if (isset($edge->prev->nodeIndex))
            {
                $nodes[] = $edge->prev->nodeIndex;
            }

            if (isset($edge->next->nodeIndex))
            {
                $nodes[] = $edge->next->nodeIndex;
            }
        }

        while (count($nodes) > 0)
        {
            $nodes = drawNodeEdges ($graph, $nodes, $handle);

            $depth--;

            if ($depth <= 0)
            {
                break;
            }
        }

        writeNodeAttributes ($graph, $handle);

        fwrite($handle, "}\n");

        fclose($handle);
    }
}


if (isset($argv[1]) && isset($argv[2]))
{
    $graph = json_decode(file_get_contents($argv[1]));

//    dump_node(58, $graph);

    dumpGraph($graph, $argv[2], 3, 2);
}
