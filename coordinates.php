<?php

function haversineGreatCircleDistance(
		$latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo, $earthRadius = 6378137)
{
	// convert from degrees to radians
	$latFrom = deg2rad($latitudeFrom);
	$lonFrom = deg2rad($longitudeFrom);
	$latTo = deg2rad($latitudeTo);
	$lonTo = deg2rad($longitudeTo);
	
	$latDelta = $latTo - $latFrom;
	$lonDelta = $lonTo - $lonFrom;
	
	$angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
			cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
	return $angle * $earthRadius;
}

function nearestSegmentFind ($lat, $lng, &$segments)
{
	$closestIndex = -1;
	
	if (count($segments) > 1)
	{
		$k = 0;
		
		$closest = haversineGreatCircleDistance ($lat, $lng, $segments[$k]->lat, $segments[$k]->lng);
		$closestIndex = $k;
		
		for ($k++; $k < count($segments) - 1; $k++)
		{
			$d = haversineGreatCircleDistance ($lat, $lng, $segments[$k]->lat, $segments[$k]->lng);
			
			if ($d < $closest)
			{
				//echo "found one: $k, $d\n";
				$closest = $d;
				$closestIndex = $k;
			}
		}
	}
	
	return $closestIndex;
}

?>