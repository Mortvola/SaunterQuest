<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Tile;

class TrailController extends Controller
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
    public function getList(Request $request)
    {
        $bounds = $request->input('b');
        
        $bounds = explode(",", $bounds);
        
        
        return Tile::getTileList($bounds);
    }
    
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function get(Request $request)
    {
        $name = $request->input('n');
        
        $trail = new Tile($name);
        
        return $trail->get();
    }
}
