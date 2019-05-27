<?php 
require_once "checkLogin.php";
require_once "config.php";
require_once "coordinates.php";
require_once "routeFile.php";


function findTrail (&$point, &$trailName, &$trailIndex, &$route)
{
	$trails = [];
	$closestTrail = -1;
	$adjustedPoint = $point;
	$first = true;
	
	$fileName = "trails/" . getTrailFileName ($point->lat, $point->lng);
	
	$handle = fopen ($fileName, "rb");
	
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
			
			if (isset($trail) && isset($trail->route)
					&& $point->lng >= ($trail->minLng - 0.00027027) && $point->lng <= ($trail->maxLng + 0.00027027)
					&& $point->lat >= ($trail->minLat - 0.00027027) && $point->lat <= ($trail->maxLat + 0.00027027))
			{
				$newPoint = (object)[];
				
				pointOnPath ($point->lat, $point->lng, $trail->route, 30, $index, $distance, $newPoint);
				
				if ($index != -1 && ($first || $distance < $shortestDistance))
				{
					$first = false;
					
					$shortestDistance = $distance;
					$trailName = $trail->type . ":" . $trail->feature;
					// The new point is on the closest segment found on the trail. Therefore, the trail
					// route will start at the next segment.
					$trailIndex = $index + 1; 
					$route = $trail->route;
					
					$adjustedPoint = (object)["lat" => $newPoint->x, "lng" => $newPoint->y];
				}
			}
		}
		
		fclose ($handle);
	}
	
	$point = $adjustedPoint;
}


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
		
		// Write the data to the file.
		$result = file_put_contents ($fileName, json_encode($segments));
	}
}
?>