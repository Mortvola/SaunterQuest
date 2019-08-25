<?php
namespace bpp;

function getPointsOfInterest($userHikeId)
{
    $pointsOfInterest = \DB::select(\DB::raw(
        "select pointOfInterestId, lat, lng, name, description
		from pointOfInterest
		where userHikeId = :userHikeId"),
        array ("userHikeId" => $userHikeId));

    if (isset($pointsOfInterest)) {
        
        foreach ($pointsOfInterest as &$poi) {
            $poi->constraints = \DB::select (\DB::raw (
                "select pointOfInterestConstraintId, type, time
				from pointOfInterestConstraint
				where pointOfInterestId = :pointOfInterestId"),
                array ("pointOfInterestId" => $poi->pointOfInterestId));
        }

        return $pointsOfInterest;
    }
}
