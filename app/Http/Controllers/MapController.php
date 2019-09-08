<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Map;


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
    
}
