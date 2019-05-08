<?php 
require_once "checkLogin.php";
require_once "config.php";
require_once "coordinates.php";

function findTrail ($point)
{
	$trails = [];
	$closestTrail = -1;
	
	array_push($trails, json_decode(file_get_contents("CentralGWT.trail")));
	array_push($trails, json_decode(file_get_contents("TieForkGWT.trail")));
	array_push($trails, json_decode(file_get_contents("StrawberryRidgeGWT.trail")));
	array_push($trails, json_decode(file_get_contents("SouthForkToPackardCanyon.trail")));

	echo "Number of trails: ", count($trails), "\n";
	
	for ($t = 0; $t < count($trails); $t++)
	{
		pointOnPath ($point->lat, $point->lng, $trails[$t], 30, $index, $distance, $point);
		
		echo "distance = $distance, index = $index\n";
		
		if ($index != -1 && ($closestTrail = -1 || $distance < $shortestDistance))
		{
			$shortestDistance = $distance;
			$closestTrail = $t;
			$closestSegment = $index;
		}
	}
	
	echo $closestTrail;
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

	findTrail ($routeUpdate->point);
	
	
	/*
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

 	// Read the data from the file.
 	$segments = json_decode(file_get_contents("data/" . $fileName));
	
	// Remove any points being replaced and splice in the new points.
	array_splice ($segments, $routeUpdate->start + 1,
			$routeUpdate->end - $routeUpdate->start,
			$routeUpdate->points);

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
	
	// Write the data to the file.
	$result = file_put_contents ("data/" . $fileName, json_encode($segments));
	*/
}
?>