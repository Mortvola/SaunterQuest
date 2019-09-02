<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Trail;

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
        
        
        return Trail::getTileList($bounds);
    }
    
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function get(Request $request)
    {
        $name = $request->input('n');
        
        return Trail::getTile($name);
    }
}
