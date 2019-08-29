<?php

namespace App;

class PointOfInterest
{
    public static function get ($userHikeId)
    {
        $pointsOfInterest = \DB::select(\DB::raw(
                "select id, lat, lng, name, description
                from pointOfInterest
                where userHikeId = :userHikeId"),
            array ("userHikeId" => $userHikeId));
        
        if (isset($pointsOfInterest)) {
            
            foreach ($pointsOfInterest as &$poi) {
                $poi->constraints = \DB::select (\DB::raw (
                        "select id, type, time
				from pointOfInterestConstraint
				where pointOfInterestId = :pointOfInterestId"),
                        array ("pointOfInterestId" => $poi->id));
            }
        }
        
        return $pointsOfInterest;
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
            
        return $pointOfInterest;
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
        
        return $pointOfInterest;
    }
    
    public static function delete ($pointOfInterestId)
    {
        \DB::table('pointOfInterest')->where('id', $pointOfInterestId)->delete ();
        \DB::table('pointOfInterestConstraint')->where('pointOfInterestId', $pointOfInterestId)->delete ();
    }
}
