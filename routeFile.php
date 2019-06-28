<?php

require_once "coordinates.php";

function trimRoute ($route, $startIndex, $endIndex)
{
	if (isset($route) && count($route) > 1)
	{
		// Remove the portions that are not between the indexes.
		
		if ($startIndex < $endIndex)
		{
			array_splice ($route, $endIndex);
			array_splice ($route, 0, $startIndex);
			$route = array_values ($route);
			
			return $route;
		}
		else if ($startIndex > $endIndex)
		{
			array_splice ($route, $startIndex);
			array_splice ($route, 0, $endIndex);
			
			$route = array_reverse($route);
			$route = array_values ($route);
		
			return $route;
		}
	}
}


function getFullTrail ($lat, $lng, $trailName)
{
	if (strpos ($trailName, ":") !== false)
	{
		$fileName = "trails/" . getTrailFileName ($lat, $lng);
		
		$handle = fopen ($fileName, "rb");
		
		if ($handle)
		{
			$parts = explode (":", $trailName);
			
			for (;;)
			{
				$jsonString = fgets ($handle);
				
				if (!$jsonString)
				{
					break;
				}
				
				$trail = json_decode($jsonString);
				
				if (isset($trail) && isset($trail->routes))
				{
					if ($parts[0] == $trail->type && $parts[1] == $trail->cn)
					{
						$route = $trail->routes[$parts[2]]->route;
						
						break;
					}
				}
				else
				{
					error_log ("No routes");
				}
			}
			
			fclose ($handle);
		}
		else
		{
			error_log ("Unable to open file " . $fileName);
		}
	}
	else
	{
		$route = json_decode(file_get_contents($trailName));
	}
	
	return $route;
}


function getTrail ($lat, $lng, $trailName, $startIndex, $endIndex)
{
	$route = getFullTrail ($lat, $lng, $trailName);
	
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
	// Sanitize the data by recomputing the distances and elevations.
	for ($i = $startIndex; $i < count($segments); $i++)
	{
		// Remove the anchor if it appears to be malformed
		if (!isset($segments[$i]->lat) || !isset($segments[$i]->lng))
		{
			array_splice($segments, $i, 1);
			
			if ($i >= count($segments))
			{
				break;
			}
		}
		
		if ($i == $startIndex)
		{
			if ($i == 0)
			{
				$distance = 0;
			}
			else
			{
				$distance = $segments[$i]->dist;
			}
		}
		
		$segments[$i]->dist = $distance;
		$segments[$i]->ele = getElevation ($segments[$i]->lat, $segments[$i]->lng);
		
		if ($i < count($segments) - 1)
		{
			// Find distance to next anchor, either via trail or straight line distance.
			if (isset($segments[$i]->trail))
			{
				$prevLat = $segments[$i]->lat;
				$prevLng = $segments[$i]->lng;
				
				assignTrailDistances ($segments[$i]->trail, $distance, $prevLat, $prevLng);
				$distance += haversineGreatCircleDistance ($prevLat, $prevLng, $segments[$i + 1]->lat, $segments[$i + 1]->lng);
			}
			else
			{
				$distance += haversineGreatCircleDistance ($segments[$i]->lat, $segments[$i]->lng, $segments[$i + 1]->lat, $segments[$i + 1]->lng);
			}
		}
	}
}


function readAndSanitizeFile ($fileName)
{
	$segments = json_decode(file_get_contents($fileName));
	
	// Ensure the array is not an object and is indexed numerically
	if (!is_array($segments))
	{
		$objectVars = get_object_vars ($segments);
		
		if ($objectVars)
		{
			$segments = array_values ($objectVars);
		}
	}
	
	return $segments;
}


function getRouteFromFile ($fileName)
{
	if (isset($fileName) && $fileName != "")
	{
		$segments = readAndSanitizeFile ($fileName);
		
		for ($s = 0; $s < count($segments) - 1; $s++)
		{
			// If this segment and the next start on the same trail then
			// find the route along the trail.
			if (isset($segments[$s]->trailName) && isset($segments[$s + 1]->trailName) &&
				$segments[$s]->trailName == $segments[$s + 1]->trailName)
			{
				$trail = getTrail ($segments[$s]->lat, $segments[$s]->lng, $segments[$s]->trailName, $segments[$s]->routeIndex, $segments[$s + 1]->routeIndex);
				
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
