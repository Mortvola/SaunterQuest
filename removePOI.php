<?php

require_once "checkLogin.php"
		
if($_SERVER["REQUEST_METHOD"] == "POST")
{
	require_once "config.php";

	$pointOfInterestId = $_POST["poiId"];
	
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
