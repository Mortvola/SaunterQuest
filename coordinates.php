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

function distToSegmentSquared($p, $v, $w)
{
	$l = nearestPointOnSegment ($p, $v, $w);
		
	return distSquared($p, $l);
}


function pointOnPath ($lat, $lng, &$segments, $tolerance, &$index, &$distance, &$point)
{
	$closestEdge = -1;
	$index = -1;
	
	//
	// There has to be at least two points in the array. Otherwise, we wouldn't have any edges.
	//
	if (count($segments) > 1)
	{
		for ($s = 0; $s < count($segments) - 1; $s++)
		{
			$p = nearestPointOnSegment(
			(object)["x" => $lat, "y" => $lng],
				(object)["x" => $segments[$s]->lat, "y" => $segments[$s]->lng],
				(object)["x" => $segments[$s + 1]->lat, "y" => $segments[$s + 1]->lng]);
			
			$d = distSquared ((object)["x" => $lat, "y" => $lng], $p);
			
			if ($s == 0 || $d < $shortestDistance)
			{
				$shortestDistance = $d;
				$closestEdge = $s;
				$closestPoint = $p;
			}
		}
		
		$shortestDistance = haversineGreatCircleDistance ($lat, $lng, $closestPoint->x, $closestPoint->y);
		//$shortestDistance = haversineGreatCircleDistance (40.159708252, -111.24445577, 40.158448612326, -111.22906855015);
		
// 		echo $shortestDistance, " lat: ", $closestPoint->x, " lng: ", $closestPoint->y, "\n";
// 		echo "lat: $lat, lng: $lng\n";
		
		if ($shortestDistance <= $tolerance)
		{
			$index = $closestEdge;
			$point = $closestPoint;
			$distance = $shortestDistance;
		}
	}
	
	return closestEdge;
}


function getTrailFileName ($lat, $lng)
{
	$lat = floor($lat * 2) * 5;
	$lng = floor($lng * 2) * 5;
	
	if ($lat && $lng)
	{
		if ($lat >= 0)
		{
			$fileName = "N" . $lat;
		}
		else
		{
			$fileName = "S" . -$lat;
		}
		
		if ($lng >= 0)
		{
			$fileName .= "E" . $lng;
		}
		else
		{
			$fileName .= "W" . -$lng;
		}

		return $fileName . ".trails";
	}
}


function normalize ($x, $y)
{
	return (object)["x" => $x * 3600 - floor($x * 3600), "y" => $y * 3600 - floor($y * 3600)];
}

function getElevationUpper ($z1, $z2, $z3, $x, $y)
{
	return ($z3 - $z1) * $x + ($z1 + $z3 - 2 * $z2) * $y - ($z3 - 2 * $z2);
}

function getElevationLeft ($z1, $z2, $z3, $x, $y)
{
	return $z1 - ($z1 - $z3) * $y - ($z1 + $z3 - 2 * $z2) * $x;
}

function getElevationRight ($z1, $z2, $z3, $x, $y)
{
	return ($z1 - $z3) * $y + ($z3 + $z1 - 2 * $z2) * $x - ($z1 - 2 * $z2);
}

function getElevationLower ($z1, $z2, $z3, $x, $y)
{
	return $z3 - ($z3 - $z1) * $x - ($z3 + $z1 - 2 * $z2) * $y;
}


function findPoint ($ele, $x, $y)
{
	// Find the elevation of the midpiont by taking the average of the
	// elevation between the midpoints of the two lines upperLeft to lowerRight
	// and lowerLeft to upperRight
	$midElevation = (($ele[1] + ($ele[2] - $ele[1]) / 2) + ($ele[0] + ($ele[3] - $ele[0]) / 2)) / 2;
	
	$p = normalize ($x, $y);
	
	if ($p->x > $p->y)
	{
		// Lower right
		
		if (1 - $p->x > $p->y)
		{
			return getElevationLower ($ele[1], $midElevation, $ele[0], $p->x, $p->y);
		}
		else
		{
			return getElevationRight ($ele[3], $midElevation, $ele[1], $p->x, $p->y);
		}
	}
	else
	{
		// Upper left
		
		if (1 - $p->x >= $p->y)
		{
			return getElevationLeft ($ele[0], $midElevation, $ele[2], $p->x, $p->y);
		}
		else
		{
			return getElevationUpper ($ele[2], $midElevation, $ele[3], $p->x, $p->y);
		}
	}
}

function getElevation ($lat, $lng)
{
	// Determine file name
	
	$latInt = abs(floor($lat));
	$lngInt = abs(floor($lng));
	
	if ($lat >= 0)
	{
		$latPrefix = "N";
		
		$row = floor(($latInt + 1 - $lat) * 3600);
	}
	else
	{
		$latPrefix = "S";
		
		$row = floor(($latInt - 1 - $lat) * 3600);
	}
	
	if ($lng >= 0)
	{
		$lngPrefix = "E";
		
		$col = floor(($lng - $lngInt) * 3600);
	}
	else
	{
		$lngPrefix = "W";
		
		$col = floor(($lng + $lngInt) * 3600);
	}
	
	$filename = $latPrefix . $latInt . $lngPrefix . $lngInt . ".hgt";
	
	$file = fopen("elevations/" . $filename, "rb");
	
	$ele = [];
	
	if ($file)
	{
		$result = fseek ($file, $row * 3601 * 2 + $col * 2);
	
		// Read the upper left elevation
		$data = fread ($file, 2);
		$ele[2] = unpack ("n", $data)[1];
		
		// Read the upper right elevation;
		$data = fread ($file, 2);
		$ele[3] = unpack ("n", $data)[1];
		
		// Move to the lower left
		$result = fseek ($file, ($row + 1) * 3601 * 2 + $col * 2);
		
		// read the lower left
		$data = fread ($file, 2);
		$ele[0] = unpack ("n", $data)[1];
		
		// read the lower right
		$data = fread ($file, 2);
		$ele[1] = unpack ("n", $data)[1];
	
		fclose ($file);
	
		return round(findPoint ($ele, $lng, $lat));
	}
}

?>