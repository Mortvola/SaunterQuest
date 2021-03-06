<?php
namespace App;
require_once app_path('routeFile.php');
require_once app_path('calculate.php');

use bpp\Day;
use App\HikerProfile;
use Illuminate\Support\Facades\Auth;

class Schedule
{

    private $userId;

    private $hikeId;

    private $days = [ ];

    private $currentDay = -1;

    private $hikerProfiles;

    public function __construct ($userId, $hikeId)
    {
        $this->userId = $userId;
        $this->hikeId = $hikeId;

        $this->hikerProfiles = HikerProfile::where('hike_id', $hikeId)->get();
    }

    public function get ()
    {
        $route = new Route($this->hikeId, true);

        if ($route->anchorCount() >= 2)
        {
            \bpp\getSchedule($this, $this->userId, $this->hikeId, $route);

            $this->storeSchedule();

            return $this->days;
        }
    }

    public function getDuration ()
    {
        $route = new Route($this->hikeId, true);

        if ($route->anchorCount() >= 2)
        {
            \bpp\getSchedule($this, $this->userId, $this->hikeId, $route);

            return count($this->days);
        }

        return 0;
    }

    public function nextDay ()
    {
        $this->currentDay++;
    }

    public function dayGet ($d)
    {
        if (!isset($this->days[$d]))
        {
            $this->days[$d] = new Day();
        }

        return $this->days[$d];
    }

    public function currentDayGet ()
    {
        return $this->dayGet($this->currentDay);
    }

    public function currentDayIndexGet ()
    {
        return $this->currentDay;
    }

    public function currentDaySet ($day)
    {
        if ($day < $this->currentDay)
        {
            array_splice($this->days, $day + 1);
        }

        $this->currentDay = $day;
    }

    public function currentDayDelete ()
    {
        $this->currentDaySet($this->currentDayIndexGet () - 1);
    }

    public function previousDayTotalMetersGet ()
    {
        if (isset($this->days[$this->currentDay - 1]))
        {
            return $this->days[$this->currentDay - 1]->totalMetersGet();
        }

        return 0;
    }

    public function activeHikerProfileGet ()
    {
        $hikerProfile = (object)[ ];

        $hikerProfile->speedFactor = Auth::user()->pace_factor;
        $hikerProfile->startTime = Auth::user()->start_time * 60;
        $hikerProfile->endTime = Auth::user()->end_time * 60;
        $hikerProfile->breakDuration = Auth::user()->break_duration;

        foreach ($this->hikerProfiles as $profile)
        {
            if ((!isset($profile->start_day) || $this->currentDay >= $profile->start_day) && (!isset($profile->end_day) || $this->currentDay <= $profile->end_day))
            {
                if (isset($profile->speed_factor))
                {
                    $hikerProfile->speedFactor = $profile->speed_factor;
                }

                if (isset($profile->start_time))
                {
                    $hikerProfile->startTime = $profile->start_time * 60;
                }

                if (isset($profile->end_time))
                {
                    $hikerProfile->endTime = $profile->end_time * 60;
                }

                if (isset($profile->break_duration))
                {
                    $hikerProfile->breakDuration = $profile->break_duration;
                }
            }
        }

        return $hikerProfile;
    }

    private function storeSchedule ()
    {
        // $fileName = getHikeFolder($this->hikeId) . "schedule.json";

        // file_put_contents($fileName, json_encode($this->days));
    }
}
