<?php

namespace App\Console\Commands;
require_once app_path("utilities.php");
require_once app_path("coordinates.php");

use Illuminate\Console\Command;
use App\Tile;
use App\Graph;

class GenerateGraph extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tile:generateGraph {bounds}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generates the graph file for the provided tile';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    private function getIntersections ($intersections)
    {
        $intersection = (object)[
            "osmId" => $intersections->osmid,
            "ctId" => $intersections->ctid,
            "lineId" => $intersections->lineid,
            "fraction" => $intersections->fraction];

        return $intersection;
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        list($left,$bottom,$right,$top) = explode(',', $this->argument('bounds'));

        $left = intval($left);
        $bottom = intval($bottom);
        $right = intval($right);
        $top = intval($top);

        if ($left >= $right || $bottom >= $top)
        {
            throw new Exception("Malformed bounding box: (" . $left . ", " . $bottom . ")-(" . $right . ", " . $top . ")");
        }

        for ($y = $bottom; $y < $top; $y++)
        {
            for ($x = $left; $x < $right; $x++)
            {
                $this->findIntersections ($x, $y);
            }
        }
    }

    private function findIntersections ($lng, $lat)
    {

        $intersections = retrieveIntersections ($lng, $lat);

        $nodes = [];

        $bar = $this->output->createProgressBar(count($intersections));
        $bar->start();

        for ($i = 0; $i < count($intersections); $i++)
        {
            $node = (object)[];

            $coordinate = \json_decode($intersections[$i]->coordinates);

            $node->point = $coordinate->coordinates;

            $intersection = $this->getIntersections($intersections[$i]);

            $node->paths = [$intersection];

            for ($j = $i + 1; $j < count($intersections);)
            {
                $coordinate = \json_decode($intersections[$j]->coordinate);

                if ($node->point[0] == $coordinate->coordinates[0] &&
                    $node->point[1] == $coordinate->coordinates[1])
                {
                    $intersection = $this->getIntersections($intersections[$j]);

                    $found = false;

                    foreach ($node->paths as $path)
                    {
                        if ($path->osmId == $intersection->osmId
                            && $path->ctId == $intersection->ctId
                            && $path->lineId == $intersection->lineId
                            && $path->fraction == $intersection->fraction)
                        {
                            $found = true;
                            break;
                        }
                    }

                    if (!$found)
                    {
                        $node->paths[] = $intersection;
                    }

                    array_splice ($intersections, $j, 1);
                }
                else
                {
                    $j++;
                }
            }

            $nodes[] = $node;
            $bar->advance ();
        }

        $bar->finish ();
        error_log ("");

        $edges = [];

        $bar = $this->output->createProgressBar(count($nodes));
        $bar->start();

        for ($i = 0; $i < count($nodes); $i++)
        {
            $node1 = $nodes[$i];

            for ($k = 0; $k < count($node1->paths); $k++)
            {
                $path1 = $node1->paths[$k];

                if (!isset($path1->startConnected) || !isset($path1->endConnected))
                {
                    unset($bestStartPath);
                    unset($bestEndPath);

                    for ($j = $i + 1; $j < count($nodes); $j++)
                    {
                        $node2 = $nodes[$j];

                        for ($l = 0; $l < count($node2->paths); $l++)
                        {
                            $path2 = $node2->paths[$l];

                            if ($path1->ctId == $path2->ctId)
                            {
                                if (!isset($path1->startConnected) && !isset($path2->endConnected) && $path2->fraction < $path1->fraction)
                                {
                                    if (!isset($bestStartPath) || $path2->fraction > $bestStartPath->fraction)
                                    {
                                        $bestStartNode = $node2;
                                        $bestStartNodeIndex = $j;
                                        $bestStartPath = $path2;
                                    }
                                }

                                if (!isset($path1->endConnected) && !isset($path2->startConnected) && $path2->fraction > $path1->fraction)
                                {
                                    if (!isset($bestEndPath) || $path2->fraction < $bestEndPath->fraction)
                                    {
                                        $bestEndNode = $node2;
                                        $bestEndNodeIndex = $j;
                                        $bestEndPath = $path2;
                                    }
                                }
                            }
                        }
                    }

                    if (!isset($path1->startConnected))
                    {
                        if (isset($bestStartPath))
                        {
                            $bestStartPath->endConnected = true;

                            $edge = (object)[];

                            $edge->startNode = $bestStartNodeIndex;
                            $edge->endNode = $i;
                            $edge->osmId = $path1->osmId;
                            $edge->ctId = $path1->ctId;
                            $edge->lineId = $path1->lineId;
                            $edge->start = $bestStartPath->fraction;
                            $edge->end = $path1->fraction;

                            $edges[] = $edge;

                            addEdge ($node1, count($edges) - 1);
                            addEdge ($bestStartNode, count($edges) - 1);
                        }
                        else if ($path1->fraction > 0)
                        {
                            // Dead end path
                            $edge = (object)[];

                            $edge->endNode = $i;
                            $edge->osmId = $path1->osmId;
                            $edge->ctId = $path1->ctId;
                            $edge->lineId = $path1->lineId;
                            $edge->start = 0;
                            $edge->end = $path1->fraction;

                            $edges[] = $edge;

                            addEdge ($node1, count($edges) - 1);
                        }

                        $path1->startConnected = true;
                    }

                    if (!isset($path1->endConnected))
                    {
                        if (isset($bestEndPath))
                        {
                            $bestEndPath->startConnected = true;

                            $edge = (object)[];

                            $edge->startNode = $i;
                            $edge->endNode = $bestEndNodeIndex;
                            $edge->osmId = $path1->osmId;
                            $edge->ctId = $path1->ctId;
                            $edge->lineId = $path1->lineId;
                            $edge->start = $path1->fraction;
                            $edge->end = $bestEndPath->fraction;

                            $edges[] = $edge;

                            addEdge ($node1, count($edges) - 1);
                            addEdge ($bestEndNode, count($edges) - 1);
                        }
                        else if ($path1->fraction < 1)
                        {
                            // Dead end path
                            $edge = (object)[];

                            $edge->startNode = $i;
                            $edge->osmId = $path1->osmId;
                            $edge->ctId = $path1->ctId;
                            $edge->lineId = $path1->lineId;
                            $edge->start = $path1->fraction;
                            $edge->end = 1;

                            $edges[] = $edge;

                            addEdge ($node1, count($edges) - 1);
                        }

                        $path1->endConnected = true;
                    }
                }
            }

            $bar->advance ();
        }

        $bar->finish ();
        error_log ("");

        error_log ("edges = " . count($edges));

        $bar = $this->output->createProgressBar(count($edges));
        $bar->start();

        // Cost calculations
        for ($i = 0; $i < count($edges); $i++)
        {
            $line = \DB::connection('pgsql')->select (
                "select ST_AsGeoJSON(ST_Transform(ST_LineSubString(way, " . $edges[$i]->start . ", " . $edges[$i]->end ."), 4326)) as line
            from planet_osm_line where ctid = '" . $edges[$i]->ctId . "'");

            $lineString = json_decode($line[0]->line);

            list($edges[$i]->forwardCost, $edges[$i]->backwardCost) = Graph::computeCosts ($lineString->coordinates);

            $bar->advance();
        }

        $bar->finish ();
        error_log ("");

        $this->insertIntoDB ($nodes, $edges);

        fixupDeadEndStartNodeEdges ();
        fixupDeadEndEndNodeEdges ();
    }


    private function retrieveIntersections ($lng, $lat)
    {
        $bounds = [$lng, $lat, $lng + 1, $lat + 1];

        error_log("Finding intersections within (" . $lng . ", " . $lat . ")-(" . ($lng + 1) . ", " . ($lat + 1) . ")");

        $boundingBox = "ST_SetSRID(ST_MakeBox2D(ST_Transform('SRID=4326;POINT(" .
            $bounds[0] . " " . $bounds[1] . ")'::geometry, 3857), ST_Transform('SRID=4326;POINT(" .
            $bounds[2] . " " . $bounds[3] . ")'::geometry, 3857)), 3857)";

        $intersections = \DB::connection('pgsql')->select (
            "select
                ST_AsGeoJSON(ST_Transform(ST_Intersection(l1.way, l2.way), 4326)) coordinates,
                l1.ctid ctid,
                CASE WHEN GeometryType(ST_Intersection(l1.way, l2.way)) = 'POINT' THEN
                        ST_LineLocatePoint(l1.way, ST_Intersection(l1.way, l2.way))
                     ELSE
                        NULL
                END fraction,
                l1.osm_id osmid,
                l1.line_id lineid
            from planet_osm_line l1
            join planet_osm_line l2 on l1.ctid != l2.ctid and ST_Intersects(l1.way, l2.way) and l2.highway is not null
            where l1.highway is not null
            and l1.way && " . $boundingBox . "
            and l2.way && " . $boundingBox . "
            and ST_ContainsProperly (" . $boundingBox . ", ST_Intersection(l1.way, l2.way))"
        );

        // Iterate through the list of intersections and expand the ones that are of multipoint type
        for ($i = 0; $i < count($intersections);)
        {
            $coordinate = \json_decode($intersections[$i]->coordinates);

            if ($coordinate->type == "MultiPoint")
            {
                // Remove the record from the array
                $intersection = array_splice($intersections, $i, 1);

                // Create a new record for each point in the multipoint array
                for ($p = 0; $p < count($coordinate->coordinates); $p++)
                {
                    $point = "ST_Transform('SRID=4326;POINT(" . $p[0] . " " . $p[1] . ")'::geometry, 3857)";

                    $fraction = \DB::connection('pgsql')->select (
                        "select ST_LineLocatePoint(l1.way, " . $point . ") fraction
                             from planet_osm_line l1
                             where l1.line_id = " . $intersection[0].lineid
                        )->first ();

                    $intersection->coordinate = $p;
                    $intersection->fraction = $fraction[0];

                    array_splice($intersections, $i, 0, $intersection);
                    $i++;
                }
            }
            else
            {
                $intersections[$i]->coordinate = $coordinate->coordinates;
                $i++;
            }
        }

        return $intersections;
    }


    private function fixupDeadEndEndNodeEdges ()
    {
        $edges = \DB::connection('pgsql')->select ("
            select e1.id, e2.start_node AS new_end_node, e2.start_fraction AS new_end_fraction, e1.line_id,
                    ST_AsGeoJSON(ST_Transform(ST_LineSubString(way, e1.start_fraction, e2.start_fraction), 4326)) as line
            from nav_edges e1
            join nav_edges e2 on e2.line_id = e1.line_id and e2.id != e1.id and e2.start_fraction > e1.start_fraction
            join planet_osm_line line on line.line_id = e1.line_id
            where e1.end_node is null
            and e2.id in (
                select e3.id
                from nav_edges e3
                where e3.start_fraction > e1.start_fraction
                and e3.line_id = e1.line_id
                and e3.id != e1.id
                order by e3.end_fraction asc
                limit 1)");

        foreach ($edges as $edge)
        {
            $lineString = json_decode($edge->line);

            list ($forwardCost, $backwardCost) = Graph::computeCosts ($lineString->coordinates);

            \DB::table('nav_edges')
                ->where('id', $edge->id)
                ->update([
                    "end_node" => $edge->new_end_node,
                    "end_fraction" => $edge->new_end_fraction,
                    "forward_cost" => $forwardCost,
                    "backward_cost" => $backwardCost
                ]);
        }
    }

    private function fixupDeadEndStartNodeEdges ()
    {
        $edges = \DB::connection('pgsql')->select ("
            select e1.id, e2.end_node AS new_start_node, e2.end_fraction AS new_start_fraction, e1.line_id,
                    ST_AsGeoJSON(ST_Transform(ST_LineSubString(way, e2.end_fraction, e1.end_fraction), 4326)) as line
            from nav_edges e1
            join nav_edges e2 on e2.line_id = e1.line_id and e2.id != e1.id and e2.end_fraction < e1.end_fraction
            join planet_osm_line line on line.line_id = e1.line_id
            where e1.start_node is null
            and e2.id in (
                select e3.id
                from nav_edges e3
                where e3.end_fraction < e1.end_fraction
                and e3.line_id = e1.line_id
                and e3.id != e1.id
                order by e3.start_fraction desc
                limit 1)");

        foreach ($edges as $edge)
        {
            $lineString = json_decode($edge->line);

            list ($forwardCost, $backwardCost) = Graph::computeCosts ($lineString->coordinates);

            \DB::table('nav_edges')
            ->where('id', $edge->id)
            ->update([
                "start_node" => $edge->new_start_node,
                "start_fraction" => $edge->new_start_fraction,
                "forward_cost" => $forwardCost,
                "backward_cost" => $backwardCost
            ]);
        }
    }

    private function insertIntoDB ($nodes, $edges)
    {
        // Nodes into the table
        $bar = $this->output->createProgressBar(count($nodes));
        $bar->start();
        foreach ($nodes as $node)
        {
            $result = \DB::Connection('pgsql')->select ("insert into nav_nodes (way) values (ST_Transform('SRID=4326;POINT(" .
                $node->point[0] . " " . $node->point[1] . ")'::geometry, 3857)) returning id");

            $node->dbId = $result[0]->id;

            $bar->advance();
        }

        $bar->finish ();
        error_log ("");

        $bar = $this->output->createProgressBar(count($edges));
        $bar->start();
        foreach ($edges as $edge)
        {
            $columns = [
                "start_fraction" => $edge->start,
                "end_fraction" => $edge->end,
                "line_id" => $edge->lineId,
                "forward_cost" => $edge->forwardCost,
                "backward_cost" => $edge->backwardCost
            ];

            if (isset ($edge->startNode))
            {
                $columns["start_node"] = $nodes[$edge->startNode]->dbId;
            }

            if (isset ($edge->endNode))
            {
                $columns["end_node"] = $nodes[$edge->endNode]->dbId;
            }

            // Insert edge into table
            $navEdgeId = \DB::Connection('pgsql')->table('nav_edges')->insertGetId ($columns);

            // Update start node, if any, to reference edge.
            if (isset ($edge->startNode))
            {
                \DB::Connection('pgsql')->update("update nav_nodes set edges = array_cat (edges, '{" . $navEdgeId . "}') where id = " . $nodes[$edge->startNode]->dbId);
            }

            // Update end node, if any, to reference edge.
            if (isset ($edge->endNode))
            {
                \DB::Connection('pgsql')->update("update nav_nodes set edges = array_cat (edges, '{" . $navEdgeId . "}') where id = " . $nodes[$edge->endNode]->dbId);
            }

            $bar->advance();
        }

        $bar->finish ();
        error_log ("");

    }
}

function addEdge ($node, $edgeIndex)
{
    if (!isset($node->edges))
    {
        $node->edges = [];
    }

    $node->edges[] = $edgeIndex;
}

