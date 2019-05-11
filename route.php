<?php 
require_once "checkLogin.php";
require_once "config.php";
require_once "coordinates.php";

class hike {};

function getFileName ($userHikeId)
{
	global $pdo;
	
	try
	{
		$sql = "select h.file
			from userHike uh
			join hike h on h.hikeId = uh.hikeId
			where uh.userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			
			$paramUserHikeId = $userHikeId;
			
			$stmt->execute ();
			
			$hike = $stmt->fetchAll (PDO::FETCH_CLASS, 'hike');
			
			$fileName = "data/" . $hike[0]->file;
			
			unset($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
		throw $e;
	}
	
	return $fileName;
}


function findTrail (&$point, &$trailName, &$trailIndex)
{
	$trails = [];
	$closestTrail = -1;
	$adjustedPoint = $point;
	
	array_push($trails, (object)["data" => json_decode(file_get_contents("CentralGWT.trail")), "name" => "CentralGWT.trail"]);
	array_push($trails, (object)["data" => json_decode(file_get_contents("TieForkGWT.trail")), "name" => "TieForkGWT.trail"]);
	array_push($trails, (object)["data" => json_decode(file_get_contents("StrawberryRidgeGWT.trail")), "name" => "StrawberryRidgeGWT.trail"]);
	array_push($trails, (object)["data" => json_decode(file_get_contents("SouthForkToPackardCanyon.trail")), "name" => "SouthForkToPackardCanyon.trail"]);

	//echo "Number of trails: ", count($trails), "\n";
	
	for ($t = 0; $t < count($trails); $t++)
	{
		pointOnPath ($point->lat, $point->lng, $trails[$t]->data, 30, $index, $distance, $point);
		
		//echo "distance = $distance, index = $index\n";
		
		if ($index != -1 && ($closestTrail = -1 || $distance < $shortestDistance))
		{
			$shortestDistance = $distance;
			$closestTrail = $t;
			$trailName = $trails[$t]->name;
			$trailIndex = $index;
			
			$adjustedPoint = (object)["lat" => $point->x, "lng" => $point->y];
		}
	}
	
	$point = $adjustedPoint;
}


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


function assignDistances (&$segments, $startIndex)
{
	// Sanitize the data by recomputing the distances and elevations.
	for ($i = $startIndex; $i < count($segments); $i++)
	{
		if ($i == 0)
		{
			$segments[$i]->dist = 0;
		}
		else
		{
			$distance = haversineGreatCircleDistance ($segments[$i - 1]->lat, $segments[$i - 1]->lng, $segments[$i]->lat, $segments[$i]->lng);
			
			$segments[$i]->dist = $segments[$i - 1]->dist + $distance;
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

if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];
	
	$fileName = getFileName ($userHikeId);

	if (isset($fileName) && $fileName != "")
	{
		$segments = readAndSanatizeFile ($fileName);
		
		for ($s = 0; $s < count($segments) - 1; $s++)
		{
			// If this segment and the next start on the same trail then
			// find the route along the trail.
			if (isset($segments[$s]->trailName) && isset($segments[$s + 1]->trailName)
			 && $segments[$s]->trailName == $segments[$s]->trailName)
			{
				$trail = getTrail ($segments[$s]->trailName, $segments[$s]->trailIndex, $segments[$s + 1]->trailIndex);

//				array_splice ($segments, $s + 1, 0, $trail);
//				$s += count($trail);
				$segments[$s]->trail = $trail;
			}
		}
		
		assignDistances ($segments, 0);
		
		echo json_encode($segments);
	}
}
else if ($_SERVER["REQUEST_METHOD"] == "PUT")
{
	$routeUpdate = json_decode(file_get_contents("php://input"));

	$fileName = getFileName ($routeUpdate->userHikeId);
	
	if ($fileName)
	{
		$trailName = "";
		$trailIndex = -1;
		
		findTrail ($routeUpdate->point, $trailName, $trailIndex);
	
		// Read the data from the file.
		$segments = readAndSanatizeFile ($fileName);
		
		if ($routeUpdate->mode == "update")
		{
			$result->point = $routeUpdate->point;
			
			// Update the point that was moved in the segments array.

			$segments[$routeUpdate->index]->lat = $routeUpdate->point->lat;
			$segments[$routeUpdate->index]->lng = $routeUpdate->point->lng;
	
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
					$result->previousTrail = getTrail ($trailName, $segments[$routeUpdate->index - 1]->trailIndex, $segments[$routeUpdate->index]->trailIndex);
				}
	
				// If the next point is on the same trail then send all
				// of the points between this point and the next point.
				if ($routeUpdate->index < count($segments) - 1 && $segments[$routeUpdate->index + 1]->trailName == $trailName)
				{
					$result->nextTrail = getTrail ($trailName, $segments[$routeUpdate->index]->trailIndex, $segments[$routeUpdate->index + 1]->trailIndex);
				}
			}
			
			echo json_encode($result);
		}
		else if ($routeUpdate->mode == "delete")
		{
			 // Remove the specified points
			array_splice ($segments, $routeUpdate->index, $routeUpdate->length);
			$segments = array_values($segments);
			
			// Are the previous point and the next point on the same trail? If so, then send all
			// of the points between the previous point and the next point.
			if ($routeUpdate->index > 0 && $routeUpdate->index < count($segments) && $segments[$routeUpdate->index - 1]->trailName == $segments[$routeUpdate->index]->trailName)
			{
				$result = json_decode(file_get_contents($segments[$routeUpdate->index]->trailName));
				
				if ($segments[$routeUpdate->index - 1]->trailIndex > $segments[$routeUpdate->index]->trailIndex)
				{
					array_splice ($result, $segments[$routeUpdate->index - 1]->trailIndex + 1);
					array_splice ($result, 0, $segments[$routeUpdate->index]->trailIndex - 1);
				}
				else
				{
					array_splice ($result, $segments[$routeUpdate->index]->trailIndex + 1);
					array_splice ($result, 0, $segments[$routeUpdate->index - 1]->trailIndex - 1);
				}
				
				$result = array_values ($result);
			}

			// Adjust distances now that vertices have been removed.
			if ($routeUpdate->index < count($segments))
			{
				assignDistances ($segments, $routeUpdate->index);
			}
				
			echo json_encode($result);
		}
		else
		{
			// Remove any points being replaced and splice in the new points.
// 			array_splice ($segments, $routeUpdate->start + 1,
// 					$routeUpdate->end - $routeUpdate->start,
// 					$routeUpdate->points);
// 			}
			
// 			assignDistances ($segments);
		}
		
		// Write the data to the file.
		$result = file_put_contents ($fileName, json_encode($segments));
	}
}
?>