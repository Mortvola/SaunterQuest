<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HikeController extends Controller
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
    
    public function get ()
    {
        $userId = Auth::user()->id;
        
        $hikes = Hike::where ('userId', $userId)->get ();
        
        return $hikes;
    }
    
}
