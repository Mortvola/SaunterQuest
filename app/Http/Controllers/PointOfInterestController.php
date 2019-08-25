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
}
