<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\HikerProfile;

function ifNotSetOrEmpty ($value, $alternate)
{
    if (!isset ($value) || $value == null || $value == '')
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

    public function post (Request $request)
    {
        $hikerProfile = (object)$request->input ();

        $profile = new HikerProfile ([
                "startDay" => ifNotSetOrEmpty($hikerProfile->startDay, null),
                "endDay" => ifNotSetOrEmpty($hikerProfile->endDay, null),
                "speedFactor" => ifNotSetOrEmpty($hikerProfile->speedFactor, null),
                "startTime" => ifNotSetOrEmpty($hikerProfile->startTime, null),
                "endTime" => ifNotSetOrEmpty($hikerProfile->endTime, null),
                "breakDuration" => ifNotSetOrEmpty($hikerProfile->breakDuration, null),
                "userHikeId" => $hikerProfile->userHikeId]);

        $profile->save ();

        return $profile;
    }

    public function put (Request $request)
    {
        $hikerProfile = (object)$request->input ();

        $profile = HikerProfile::find ($hikerProfile->id);

        $profile->startDay = ifNotSetOrEmpty($hikerProfile->startDay, null);
        $profile->endDay = ifNotSetOrEmpty($hikerProfile->endDay, null);
        $profile->speedFactor = ifNotSetOrEmpty($hikerProfile->speedFactor, null);
        $profile->startTime = ifNotSetOrEmpty($hikerProfile->startTime, null);
        $profile->endTime = ifNotSetOrEmpty($hikerProfile->endTime, null);
        $profile->breakDuration = ifNotSetOrEmpty($profile->breakDuration, null);

        $profile->save ();

        return $profile;
    }

    public function delete (Request $request)
    {
        $hikerProfileId = $request->input ();

        HikerProfile::where('id', $hikerProfileId)->delete ();
    }
}
