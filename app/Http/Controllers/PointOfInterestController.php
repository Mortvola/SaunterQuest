<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\PointOfInterest;

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
        $userHikeId = $_GET["id"];
        
        return PointOfInterest::get($userHikeId);
    }
    
    public function post ()
    {
        $pointOfInterest = json_decode(file_get_contents("php://input"));
        
        return PointOfInterest::post ($pointOfInterest);
    }

    public function put ()
    {
        $pointOfInterest = json_decode(file_get_contents("php://input"));
        
        return PointOfInterest::put ($pointOfInterest);
    }
    
    public function delete ()
    {
        $pointOfInterest = json_decode(file_get_contents("php://input"));
        
        return PointOfInterest::delete ($pointOfInterest);
    }
}
