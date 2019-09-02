<?php

namespace App;

require_once app_path('coordinates.php');

class Trail
{
    
    public static function getTileList ($bounds)
    {
        $response = (object)[];
        
        list($response->tiles, $response->bounds) = getTileNames($bounds);
        
        return json_encode($response);
    }
       
    public static function getTile ($baseName)
    {
        $fileName = "trails/" . $baseName . ".trails";
        
        $response = '{ "name":"' . $baseName . '", "trails":[';

        if (file_exists(base_path($fileName)))
        {
            $handle = fopen(base_path($fileName), "rb");
            
            if ($handle) {
                $first = true;
                
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
        }
        
        $response .= ']}';
                
        return $response;
    }
}
