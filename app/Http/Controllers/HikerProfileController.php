<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\HikerProfile;

function ifNotSetOrEmpty ($value, $alternate)
{
    if (!isset ($value) || $value === null || $value === '')
    {
        return $alternate;
    }

    return $value;
}


class HikerProfileController extends Controller
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
        return HikerProfile::where ('hike_id', $hikeId)->get ();
    }

    public function post ($hikeId, Request $request)
    {
        $hikerProfile = json_decode($request->getContent());

        $profile = new HikerProfile ([
                "start_day" => ifNotSetOrEmpty($hikerProfile->startDay, null),
                "end_day" => ifNotSetOrEmpty($hikerProfile->endDay, null),
                "speed_factor" => ifNotSetOrEmpty($hikerProfile->speedFactor, null),
                "start_time" => ifNotSetOrEmpty($hikerProfile->startTime, null),
                "end_time" => ifNotSetOrEmpty($hikerProfile->endTime, null),
                "break_duration" => ifNotSetOrEmpty($hikerProfile->breakDuration, null),
                "hike_id" => $hikeId]);

        $profile->save ();

        return $profile;
    }

    public function put ($hikeId, $hikerProfileId, Request $request)
    {
        $hikerProfile = json_decode($request->getContent());

        $profile = HikerProfile::find ($hikerProfileId);

        $profile->start_day = ifNotSetOrEmpty($hikerProfile->startDay, null);
        $profile->end_day = ifNotSetOrEmpty($hikerProfile->endDay, null);
        $profile->speed_factor = ifNotSetOrEmpty($hikerProfile->speedFactor, null);
        $profile->start_time = ifNotSetOrEmpty($hikerProfile->startTime, null);
        $profile->end_time = ifNotSetOrEmpty($hikerProfile->endTime, null);
        $profile->break_duration = ifNotSetOrEmpty($hikerProfile->breakDuration, null);

        $profile->save ();

        return $profile;
    }

    public function delete ($hikeId, $hikerProfileId)
    {
        HikerProfile::where('id', $hikerProfileId)->delete ();
    }
}
