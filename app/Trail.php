<?php

namespace App;

require_once app_path('coordinates.php');

class Trail
{
    public static function getTrail ($bounds)
    {
        $parts = explode(",", $bounds);
        
        // todo: determine what sections the bounding rectangle covers and
        // return the trails in those sections.
        $lat = floatval($parts[0]) + (floatval($parts[2]) - floatval($parts[0])) / 2;
        $lng = floatval($parts[1]) + (floatval($parts[3]) - floatval($parts[1])) / 2;
        
        $fileName = "trails/" . getTrailFileName($lat, $lng, ".trails");
        
        $first = true;
        
        $response = '{ "bounds":[' . $parts[0] . ',' . $parts[1] . ',' . $parts[2] . ',' . $parts[3] . '],';
        $response .= '"trails":[';
        
        $handle = fopen(base_path($fileName), "rb");
        
        if ($handle) {
            for (;;) {
                $jsonString = fgets($handle);
                
                if (!$jsonString) {
                    break;
                }
                
                $trail = json_decode($jsonString);
                
                if (isset($trail)) {
                    if (isset($trail->routes)) {
                        $t = (object)[ "type" => $trail->type, "cn" => $trail->cn, "routes" => $trail->routes];
                        
                        if (isset ($trail->name))
                        {
                            $t->name = $trail->name;
                        }
                        
                        if (!$first) {
                            $response .= ",";
                        }
                        $first = false;
                        
                        $response .= json_encode($t);
                    }
                } else {
                    $response .= "Failed to JSON decode:\n";
                    $reponse .= $jsonString;
                }
            }
            
            fclose($handle);
        }
        
        $response .= "]";
        
        $response .= "}";
                
        return $response;
    }
}
