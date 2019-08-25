<?php

namespace App;

class TrailCondition
{
    public static function get ($userId, $userHikeId)
    {
        $output = \DB::select (\DB::raw (
            "select tc.trailConditionId, tc.hikeId, tc.userHikeId, startLat, startLng, endLat, endLng, type, description, speedFactor
			from trailCondition tc
			join userHike uh on (uh.userHikeId = tc.userHikeId OR uh.hikeId = tc.hikeId)
			and uh.userHikeId = :userHikeId and uh.userId = :userId"),
            array ("userId" => $userId, "userHikeId" => $userHikeId));
            
        return json_encode($output);
    }
}
