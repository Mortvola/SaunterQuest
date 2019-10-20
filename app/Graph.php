<?php
namespace App;

use App\Map;
use App\Elevation;

require_once app_path("utilities.php");

class Graph
{

    static public function getGraphFromPoint ($point, $dumpGraph = false)
    {
        $deadEndCount = 0;

        if ($dumpGraph)
        {
            $handle = fopen("graph.dot", "wb");
        }

        if (!$dumpGraph || $handle)
        {
            if ($dumpGraph)
            {
                fwrite($handle, "graph G {\n");
            }

            $result = Map::getTrailFromPoint ($point);

            $graph = (object)["nodes" => [], "edges" => []];

            $graph->edges[$result->id] = $result;

            $depth = 0;
            $maxDepth = 5;
            $count = 0;

            $color = "green";

            for (;;)
            {
                $edgeCount = count($graph->edges);

                foreach ($graph->edges as $edge)
                {
                    if (!isset($edge->visited) || !$edge->visited)
                    {
                        if ($dumpGraph)
                        {
                            Graph::drawEdge ($handle, $edge, $color);
                            $color = "black";
                        }

                        if ($edge->start_node !== null)
                        {
                            Graph::loadNode ($edge->start_node, $edge->id, $graph);
                        }
                        else
                        {
                            $nodeId = 'DE' . $deadEndCount++;
                            $deadEndNode = (object)[];

                            $deadEndNode->point = Map::getPointOnLine ($edge->line_id, $edge->start_fraction);

                            $graph->nodes[$nodeId] = $deadEndNode;

                            $edge->start_node = $nodeId;
                        }

                        if ($edge->end_node !== null)
                        {
                            Graph::loadNode ($edge->end_node, $edge->id, $graph);
                        }
                        else
                        {
                            $nodeId = 'DE' . $deadEndCount++;
                            $deadEndNode = (object)[];

                            $deadEndNode->point = Map::getPointOnLine ($edge->line_id, $edge->end_fraction);

                            $graph->nodes[$nodeId] = $deadEndNode;

                            $edge->end_node = $nodeId;
                        }

                        $edge->visited = true;

                        $count++;
                    }
                }

                error_log ('new edge count: ' . count($graph->edges));

                if (count($graph->edges) <= $edgeCount)
                {
                    break;
                }

                $depth++;
                if ($depth > $maxDepth)
                {
                    break;
                }
            }

            if ($dumpGraph)
            {
                fwrite($handle, "}\n");

                fclose($handle);
            }

            return $graph;
        }
    }

    static private function drawEdge ($handle, $edge, $color)
    {
        static $deadEndCount = 0;

        $label = "label = \"" . $edge->id . ":" . $edge->line_id . "\"";

        if (isset($edge->start_node))
        {
            fwrite($handle, "n" . $edge->start_node);
        }
        else
        {
            fwrite($handle, "DE" . $deadEndCount++);
        }

        fwrite ($handle, " -- ");

        if (isset($edge->end_node))
        {
            fwrite($handle, "n" . $edge->end_node);
        }
        else
        {
            fwrite($handle, "DE" . $deadEndCount++);
        }

        fwrite ($handle, " [ " . $label . " color = " . $color . " ]\n");
    }

    static function costBetweenNodes ($nodeIndex1, $nodeIndex2, $graph)
    {
        $node1 = $graph->nodes[$nodeIndex1];
        $node2 = $graph->nodes[$nodeIndex2];

        $distance = haversineGreatCircleDistance ($node1->point->lat, $node1->point->lng, $node2->point->lat, $node2->point->lng);

        return $distance / metersPerHourGet(0, $distance);
    }


    static public function loadNode ($nodeId, $edgeId, $graph, $endType)
    {
        // Load the node if the node index is valid and it isn't already loaded
        if (isset ($nodeId) && !isset($graph->nodes[$nodeId]))
        {
//            error_log ('loading node id ' . $nodeId);

            $sql = "select ST_AsGeoJSON(ST_Transform(way, 4326)) AS point
            from nav_nodes
            where id = :nodeId:";

            $node = \DB::connection('pgsql')->select (str_replace (":nodeId:", $nodeId, $sql));

            $coordinates = json_decode($node[0]->point)->coordinates;

            $newNode = (object)[
                "edges" => [$edgeId],
                "point" => (object)["lat" => $coordinates[1], "lng" => $coordinates[0]],
                "cost" => []
            ];

            $graph->nodes[$nodeId] = $newNode;

            $newNode->costToEnd[$endType] =  Graph::costBetweenNodes($nodeId, $endType, $graph);

            // Load the edges at the start and end nodes associated with this node.
            $sql = "select id, start_node, end_node, start_fraction, end_fraction, forward_cost, backward_cost, line_id
                from nav_edges
                where (start_node = :nodeId: OR end_node = :nodeId:)
                and id != :edgeId:";

            $edges = \DB::connection('pgsql')->select (str_replace(":nodeId:", $nodeId, str_replace (":edgeId:", $edgeId, $sql)));

//            error_log ('selected ' . count($edges) . ' edges.');

            foreach ($edges as $edge)
            {
                $edgeId = $edge->id;

                // If this edge was previously split...
                while (isset($graph->splits[$edgeId]))
                {
                    $split = $graph->splits[$edgeId];

                    if ($split->start_node == $nodeId)
                    {
                        $edgeId = $split->startEdgeIndex;
                    }
                    else
                    {
                        $edgeId = $split->endEdgeIndex;
                    }
                }

                // If the edge is not already in the edge array then add it.
                if (!isset ($graph->edges[$edgeId]))
                {
                    $graph->edges[$edgeId] = $edge;
                }
                else
                {
                    $edge = $graph->edges[$edgeId];
                }

                if (isset($graph->nodes[$edge->start_node]) &&
                    !array_search($edgeId, $graph->nodes[$edge->start_node]->edges))
                {
                    $graph->nodes[$edge->start_node]->edges[] = $edgeId;
                }

                if (isset($graph->nodes[$edge->end_node]) &&
                    !array_search($edgeId, $graph->nodes[$edge->end_node]->edges))
                {
                    $graph->nodes[$edge->end_node]->edges[] = $edgeId;
                }
            }
        }
    }

    static public function computeLineSubstringCost ($lineId, $startFraction, $endFraction)
    {
        $line = \DB::table('planet_osm_line')
            ->select (
                \DB::raw ('ST_AsGeoJSON(ST_Transform(ST_LineSubString(way, ' . $startFraction . ', ' . $endFraction . '), 4326)) as line'))
            ->where('line_id', $lineId)
            ->get ();

        $lineString = json_decode($line[0]->line);

        return Graph::computeCosts ($lineString->coordinates);
    }

    static public function fixupEdgeCosts ()
    {
        $updates = 0;

        $edges = \DB::table('nav_edges')
            ->join ('planet_osm_line', 'nav_edges.line_id', '=', 'planet_osm_line.line_id')
            ->select (
                'id',
                'forward_cost',
                'backward_cost',
                \DB::raw ('ST_AsGeoJSON(ST_Transform(ST_LineSubString(way, start_fraction, end_fraction), 4326)) as line'))->get ();

        foreach ($edges as $edge)
        {
            $lineString = json_decode($edge->line);

            list ($forwardCost, $backwardCost) = Graph::computeCosts ($lineString->coordinates);

            if ($forwardCost != $edge->forward_cost || $backwardCost != $edge->backward_cost)
            {
                \DB::table('nav_edges')
                ->where('id', $edge->id)
                ->update([
                    "forward_cost" => $forwardCost,
                    "backward_cost" => $backwardCost
                ]);

                $updates++;
            }
        }

        return $updates;
    }

    static public function computeCosts ($points)
    {
        $forwardCost = 0;
        $backwardCost = 0;

        $elevation = new Elevation;

        for ($p = 0; $p < count($points) - 1; $p++)
        {
            $dx = haversineGreatCircleDistance($points[$p][1], $points[$p][0], $points[$p + 1][1], $points[$p + 1][0]);

            if ($dx != 0)
            {
                $ele1 = $elevation->getElevation($points[$p][1], $points[$p][0]);
                $ele2 = $elevation->getElevation($points[$p + 1][1], $points[$p + 1][0]);

                $dh = $ele2 - $ele1;

                $forwardCost += $dx / metersPerHourGet($dh, $dx);
                $backwardCost += $dx / metersPerHourGet(-$dh, $dx);
            }
        }

        return [$forwardCost, $backwardCost];
    }

}
