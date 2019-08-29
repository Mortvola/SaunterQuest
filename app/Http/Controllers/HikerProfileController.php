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
    
    public function get ()
    {
        $userHikeId = $_GET["id"];
        
        $profiles = HikerProfile::where ('userHikeId', $userHikeId)->get ();
        
        return $profiles;
    }
    
    public function post ()
    {
        $hikerProfile = json_decode(file_get_contents("php://input"));
        
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
    
    public function put ()
    {
        $hikerProfile = json_decode(file_get_contents("php://input"));
        
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
    
    public function delete ()
    {
        $hikerProfileId = json_decode(file_get_contents("php://input"));
        
        HikerProfile::where('id', $hikerProfileId)->delete ();
    }
}
