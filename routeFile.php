<?php

function trimRoute ($route, $startIndex, $endIndex)
{
	if (isset($route) && count($route) > 1)
	{
		// Remove the portions that are not between the indexes.
		
		if ($startIndex < $endIndex)
		{
			array_splice ($route, $endIndex + 1);
			array_splice ($route, 0, $startIndex);
			$route = array_values ($route);
			
			return $route;
		}
		else if ($startIndex > $endIndex)
		{
			array_splice ($route, $startIndex + 1);
			array_splice ($route, 0, $endIndex);
			
			$route = array_reverse($route);
			$route = array_values ($route);
		
			return $route;
		}
	}
}


function getTrail ($trailName, $startIndex, $endIndex)
{
	if (strpos ($trailName, ":") !== false)
	{
		$parts = explode (":", $trailName);
		
		$handle = fopen ($parts[0], "rb");
		
		if ($handle)
		{
			for (;;)
			{
				$jsonString = fgets ($handle);
				
				if (!$jsonString)
				{
					break;
				}
				
				$trail = json_decode($jsonString);
				
				if (isset($trail) && isset($trail->route))
				{
					if ($parts[1] == $trail->cn)
					{
						$route = $trail->route;
						
						break;
					}
				}
			}
				
			fclose ($handle);
		}
	}
	else
	{
		$route = json_decode(file_get_contents($trailName));
	}

	return trimRoute ($route, $startIndex, $endIndex);
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
