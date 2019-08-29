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
    
    public static function post ($pointOfInterest)
    {
        $pointOfInterest->id = \DB::table ('pointOfInterest')->insertGetId (
            array (
                    "userHikeId" => $pointOfInterest->userHikeId,
                    "lat" => $pointOfInterest->lat,
                    "lng" => $pointOfInterest->lng,
                    "name" => $pointOfInterest->name,
                    "description" => $pointOfInterest->description));

        if (isset($pointOfInterest->id) && isset($pointOfInterest->constraints)) {
            foreach ($pointOfInterest->constraints as $constraint) {
                $constraint->id = \DB::table ('pointOfInterestConstraint')->insert (
                    ["pointOfInterestId" => $pointOfInterest->id,
                    "type" => $constraint->type,
                    "time" => $constraint->time]);
            }
        }
            
        return json_encode($pointOfInterest);
    }
    
    public static function put ($pointOfInterest)
    {
        $pointOfInterest = json_decode(file_get_contents("php://input"));
        
        \DB::table('pointOfInterest')->where ('id', $pointOfInterest->id)->update(
                ["lat" => $pointOfInterest->lat,
                 "lng" => $pointOfInterest->lng,
                 "name" => $pointOfInterest->name,
                 "description" => $pointOfInterest->description]);

        if (isset($pointOfInterest->constraints)) {
            
            for ($i = 0; $i < count($pointOfInterest->constraints); $i++) {
                $constraint = $pointOfInterest->constraints[$i];
                    
                if (isset($constraint->id))
                {
                    if (isset($constraint->remove)) {
                        \DB::table('pointOfInterestConstraint')->where('id', $constraint->id)->delete ();
                        unset ($pointOfInterest->constraints[$i]);
                    } else {
                        \DB::table('pointOfInterestConstraint')->where('id', $constraint->id)->update (
                                ["type" => $constraint->type,
                                 "time" => $constraint->time]);
                    }
                }
                else
                {
                    $constraint->id = \DB::table ('pointOfInterestConstraint')->insertGetId (
                        ["pointOfInterestId" => $pointOfInterest->id,
                            "type" => $constraint->type,
                            "time" => $constraint->time]);
                }
            }
            
            $pointOfInterest->constraints = array_values ($pointOfInterest->constraints);
        }
        
        return json_encode ($pointOfInterest);
    }
    
    public static function delete ($pointOfInterestId)
    {
        \DB::table('pointOfInterest')->where('id', $pointOfInterestId)->delete ();
        \DB::table('pointOfInterestConstraint')->where('pointOfInterestId', $pointOfInterestId)->delete ();
    }
}
