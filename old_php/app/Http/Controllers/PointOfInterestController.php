<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\PointOfInterest;
use App\TimeConstraint;

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
    public function get($hikeId)
    {
        $poi = PointOfInterest::get()->where ('hike_id', $hikeId);

        $poi->load('constraints');

        return $poi;
    }

    public function post ($hikeId, Request $request)
    {
        $pointOfInterest = json_decode($request->getContent());

        $poi = new PointOfInterest ([
            "name" => $pointOfInterest->name,
            "description" => $pointOfInterest->description,
            "lat" => $pointOfInterest->lat,
            "lng" => $pointOfInterest->lng,
            "hike_id" => $hikeId]);

        $poi->save ();

        if (isset($poi->id) && isset($pointOfInterest->constraints)) {

            foreach ($pointOfInterest->constraints as $constraint) {
                $poi->constraints()->create (["type" => $constraint->type, "time" => $constraint->time]);
            }
        }

        $poi->load('constraints');

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

        if (isset($pointOfInterest->constraints)) {

            for ($i = 0; $i < count($pointOfInterest->constraints); $i++) {
                $constraint = $pointOfInterest->constraints[$i];

                if (isset($constraint->id))
                {
                    $c = TimeConstraint::find($constraint->id);

                    if (isset($constraint->remove)) {
                        $c->delete ();
                    } else {

                        $c->type = $constraint->type;
                        $c->time = $constraint->time;

                        $c->save ();
                    }
                }
                else
                {
                    $poi->constraints()->create (["type" => $constraint->type, "time" => $constraint->time]);
                }
            }
        }

        $poi->load('constraints');

        return $poi;
    }

    public function delete ($hikeId, $poiId)
    {
        TimeConstraint::where('point_of_interest_id', $poiId)->delete ();
        PointOfInterest::where('id', $poiId)->delete ();
    }
}
