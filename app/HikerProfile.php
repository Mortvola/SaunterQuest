<?php

namespace App;

class HikerProfile
{
    public static function get ($userId, $userHikeId)
    {
        $output = \DB::select (\DB::raw (
            "select id, startDay, endDay, speedFactor, startTime, endTime, breakDuration
			from hikerProfile
			where userId = :userId
			and userHikeId = :userHikeId"),
            array ("userId" => $userId, "userHikeId" => $userHikeId));
            
        return json_encode($output);
    }
}
