<?php

namespace App;

require_once app_path("pointOfInterestUtils.php");

class PointOfInterest
{
    public static function get ($userHikeId)
    {
        $pointsOfInterest = \bpp\getPointsOfInterest($userHikeId);
        
        if (isset($pointsOfInterest)) {
            echo json_encode($pointsOfInterest);
        }
    }
}
