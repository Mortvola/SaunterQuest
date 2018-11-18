<?php


// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	if($_SERVER["REQUEST_METHOD"] == "POST")
	{
		require_once "config.php";

		$obj = json_decode($_POST["location"], false);
		
		try
		{
			$sql = "insert into pointOfInterest (creationDate, modificationDate, hikeId, lat, lng)
		 				values (now(), now(), :hikeId, :lat, :lng)";
			
			if ($stmt = $pdo->prepare($sql))
			{
				$stmt->bindParam(":hikeId", $paramHikeId, PDO::PARAM_INT);
		//		$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
				$stmt->bindParam(":lat", $paramLat, PDO::PARAM_STR);
				$stmt->bindParam(":lng", $paramLng, PDO::PARAM_STR);
				
				$paramHikeId = 2; //$hikeId;
		//		$paramUserId = $_SESSION["userId"];
				$paramLat = $obj->lat;
				$paramLng = $obj->lng;
		
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
}

?>