<?php

namespace App;

require_once app_path('routeFile.php');
require_once app_path('calculate.php');

use bpp\Day;


class Schedule
{
    private $days = [];
    
    public static function get ($userId, $userHikeId)
    {
        $points = getRoutePointsFromUserHike($userHikeId);
        
        $schedule = \bpp\getSchedule($userId, $userHikeId, $points);
        
        return json_encode($schedule->days);
    }
    
    public function &dayGet ($d)
    {
        if (!isset($this->days[$d])) {
            $this->days[$d] = new Day();
        }
        
        return $this->days[$d];
    }
    
    public function previousDayTotalMetersGet ($d)
    {
        if (isset ($this->days[$d - 1]))
        {
            return $this->days[$d - 1]->totalMetersGet ();
        }

        return 0;
    }
}
