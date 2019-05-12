<?php
function getTrail ($trailName, $startIndex, $endIndex)
{
	$trail = json_decode(file_get_contents($trailName));
	
	if (count($trail) > 1)
	{
		// Remove the portions that are not between the indexes.
		
		if ($startIndex < $endIndex)
		{
			array_splice ($trail, $endIndex + 1);
			array_splice ($trail, 0, $startIndex);
			$trail = array_values ($trail);
			
			return $trail;
		}
		else if ($startIndex > $endIndex)
		{
			array_splice ($trail, $startIndex + 1);
			array_splice ($trail, 0, $endIndex);
			
			$trail = array_reverse($trail);
			$trail = array_values ($trail);
			
			return $trail;
		}
	}
}


function assignTrailDistances (&$trail, &$distance, &$prevLat, &$prevLng)
{
	for ($t = 0; $t < count($trail); $t++)
	{
		$distance += haversineGreatCircleDistance ($prevLat, $prevLng, $trail[$t]->lat, $trail[$t]->lng);
		
		$trail[$t]->dist = $distance;
		$trail[$t]->ele = getElevation ($trail[$t]->lat, $trail[$t]->lng);
		
		$prevLat = $trail[$t]->lat;
		$prevLng = $trail[$t]->lng;
	}
}


function assignDistances (&$segments, $startIndex)
{
	$distance = 0;
	
	// Sanitize the data by recomputing the distances and elevations.
	for ($i = $startIndex; $i < count($segments); $i++)
	{
		if (!isset($segments[$i]->lat) || !isset($segments[$i]->lng))
		{
			array_splice($segments, $i, 1);
			
			if ($i >= count($segments))
			{
				break;
			}
		}
		
		if ($i == 0)
		{
			$segments[$i]->dist = $distance;
		}
		else
		{
			$distance += haversineGreatCircleDistance ($prevLat, $prevLng, $segments[$i]->lat, $segments[$i]->lng);
			
			$segments[$i]->dist = $distance;
			$segments[$i]->ele = getElevation ($segments[$i]->lat, $segments[$i]->lng);
		}
		
		$prevLat = $segments[$i]->lat;
		$prevLng = $segments[$i]->lng;
		
		if ($segments[$i]->trail)
		{
			assignTrailDistances ($segments[$i]->trail, $distance, $prevLat, $prevLng);
		}
	}
}


function readAndSanatizeFile ($fileName)
{
	$segments = json_decode(file_get_contents($fileName));
	
	// Ensure the array is not an object and is indexed numerically
	$objectVars = get_object_vars ($segments);
	
	if ($objectVars)
	{
		$segments = array_values ($objectVars);
	}
	
	return $segments;
}


function getRouteFromFile ($fileName)
{
	if (isset($fileName) && $fileName != "")
	{
		$segments = readAndSanatizeFile ($fileName);
		
		for ($s = 0; $s < count($segments) - 1; $s++)
		{
			// If this segment and the next start on the same trail then
			// find the route along the trail.
			if (isset($segments[$s]->trailName) && isset($segments[$s + 1]->trailName)
					&& $segments[$s]->trailName == $segments[$s + 1]->trailName)
			{
				$trail = getTrail ($segments[$s]->trailName, $segments[$s]->trailIndex, $segments[$s + 1]->trailIndex);
				
				//				array_splice ($segments, $s + 1, 0, $trail);
				//				$s += count($trail);
				$segments[$s]->trail = $trail;
			}
		}
		
		assignDistances ($segments, 0);
	}
	
	return $segments;
}

?>
