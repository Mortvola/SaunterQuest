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


function distSquared($v, $w)
{
	return pow($v->x - $w->x, 2) + pow($v->y - $w->y, 2);
}


function percentageOfPointOnSegment ($p, $v, $w)
{
	// Check to see if the line segment is really just a point. If so, return the distance between
	// the point and one of the points of the line segment.
	$l2 = distSquared($v, $w);
	if ($l2 == 0)
	{
		return 0;
	}
	
	$t = (($p->x - $v->x) * ($w->x - $v->x) + ($p->y - $v->y) * ($w->y - $v->y)) / $l2;
	$t = max(0, min(1, $t));
	
	return $t;
}


function nearestPointOnSegment ($p, $v, $w)
{
	// Check to see if the line segment is really just a point. If so, return the distance between
	// the point and one of the points of the line segment.
	$l2 = distSquared($v, $w);
	if ($l2 == 0)
	{
		return $v;
	}
	
	$t = (($p->x - $v->x) * ($w->x - $v->x) + ($p->y - $v->y) * ($w->y - $v->y)) / $l2;
	$t = max(0, min(1, $t));
	
	$point = (object)["x" => $v->x + $t * ($w->x - $v->x), "y" => $v->y + $t * ($w->y - $v->y)];

	return $point;
}

?>