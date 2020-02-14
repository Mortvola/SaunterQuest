<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\PointOfInterest;
use App\TimeConstraint;
require_once app_path("utilities.php");


class PointOfInterestController extends Controller
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
    public function get()
    {
        $poi = PointOfInterest::all();

        return $poi;
    }

    public function post (Request $request)
    {
        $pointOfInterest = json_decode($request->getContent());

        $poi = new PointOfInterest ($this->getColumns($pointOfInterest));

        $poi->save ();

        return $poi;
    }

    public function put ($hikeId, $poiId, Request $request)
    {
        $pointOfInterest = json_decode($request->getContent());

        $poi = PointOfInterest::find ($poiId);

        $poi->lat = $pointOfInterest->lat;
        $poi->lng = $pointOfInterest->lng;
        $poi->name = $pointOfInterest->name;
        $poi->description = $pointOfInterest->description;

        $poi->save ();

        return $poi;
    }

    public function delete ($poiId)
    {
        PointOfInterest::where('id', $poiId)->delete ();
    }

    private function getColumns ($pointOfInterest)
    {
        $mapping = ["type" => "type", "name" => "name", "description" => "description", "lat" => "lat", "lng" => "lng"];

        $columns = [];

        foreach ($mapping as $key => $value)
        {
            if (isset($pointOfInterest->$value) && $pointOfInterest->$value != '')
            {
                $columns[$key] = $pointOfInterest->$value;
            }
        }

        return $columns;
    }
}
