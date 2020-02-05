<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function getProfile ()
    {
        return json_encode(Auth::user()->profile ());
    }

    public function putProfile (Request $request)
    {
        Auth::user()->end_hike_day_extension = $request->endHikeDayExtension;
        Auth::user()->pace_factor = $request->paceFactor;
        Auth::user()->start_time = $request->startTime;
        Auth::user()->end_time = $request->endTime;
        Auth::user()->break_duration = $request->breakDuration;
        Auth::user()->end_day_extension = $request->endDayExtension;

        Auth::user()->save ();
    }
}
