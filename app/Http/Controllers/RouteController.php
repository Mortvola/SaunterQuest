<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Route;

class RouteController extends Controller
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
        $userHikeId = $_GET["id"];
        
        return Route::get ($userHikeId);
    }
}