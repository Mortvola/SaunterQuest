<?php

namespace App;

require_once app_path('routeFile.php');

class Route
{
    public static function get ($userHikeId)
    {
        $fileName = getRouteFileName($userHikeId);
        
        $segments = getRouteFromFile($fileName);
        
        if ($segments == null) {
            $segments = [];
        }
        
        return json_encode($segments);
    }
}
