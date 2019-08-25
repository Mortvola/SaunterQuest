<?php

namespace App;

require_once app_path('routeFile.php');
require_once app_path('calculate.php');

class Schedule
{
    public static function get ($userId, $userHikeId)
    {
        $points = getRoutePointsFromUserHike($userHikeId);
        
        $day = \bpp\getSchedule($userId, $points);
        
        return json_encode($day);
    }
}
