<?php

require_once "checkLogin.php";

if($_SERVER["REQUEST_METHOD"] == "POST")
{
	require_once "config.php";

	$userHikeId = $_POST["userHikeId"];
	$location = json_decode($_POST["location"], false);
	
	try
	{
		$sql = "insert into pointOfInterest (creationDate, modificationDate, userHikeId, lat, lng)
	 				values (now(), now(), :userHikeId, :lat, :lng)";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
	//		$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":lat", $paramLat, PDO::PARAM_STR);
			$stmt->bindParam(":lng", $paramLng, PDO::PARAM_STR);
			
			$paramUserHikeId = $userHikeId;
	//		$paramUserId = $_SESSION["userId"];
			$paramLat = $location->lat;
			$paramLng = $location->lng;
	
			$stmt->execute ();
			
			$pointOfInterestId = $pdo->lastInsertId ("pointOfInterestId");
			
			unset ($stmt);
		}
	
		if ($pointOfInterestId)
		{
			$sql = "insert into pointOfInterestConstraint (creationDate, modificationDate, pointOfInterestId, type)
	 				values (now(), now(), :pointOfInterestId, :type)";
			
			if ($stmt = $pdo->prepare($sql))
			{
				$stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);
				$stmt->bindParam(":type", $paramType, PDO::PARAM_STR);
				
				$paramPointOfInterestId = $pointOfInterestId;
				$paramType = "resupply";
				
				$stmt->execute ();
				
				unset ($stmt);
			}
		}
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
}
else if($_SERVER["REQUEST_METHOD"] == "DELETE")
{
	require_once "config.php";
	
	$pointOfInterestId = json_decode(file_get_contents("php://input"));
	
	try
	{
		//
		// Delete the point of interest
		//
		$sql = "delete from pointOfInterest
				where pointOfInterestId = :pointOfInterestId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);
			
			$paramPointOfInterestId = $pointOfInterestId;
			
			$stmt->execute ();
			
			unset ($stmt);
		}
		
		//
		// Delete any constraints associated with the point of interest
		//
		$sql = "delete from pointOfInterestConstraint
				where pointOfInterestId = :pointOfInterestId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);
			
			$paramPointOfInterestId = $pointOfInterestId;
			
			$stmt->execute ();
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
}


?>