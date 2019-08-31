<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

require_once app_path("coordinates.php");

class ElevationController extends Controller
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
    
    public function get (Request $request)
    {
        $lat = $request->input('lat');
        $lng = $request->input('lng');
        
        $ele = getElevation($lat, $lng);
        
        return $ele;
    }
}
