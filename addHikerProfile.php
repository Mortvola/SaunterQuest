<?php

require_once "checkLogin.php";

if($_SERVER["REQUEST_METHOD"] == "POST")
{
	require_once "config.php";

	$userHikeId = $_POST["userHikeId"];
	$profile = json_decode($_POST["profile"]);
	
	try
	{
		$sql = "insert into hikerProfile (creationDate, modificationDate, userId, userHikeId, startDay, endDay, percentage, startTime, endTime, breakDuration)
	 				values (now(), now(), :userId, :userHikeId, :startDay, :endDay, :percentage, :startTime, :endTime, :breakDuration)";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			$stmt->bindParam(":startDay", $paramStartDay, PDO::PARAM_INT);
			$stmt->bindParam(":endDay", $paramEndDay, PDO::PARAM_INT);
			$stmt->bindParam(":percentage", $paramPercentage, PDO::PARAM_INT);
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
			
			if (isset($profile->percentage) && $profile->percentage != "")
			{
				$paramPercentage = $profile->percentage;
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
		echo $e->getMessage();
	}
}

?>