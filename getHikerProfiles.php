<?php

require_once "checkLogin.php";

if($_SERVER["REQUEST_METHOD"] == "GET")
{
	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];
	$userId = 1;
	$userHikeId = 100027;
	
	// Include config file
	require_once "config.php";
	
	try
	{
		$sql = "select hikerProfileId, startDay, endDay, percentage, startTime, endTime, breakDuration
				from hikerProfile
				where userId = :userId
				and :userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			
			$paramUserHikeId = $userHikeId;
			$paramUserId = $userId;
			
			$stmt->execute ();
			
			$output = $stmt->fetchAll (PDO::FETCH_ASSOC);
			
			echo json_encode($output);
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
}

?>
