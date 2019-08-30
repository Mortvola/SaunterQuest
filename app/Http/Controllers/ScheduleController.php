<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Schedule;

class ScheduleController extends Controller
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
        $userId = Auth::user()->id;
        $userHikeId = $request->input('id');
        
        $schedule = new Schedule ($userId, $userHikeId);
        
        return json_encode($schedule->get ());
    }
}
