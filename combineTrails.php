<?php

require_once "coordinates.php";

$continueCount = 0;
$maxDistance = 30;
$mind12;
$mind34;

function combineTrails($trails)
{
    global $maxDistance;
    global $mind12, $mind34;
    
    $combinedTrails = 0;
    
    // Loop through the stored trails and try to combine them
    //
    while (count($trails) > 0) {
        $combinedTrail = $trails[0];
        array_splice($trails, 0, 1);
        $trails = array_values($trails);
        
        unset($d);
        
        for ($t = 0; $t < count($trails);) {
            $d1 = haversineGreatCircleDistance(
                $trails[$t]->route[0]->lat,
                $trails[$t]->route[0]->lng,
                $combinedTrail->route[count($combinedTrail->route) - 1]->lat,
                $combinedTrail->route[count($combinedTrail->route) - 1]->lng
            );
            
            $d2 = haversineGreatCircleDistance(
                $trails[$t]->route[count($trails[$t]->route) - 1]->lat,
                $trails[$t]->route[count($trails[$t]->route) - 1]->lng,
                $combinedTrail->route[0]->lat,
                $combinedTrail->route[0]->lng
            );
            
            $d3 = haversineGreatCircleDistance(
                $trails[$t]->route[count($trails[$t]->route) - 1]->lat,
                $trails[$t]->route[count($trails[$t]->route) - 1]->lng,
                $combinedTrail->route[count($combinedTrail->route) - 1]->lat,
                $combinedTrail->route[count($combinedTrail->route) - 1]->lng
            );
            
            $d4 = haversineGreatCircleDistance(
                $trails[$t]->route[0]->lat,
                $trails[$t]->route[0]->lng,
                $combinedTrail->route[0]->lat,
                $combinedTrail->route[0]->lng
            );
            
            // if this trail starts where the combined when ends then combine them.
            if ($d1 < $maxDistance) {
                // Append the array to the combined one.
                array_splice($combinedTrail->route, count($combinedTrail->route), 0, $trails[$t]->route);
                $combinedTrail->route = array_values($combinedTrail->route);
                
                // Delete this trail from the array of trails now that it is combined
                array_splice($trails, $t, 1);
                $trails = array_values($trails);
                
                $t = 0;
            } elseif ($d2 < $maxDistance) {
                // Insert the array in front of the combined one.
                array_splice($combinedTrail->route, 0, 0, $trails[$t]->route);
                $combinedTrail->route = array_values($combinedTrail->route);
                
                // Delete this trail from the array of trails now that it is combined
                array_splice($trails, $t, 1);
                $trails = array_values($trails);
                $t = 0;
            } elseif ($d3 < $maxDistance) {
                array_splice($combinedTrail->route, count($combinedTrail->route), 0, array_reverse($trails[$t]->route));
                $combinedTrail->route = array_values($combinedTrail->route);
                
                // Delete this trail from the array of trails now that it is combined
                array_splice($trails, $t, 1);
                $trails = array_values($trails);
                $t = 0;
            } elseif ($d4 < $maxDistance) {
                array_splice($combinedTrail->route, 0, 0, array_reverse($trails[$t]->route));
                $combinedTrail->route = array_values($combinedTrail->route);
                
                // Delete this trail from the array of trails now that it is combined
                array_splice($trails, $t, 1);
                $trails = array_values($trails);
                $t = 0;
            } else {
                $d12 = min($d1, $d2);
                $d34 = min($d3, $d4);
                $t++;
            }
        }
        
        if (isset($d12)) {// && $d < $maxDistance)
            if (isset($mind12)) {
                $mind12 = min($mind12, $d12);
            } else {
                $mind12 = $d12;
            }
        }

        if (isset($d34)) {// && $d < $maxDistance)
            if (isset($mind34)) {
                $mind34 = min($mind34, $d34);
            } else {
                $mind34 = $d34;
            }
        }
        
        $combinedTrails++;
        //echo "Trails combined\n";
        // Save the consolidated trail
        echo json_encode($combinedTrail) . "\n";
    }

//  if ($combinedTrails > 1)
//  {
//      echo $combinedTrails, "\n";
//  }
}


function parseJSON($inputFile)
{
    $handle = fopen($inputFile, "rb");
    
    if ($handle) {
        $trails = [];
        
        for (;;) {
            $jsonString = fgets($handle);
            
            if (!$jsonString) {
                break;
            }
            
            $trail = json_decode($jsonString);
        
            if (isset($trail)) {
                if (isset($trail->route)) {
                    if (count($trails) == 0 || $trails[0]->cn == $trail->cn) {
                        array_push($trails, $trail);
                    } else {
                        //echo "Found ", count($trails), " with the same CN\n";
                        
                        // save current trail for next iteration of combining.
                        $nextTrail = $trail;
                        
                        if (count($trails) > 0) {
                            combineTrails($trails);
                        }
                        
                        $trails = [];
                        array_push($trails, $nextTrail);
                    }
                }
            }
        }
        
        if (count($trails) > 0) {
            combineTrails($trails);
        }
        
        fclose($handle);
    } else {
        //echo "Could not open file $fileName\n";
    }
}

if (isset($argv[1])) {
    parseJSON($argv[1]);
}

//parseJSON ("roads.sorted.json");

// echo "mind12 = $mind12\n";
// echo "mind34 = $mind34\n";
