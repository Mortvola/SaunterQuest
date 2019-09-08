<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Tile;

class TileController extends Controller
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
        $name = $request->input('n');
        
        $tile = new Tile($name);
        
        return $tile->get();
    }
}
