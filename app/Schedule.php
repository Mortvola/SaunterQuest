<?php

namespace App;

require_once app_path('routeFile.php');
require_once app_path('calculate.php');

use bpp\Day;
use App\HikerProfile;


class Schedule
{
    private $userId;
    private $hikeId;
    private $days = [];
    private $currentDay = -1;
    private $hikerProfiles;

    public function __construct ($userId, $hikeId)
    {
        $this->userId = $userId;
        $this->hikeId = $hikeId;

        $this->hikerProfiles = HikerProfile::where('hike_id', $hikeId)->get ();
    }

    public function get ()
    {
        $points = getRoutePointsFromUserHike($this->hikeId);

        if (count($points) >= 2)
        {
            \bpp\getSchedule($this, $this->userId, $this->hikeId, $points);

            $this->storeSchedule();

            return $this->days;
        }
    }

    public function getDuration ()
    {
        $points = getRoutePointsFromUserHike($this->hikeId);

        if (count($points) >= 2)
        {
            \bpp\getSchedule($this, $this->userId, $this->hikeId, $points);

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
        if (!isset($this->days[$d])) {
            $this->days[$d] = new Day();
        }

        return $this->days[$d];
    }

    public function currentDayGet ()
    {
        return $this->dayGet ($this->currentDay);
    }

    public function currentDayIndexGet ()
    {
        return $this->currentDay;
    }

    public function currentDaySet ($day)
    {
        $this->currentDay = $day;
    }

    public function previousDayTotalMetersGet ()
    {
        if (isset ($this->days[$this->currentDay - 1]))
        {
            return $this->days[$this->currentDay - 1]->totalMetersGet ();
        }

        return 0;
    }

    public function activeHikerProfileGet()
    {
        $hikerProfile = (object)[];

        $hikerProfile->speedFactor = 100;
        $hikerProfile->startTime = 8;
        $hikerProfile->endTime = 19;
        $hikerProfile->breakDuration = 1;

        foreach ($this->hikerProfiles as $profile) {
            if ((!isset($profile->startDay) || $this->currentDay >= $profile->startDay)
                    && (!isset($profile->endDay) || $this->currentDay <= $profile->endDay)) {
                        if (isset($profile->speedFactor)) {
                            $hikerProfile->speedFactor = $profile->speedFactor;
                        }

                        if (isset($profile->startTime)) {
                            $hikerProfile->startTime = $profile->startTime;
                        }

                        if (isset($profile->endTime)) {
                            $hikerProfile->endTime = $profile->endTime;
                        }

                        if (isset($profile->breakDuration)) {
                            $hikerProfile->breakDuration = $profile->breakDuration;
                        }
                    }
        }

        return $hikerProfile;
    }


    private function storeSchedule()
    {
        $fileName = getHikeFolder($this->hikeId) . "schedule.json";

        file_put_contents($fileName, json_encode($this->days));
    }



}
