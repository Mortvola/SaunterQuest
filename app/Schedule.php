<?php

namespace App;

require_once app_path('routeFile.php');
require_once app_path('calculate.php');

use bpp\Day;


class Schedule
{
    private $days = [];
    private $currentDay = -1;
    
    public static function get ($userId, $userHikeId)
    {
        $points = getRoutePointsFromUserHike($userHikeId);
        
        $schedule = \bpp\getSchedule($userId, $userHikeId, $points);
        
        return json_encode($schedule->days);
    }
    
    public function nextDay ()
    {
        $this->currentDay++;
    }
    
    public function &dayGet ($d)
    {
        if (!isset($this->days[$d])) {
            $this->days[$d] = new Day();
        }
        
        return $this->days[$d];
    }
    
    public function &currentDayGet ()
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
}
