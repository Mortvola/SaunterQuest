<?php 
require_once "checkLogin.php";
require_once "config.php";
require_once "coordinates.php";

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


if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	class hike {};
	
	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];
	
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
			
			echo file_get_contents("data/" . $hike[0]->file);
			
			unset($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
		throw $e;
	}
}
else if ($_SERVER["REQUEST_METHOD"] == "PUT")
{
	$routeUpdate = json_decode(file_get_contents("php://input"));

	try
	{
		$sql = "select file
				from hike h
				join userHike uh on uh.hikeId = h.hikeId
				where uh.userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);

			$paramUserHikeId = $routeUpdate->userHikeId;
			
			$stmt->execute ();
			
			$output = $stmt->fetchAll (PDO::FETCH_ASSOC);
			
			$fileName = $output[0]["file"];
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}

	$trailName = "";
	$trailIndex = -1;
	
	findTrail ($routeUpdate->point, $trailName, $trailIndex);

 	// Read the data from the file.
 	$segments = json_decode(file_get_contents("data/" . $fileName));

 	if ($routeUpdate->mode == "update")
 	{
 		$result->point = $routeUpdate->point;
 		
 		$segments[$routeUpdate->index]->lat = $routeUpdate->point->lat;
 		$segments[$routeUpdate->index]->lng = $routeUpdate->point->lng;

 		if ($trailName == "")
 		{
 			unset ($segments[$routeUpdate->index]->trailName);
 			unset ($segments[$routeUpdate->index]->trailIndex);
 		}
 		else
 		{
	 		$segments[$routeUpdate->index]->trailName = $trailName;
	 		$segments[$routeUpdate->index]->trailIndex = $trailIndex;
	 		
	 		// Is the previous point on the same trail? If so, then send all
	 		// of the points between the previous point and this point.
	 		if ($routeUpdate->index > 0 && $segments[$routeUpdate->index - 1]->trailName == $trailName)
	 		{
	 			$result->previousTrail = json_decode(file_get_contents($trailName));
	 			
	 			if ($segments[$routeUpdate->index - 1]->trailIndex > $segments[$routeUpdate->index]->trailIndex)
	 			{
	 				array_splice ($result->previousTrail, $segments[$routeUpdate->index - 1]->trailIndex + 1);
	 				array_splice ($result->previousTrail, 0, $segments[$routeUpdate->index]->trailIndex - 1);
	 			}
	 			else
	 			{
	 				array_splice ($result->previousTrail, $segments[$routeUpdate->index]->trailIndex + 1);
	 				array_splice ($result->previousTrail, 0, $segments[$routeUpdate->index - 1]->trailIndex - 1);

	 				array_push ($result->previousTrail, $result->point);
	 			}
	 		}

	 		// Is the next point on the same trail? If so, then send all
	 		// of the points between the this point and the next point.
	 		if ($routeUpdate->index < count($segments) - 1 && $segments[$routeUpdate->index + 1]->trailName == $trailName)
	 		{
	 			$result->nextTrail = json_decode(file_get_contents($trailName));
	 			
	 			if ($segments[$routeUpdate->index + 1]->trailIndex > $segments[$routeUpdate->index]->trailIndex)
	 			{
	 				array_splice ($result->nextTrail, $segments[$routeUpdate->index + 1]->trailIndex + 1);
	 				array_splice ($result->nextTrail, 0, $segments[$routeUpdate->index]->trailIndex - 1);
	 			}
	 			else
	 			{
	 				array_splice ($result->nextTrail, $segments[$routeUpdate->index]->trailIndex + 1);
	 				array_splice ($result->nextTrail, 0, $segments[$routeUpdate->index + 1]->trailIndex - 1);
	 			}
	 		}
 		}
 		
		echo json_encode($result);
 	}
 	else if ($routeUpdate->mode == "delete")
 	{
 		// Remove the specified points
 		array_splice ($segments, $routeUpdate->index, $routeUpdate->length);
 		
 		// Adjust distances now that vertices have been removed.
 		for ($i = $routeUpdate->index; $i < count($segments); $i++)
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
 	else
 	{
 	/*
	// Remove any points being replaced and splice in the new points.
	array_splice ($segments, $routeUpdate->start + 1,
			$routeUpdate->end - $routeUpdate->start,
			$routeUpdate->points);
	}
	
	// Sanitize the data by recomputing the distances and elevations.
	for ($i = 0; $i < count($segments); $i++)
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
	*/
 	}
 	
	// Write the data to the file.
	$result = file_put_contents ("data/" . $fileName, json_encode($segments));
}
?>