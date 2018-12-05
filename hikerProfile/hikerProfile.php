<?php

require_once "../checkLogin.php";

require_once "../config.php";

if($_SERVER["REQUEST_METHOD"] == "GET")
{
 	$userId = $_SESSION["userId"];
 	$userHikeId = $_GET["id"];
	
	try
	{
		$sql = "select hikerProfileId, startDay, endDay, speedFactor, startTime, endTime, breakDuration
				from hikerProfile
				where userId = :userId
				and userHikeId = :userHikeId";
		
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
		http_response_code (500);
		echo $e->getMessage();
	}
}
else if($_SERVER["REQUEST_METHOD"] == "DELETE")
{
	$hikerProfileId = json_decode(file_get_contents("php://input"));
	
	try
	{
		$sql = "delete from hikerProfile
				where hikerProfileId = :hikerProfileId
				and userId = :userId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":hikerProfileId", $paramHikerProfileId, PDO::PARAM_INT);

			$paramUserId = $_SESSION["userId"];
			$paramHikerProfileId = $hikerProfileId;
	
			$stmt->execute ();
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
}
else if($_SERVER["REQUEST_METHOD"] == "POST")
{
	$userHikeId = $_POST["userHikeId"];
	$profile = json_decode($_POST["profile"]);
	
	try
	{
		$sql = "insert into hikerProfile (creationDate, modificationDate, userId, userHikeId, startDay, endDay, speedFactor, startTime, endTime, breakDuration)
	 				values (now(), now(), :userId, :userHikeId, :startDay, :endDay, :speedFactor, :startTime, :endTime, :breakDuration)";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			$stmt->bindParam(":startDay", $paramStartDay, PDO::PARAM_INT);
			$stmt->bindParam(":endDay", $paramEndDay, PDO::PARAM_INT);
			$stmt->bindParam(":speedFactor", $paramSpeedFactor, PDO::PARAM_INT);
			$stmt->bindParam(":startTime", $paramStartTime, PDO::PARAM_INT);
			$stmt->bindParam(":endTime", $paramEndTime, PDO::PARAM_INT);
			$stmt->bindParam(":breakDuration", $paramBreakDuration, PDO::PARAM_INT);
			
			$paramUserId = $_SESSION["userId"];
			$paramUserHikeId = $userHikeId;
			
			if (isset($profile->startDay) && $profile->startDay != "")
			{
				$paramStartDay = $profile->startDay;
			}
			
			if (isset($profile->endDay) && $profile->endDay != "")
			{
				$paramEndDay = $profile->endDay;
			}
			
			if (isset($profile->speedFactor) && $profile->speedFactor != "")
			{
				$paramSpeedFactor = $profile->speedFactor;
			}
			
			if (isset($profile->startTime) && $profile->startTime != "")
			{
				$paramStartTime = $profile->startTime;
			}
			
			if (isset($profile->endTime) && $profile->endTime != "")
			{
				$paramEndTime = $profile->endTime;
			}
			
			if (isset($profile->breakDuration) && $profile->breakDuration != "")
			{
				$paramBreakDuration = $profile->breakDuration;
			}
			
			$stmt->execute ();
			
			$hikerProfileId = $pdo->lastInsertId ("hikerProfileId");
			
			echo json_encode($hikerProfileId);
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
}
else if($_SERVER["REQUEST_METHOD"] == "PUT")
{
	$profile = json_decode(file_get_contents("php://input"));
	
	try
	{
		$sql = "update hikerProfile set
					modificationDate = now(),
					startDay = :startDay,
					endDay = :endDay,
					speedFactor = :speedFactor,
					startTime = :startTime,
					endTime = :endTime,
					breakDuration = :breakDuration
				where hikerProfileId = :hikerProfileId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":startDay", $paramStartDay, PDO::PARAM_INT);
			$stmt->bindParam(":endDay", $paramEndDay, PDO::PARAM_INT);
			$stmt->bindParam(":speedFactor", $paramSpeedFactor, PDO::PARAM_INT);
			$stmt->bindParam(":startTime", $paramStartTime, PDO::PARAM_INT);
			$stmt->bindParam(":endTime", $paramEndTime, PDO::PARAM_INT);
			$stmt->bindParam(":breakDuration", $paramBreakDuration, PDO::PARAM_INT);
			$stmt->bindParam(":hikerProfileId", $paramHikerProfileId, PDO::PARAM_INT);
			
			echo "hikerProfileId = ", $profile->hikerProfileId, "\n";
			
			$paramHikerProfileId = $profile->hikerProfileId;
			
			if (isset($profile->startDay) && $profile->startDay != "")
			{
				$paramStartDay = $profile->startDay;
			}
			
			if (isset($profile->endDay) && $profile->endDay != "")
			{
				$paramEndDay = $profile->endDay;
			}
			
			if (isset($profile->speedFactor) && $profile->speedFactor != "")
			{
				$paramSpeedFactor = $profile->speedFactor;
			}
			
			if (isset($profile->startTime) && $profile->startTime != "")
			{
				$paramStartTime = $profile->startTime;
			}
			
			if (isset($profile->endTime) && $profile->endTime != "")
			{
				$paramEndTime = $profile->endTime;
			}
			
			if (isset($profile->breakDuration) && $profile->breakDuration != "")
			{
				$paramBreakDuration = $profile->breakDuration;
			}
			
			$stmt->execute ();
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
}


?>