<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\ResupplyLocation;

class ResupplyLocationController extends Controller
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
        
        return ResupplyLocation::get ($userHikeId);
    }
}
