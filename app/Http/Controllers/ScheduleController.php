<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Hike;
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

        if (isset($userId))
        {
            $hike = Hike::find($hikeId);

            if (isset($hike))
            {
                $schedule = new Schedule ($userId, $hike);

                return json_encode($schedule->get ());
            }
        }
    }
}
