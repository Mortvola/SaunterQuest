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

    public function get ($hikeId)
    {
        $userId = Auth::user()->id;

        $schedule = new Schedule ($userId, $hikeId);

        return json_encode($schedule->get ());
    }
}
