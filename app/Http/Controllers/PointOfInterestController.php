<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\PointOfInterest;
use App\PointOfInterestConstraint;

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
    public function get(Request $request)
    {
        $userHikeId = $request->input('id');
        
        $poi = PointOfInterest::get()->where ('userHikeId', $userHikeId);
        
        $poi->load('constraints');
        
        return $poi;
    }
    
    public function post (Request $request)
    {
        $pointOfInterest = (object)$request->input ();
        
        $poi = new PointOfInterest ([
            "name" => $pointOfInterest->name,
            "description" => $pointOfInterest->description,
            "lat" => $pointOfInterest->lat,
            "lng" => $pointOfInterest->lng,
            "userHikeId" => $pointOfInterest->userHikeId]);
        
        $poi->save ();
        
        if (isset($poi->id) && isset($pointOfInterest->constraints)) {
            
            foreach ($pointOfInterest->constraints as $constraint) {
                $poi->constraints()->create (["type" => $constraint->type, "time" => $constraint->time]);
            }
        }
        
        $poi->load('constraints');
        
        return $poi;
    }

    public function put (Request $request)
    {
        $pointOfInterest = (object)$request->input ();
        
        $poi = PointOfInterest::find ($pointOfInterest->id);
        
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
                    $c = PointOfInterestConstraint::find($constraint->id);
                    
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
    
    public function delete (Request $request)
    {
        $pointOfInterestId = $request->input ();
        
        PointOfInterestConstraint::where('pointOfInterestId', $pointOfInterestId)->delete ();
        PointOfInterest::where('id', $pointOfInterestId)->delete ();
    }
}
