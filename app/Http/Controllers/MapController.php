<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Map;
use App\Graph;

class MapController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function getTileList(Request $request)
    {
        $bounds = $request->input('b');

        $bounds = explode(",", $bounds);

        $result = Map::getTileList($bounds);

        return json_encode($result);
    }

    public function getIntersections (Request $request)
    {
        $bounds = $request->input('b');

        $bounds = explode(",", $bounds);

        $result = Map::getIntersections($bounds);

        return json_encode($result);
    }

    public function getNearestTrail (Request $request)
    {
        $point = (object)[];
        $point->lat = doubleval($request->input('lat'));
        $point->lng = doubleval($request->input('lng'));

        $result = Map::getTrailFromPoint($point);

        return Map::getPath ($result->line_id, 0, 1);
    }

    public function getNearestGraph (Request $request)
    {
        $point = (object)[];
        $point->lat = doubleval($request->input('lat'));
        $point->lng = doubleval($request->input('lng'));

        $graph = Graph::getGraphFromPoint($point);

        $graph->edges = array_values($graph->edges);

        return json_encode($graph);
    }

    public function getTrailByLineId ($lineId)
    {
        return Map::getPathFromLineId($lineId);
    }
}
