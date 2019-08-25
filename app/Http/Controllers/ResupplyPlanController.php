<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\ResupplyPlan;

class resupplyPlanController extends Controller
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
        $userHikeId = $_GET["id"];
        
        return ResupplyPlan::get ($userId, $userHikeId);
    }
}
