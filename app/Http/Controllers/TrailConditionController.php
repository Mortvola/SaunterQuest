<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\TrailCondition;

class TrailConditionController extends Controller
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
        $userHikeId = $request->input('id');
        
        $trailConditions = TrailCondition::where ('userHikeId', $userHikeId)->get ();
        
        return $trailConditions;
    }
}
