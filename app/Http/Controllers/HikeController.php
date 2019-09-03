<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Hike;

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
    
    public function post (Request $request)
    {
        $name = $request->input ()[0];
        $userId = Auth::user()->id;
        
        $hike = new Hike ([
                "userId" => $userId,
                "name" => $name]);
        
        $hike->save ();
        
        // Create data directory and save an empty route file.
        mkdir(getHikeFolder ($hike->id));
        touch(getHikeFolder ($hike->id) . "route.json");
        
        return $hike;
    }

    public function delete (Request $request)
    {
        $hikeId = $request->input ();
        
        Hike::where('id', $hikeId)->delete ();
    }
}
