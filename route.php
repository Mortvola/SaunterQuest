<?php 
require_once "checkLogin.php";
require_once "config.php";
require_once "coordinates.php";
require_once "routeFile.php";
require_once "routeFind.php";


function modifyPoint (&$segments, $routeUpdate)
{
	$trailName = "";
	$trailIndex = -1;
	
	findTrail ($routeUpdate->point, $trailName, $trailIndex, $trail);
	
	$segments[$routeUpdate->index]->lat = $routeUpdate->point->lat;
	$segments[$routeUpdate->index]->lng = $routeUpdate->point->lng;
	
	$result->point = $routeUpdate->point;
	
	if ($trailName == "")
	{
		unset ($segments[$routeUpdate->index]->trailName);
		unset ($segments[$routeUpdate->index]->trailIndex);
	}
	else
	{
		// The point was on a trail. Save the trail information.
		
		$segments[$routeUpdate->index]->trailName = $trailName;
		$segments[$routeUpdate->index]->trailIndex = $trailIndex;
		
		// If the previous point is on the same trail then send all
		// of the points between the previous point and this point.
		
		if ($routeUpdate->index > 0 && $segments[$routeUpdate->index - 1]->trailName == $trailName)
		{
			$result->previousTrail = trimRoute ($trail, $segments[$routeUpdate->index - 1]->trailIndex, $segments[$routeUpdate->index]->trailIndex);
			
			$prevLat = $segments[$routeUpdate->index - 1]->lat;
			$prevLng = $segments[$routeUpdate->index - 1]->lng;
			$distance = $segments[$routeUpdate->index - 1]->dist;
			
			assignTrailDistances ($result->previousTrail, $distance, $prevLat, $prevLng);
			
			$distance += haversineGreatCircleDistance ($prevLat, $prevLng, $segments[$routeUpdate->index]->lat, $segments[$routeUpdate->index]->lng);
		}
		else
		{
			$prevLat = $segments[$routeUpdate->index]->lat;
			$prevLng = $segments[$routeUpdate->index]->lng;
			$distance = 0;
		}
		
		$segments[$routeUpdate->index]->dist = $distance;
		$segments[$routeUpdate->index]->ele = getElevation ($segments[$routeUpdate->index]->lat, $segments[$routeUpdate->index]->lng);
		
		$result->point->dist = $segments[$routeUpdate->index]->dist;
		$result->point->ele = $segments[$routeUpdate->index]->ele;
		
		$prevLat = $segments[$routeUpdate->index]->lat;
		$prevLng = $segments[$routeUpdate->index]->lng;
		
		// If the next point is on the same trail then send all
		// of the points between this point and the next point.
		if ($routeUpdate->index < count($segments) - 1 && $segments[$routeUpdate->index + 1]->trailName == $trailName)
		{
			$result->nextTrail = trimRoute ($trail, $segments[$routeUpdate->index]->trailIndex, $segments[$routeUpdate->index + 1]->trailIndex);
			
			assignTrailDistances ($result->nextTrail, $distance, $prevLat, $prevLng);
		}
	}
	
	echo json_encode($result);
}


function deletePoints (&$segments, $routeUpdate)
{
	// Remove the specified points
	array_splice ($segments, $routeUpdate->index, $routeUpdate->length);
	$segments = array_values($segments);
	
	$prevSegment = $segments[$routeUpdate->index - 1];
	$nextSegment = $segments[$routeUpdate->index];
	
	// Are the previous point and the next point on the same trail? If so, then send all
	// of the points between the previous point and the next point.
	if ($routeUpdate->index > 0 && $routeUpdate->index < count($segments)
			&& isset ($prevSegment->trailName) && isset($nextSegment->trailName)
			&& $prevSegment->trailName == $nextSegment->trailName)
	{
		$result = getTrail($prevSegment->lat, $prevSegment->lng,
				$prevSegment->trailName, $prevSegment->trailIndex,
				$nextSegment->trailIndex);
		
		if (isset($result) && count($result) > 0)
		{
			$prevLat = $prevSegment->lat;
			$prevLng = $prevSegment->lng;
			$distance = $prevSegment->dist;
			
			assignTrailDistances ($result, $distance, $prevLat, $prevLng);
		}
	}
	
	// Adjust distances now that vertices have been removed.
	if ($routeUpdate->index < count($segments))
	{
		assignDistances ($segments, $routeUpdate->index - 1);
	}
	
	echo json_encode($result);
}


function addTrail (&$segments, $routeUpdate)
{
	$trailName = $routeUpdate->type . ":" . $routeUpdate->cn;
	
	$route = getFullTrail ($routeUpdate->point->lat, $routeUpdate->point->lng, $trailName);

	if (isset ($route))
	{
		$s = nearestSegmentFind ($route[0]->lat, $route[0]->lng, $segments);
	
		if ($s != -1)
		{
			$anchor1 = (object)[];
			
			$anchor1->trailName = $trailName;
			$anchor1->trailIndex = 0;
			$anchor1->lat = $route[0]->lat;
			$anchor1->lng = $route[0]->lng;
			$anchor1->ele = getElevation ($anchor1->lat, $anchor1->lng);
	
			var_dump ($anchor1);
			
			array_push($segments, $anchor1);
	
			$anchor2 = (object)[];
			
			$anchor2->trailName = $trailName;
			$anchor2->trailIndex = count($route) - 1;
			$anchor2->lat = $route[$anchor2->trailIndex]->lat;
			$anchor2->lng = $route[$anchor2->trailIndex]->lng;
			$anchor2->ele = getElevation ($anchor2->lat, $anchor2->lng);
	
			var_dump ($anchor2);
			
			array_push($segments, $anchor2);
		}
	}
}


if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];
	
	$fileName = getRouteFile ($userHikeId);

	$segments = getRouteFromFile ($fileName);
	
	if ($segments == null)
	{
		$segments = [];
	}
	
	echo json_encode($segments);
}
else if ($_SERVER["REQUEST_METHOD"] == "POST")
{
	$route = json_decode(file_get_contents("php://input"));
	
	$fileName = getRouteFile ($route->userHikeId);
	
	$distance = 0;
	
	for ($index = 0; $index < count($route->anchors); $index++)
	{
		$route->anchors[$index]->ele = getElevation ($route->anchors[$index]->lat, $route->anchors[$index]->lng);
		$route->anchors[$index]->dist = $distance;
		
		if ($index < count($route->anchors) - 1)
		{
			$distance += haversineGreatCircleDistance (
					$route->anchors[$index]->lat, $route->anchors[$index]->lng,
					$route->anchors[$index + 1]->lat, $route->anchors[$index + 1]->lng);
		}
	}
	
	$result = file_put_contents ($fileName, json_encode($route->anchors));
}
else if ($_SERVER["REQUEST_METHOD"] == "PUT")
{
	$routeUpdate = json_decode(file_get_contents("php://input"));

	$fileName = getRouteFile ($routeUpdate->userHikeId);
	
	if ($fileName)
	{
		// Read the data from the file.
		$segments = readAndSanitizeFile ($fileName);
		
		if ($routeUpdate->mode == "update")
		{
			// Update the point that was moved in the segments array.
			modifyPoint ($segments, $routeUpdate);
		}
		else if ($routeUpdate->mode == "insert")
		{
			array_splice ($segments, $routeUpdate->index, 0, [ "0" => $routeUpdate->point]);
			
			modifyPoint ($segments, $routeUpdate);
		}
		else if ($routeUpdate->mode == "delete")
		{
			deletePoints ($segments, $routeUpdate);
		}
		else if ($routeUpdate->mode == "addTrail")
		{
			addTrail ($segments, $routeUpdate);
		}
		else if ($routeUpdate->mode == "setStart")
		{
			if (!isset($segments) || count($segments) == 0)
			{
				$segments = [];
				
				array_push($segments, (object)[
					"lat" => $routeUpdate->point->lat,
					"lng" => $routeUpdate->point->lng,
					"dist" => 0,
					"ele" => getElevation ($routeUpdate->point->lat, $routeUpdate->point->lng),
					"type" => "start"
				]);
			}
			else if (count($segments) == 1)
			{
				if (isset ($segments[0]->type) && $segments[0]->type == "start")
				{
					$segments[0]->lat = $routeUpdate->point->lat;
					$segments[0]->lng = $routeUpdate->point->lng;
					$segments[0]->dist = 0;
					$segments[0]->ele = getElevation ($routeUpdate->point->lat, $routeUpdate->point->lng);
				}
				else
				{
					array_push($segments, (object)[
							"lat" => $routeUpdate->point->lat,
							"lng" => $routeUpdate->point->lng,
							"dist" => 0,
							"ele" => getElevation ($routeUpdate->point->lat, $routeUpdate->point->lng),
							"type" => "start"
					]);
				}
			}
		}
		else if ($routeUpdate->mode == "setEnd")
		{
			if (!isset($segments) || count($segments) == 0)
			{
				$segments = [];
				
				array_push($segments, (object)[
						"lat" => $routeUpdate->point->lat,
						"lng" => $routeUpdate->point->lng,
						"dist" => 0,
						"ele" => getElevation ($routeUpdate->point->lat, $routeUpdate->point->lng),
						"type" => "end"
				]);
			}
			else
			{
				// Find "end"
				for ($i = 0; $i < count ($segments); $i++)
				{
					if (isset($segments[$i]->type))
					{
						if ($segments[$i]->type == "end")
						{
							$endIndex = $i;
							
							break;
						}
						else if ($segments[$i]->type == "start")
						{
							$startIndex = $i;
						}
					}
				}
				
				if (isset($endIndex))
				{
					// End exists, update it.
					
					$segments[$endIndex]->lat = $routeUpdate->point->lat;
					$segments[$endIndex]->lng = $routeUpdate->point->lng;
					$segments[$endIndex]->dist = 0;
					$segments[$endIndex]->ele = getElevation ($routeUpdate->point->lat, $routeUpdate->point->lng);
				}
				else
				{
					// End doesn't exist, add it
					// todo: determine which end of the array to add it to.
					
					array_push($segments, (object)[
							"lat" => $routeUpdate->point->lat,
							"lng" => $routeUpdate->point->lng,
							"dist" => 0,
							"ele" => getElevation ($routeUpdate->point->lat, $routeUpdate->point->lng),
							"type" => "end"
					]);
					
					$endIndex = count($segments) - 1;
				}
			
				if (isset($startIndex) && isset($endIndex))
				{
					$segments = findPath ($segments[$startIndex], $segments[$endIndex]);
				}
			}
		}
		
		// Write the data to the file.
		file_put_contents ($fileName, json_encode($segments));
	}
}
?>