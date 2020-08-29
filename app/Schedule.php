<?php
namespace App;
require_once app_path('routeFile.php');
require_once app_path('calculate.php');

use App\Hike;
use bpp\Day;
use App\HikerProfile;
use Illuminate\Support\Facades\Auth;

class Schedule
{

    private $userId;

    private $hike;

    private $days = [ ];

    private $currentDay = -1;

    private $hikerProfiles;

    public function __construct ($userId, Hike $hike)
    {
        $this->userId = $userId;
        $this->hike = $hike;

        $this->hikerProfiles = HikerProfile::where('hike_id', $this->hike->id)->get();
    }

    public function get ()
    {
        if (!$this->hike->schedule_params_modified)
        {
             $this->retrieveSchedule ();

             if (count($this->days) >= 2)
             {
                 return $this->days;
             }
        }
        else
        {
            $route = new Route($this->hike->id, true);

            if ($route->verifyAnchors() && $route->anchorCount() >= 2)
            {
                \bpp\getSchedule($this, $this->userId, $this->hike->id, $route);

                $this->storeSchedule();

                return $this->days;
            }
        }

        return 0;
    }

    public function getDuration ()
    {
        if (!$this->hike->schedule_params_modified)
        {
            $this->retrieveSchedule ();

            if (count($this->days) >= 2)
            {
                return count($this->days);
            }
        }

        $route = new Route($this->hike->id, true);

        if ($route->verifyAnchors() && $route->anchorCount() >= 2)
        {
            \bpp\getSchedule($this, $this->userId, $this->hike->id, $route);

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

    public function daySet ($d, $day)
    {
        $this->days[$d] = $day;
    }

    public function currentDayGet ()
    {
        return $this->dayGet($this->currentDay);
    }

    public function currentDayReset ($day)
    {
        $this->daySet($this->currentDay, $day);
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
        $hikerProfile->startTime = intval(Auth::user()->start_time * 60);
        $hikerProfile->endTime = intval(Auth::user()->end_time * 60);
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
                    $hikerProfile->startTime = intval($profile->start_time * 60);
                }

                if (isset($profile->end_time))
                {
                    $hikerProfile->endTime = intval($profile->end_time * 60);
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
        \DB::table('schedule')->where('hike_id', $this->hike->id)->delete ();

        $order = 0;

        foreach ($this->days as $day)
        {
            $point = $day->pointGet ();

            \DB::table('schedule')->insert ([
                'hike_id' => $this->hike->id,
                'start_time' => $day->startTimeGet (),
                'elapsed_time' => intval($day->elapsedTimeGet ()),
                'start_meters' => $day->startMetersGet (),
                'meters' => $day->metersGet (),
                'way' => \DB::raw('ST_Transform(ST_SetSRID(ST_MakePoint(' . $point->lng . ',' . $point->lat . ', ' . $point->ele. '), 4326), 3857)'),
                'gain' => $day->gainGet (),
                'loss' => $day->lossGet (),
                'sort_order' => $order++
            ]);
        }

        $this->hike->schedule_params_modified = false;
        $this->hike->save ();
    }

    private function retrieveSchedule ()
    {
        $result = \DB::table('schedule')->select([
            'start_time',
            'elapsed_time',
            'start_meters',
            'meters',
            \DB::raw("ST_AsGeoJSON(ST_Transform(way, 4326))::json->'coordinates' as coordinates"),
            'gain',
            'loss'])
            ->where ('hike_id', $this->hike->id)
            ->orderBy('sort_order')
            ->get ();

        foreach ($result as $r)
        {
            $coordinates = json_decode($r->coordinates);
            $point = (object)["lat" => $coordinates[1], "lng" => $coordinates[0], "ele" => $coordinates[2]];

            $this->days[] = Day::load ($r->start_time, $r->elapsed_time, $r->start_meters, $r->meters, $point, $r->gain, $r->loss);
        }
    }
}
