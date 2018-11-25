<?php

require_once "checkLogin.php";

if($_SERVER["REQUEST_METHOD"] == "POST")
{
	require_once "config.php";

	$profile = json_decode($_POST["profile"]);
	
	try
	{
		$sql = "update hikerProfile set
					modificationDate = now(),
					startDay = :startDay,
					endDay = :endDay,
					percentage = :percentage,
					startTime = :startTime,
					endTime = :endTime,
					breakDuration = :breakDuration
				where hikerProfileId = :hikerProfileId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":startDay", $paramStartDay, PDO::PARAM_INT);
			$stmt->bindParam(":endDay", $paramEndDay, PDO::PARAM_INT);
			$stmt->bindParam(":percentage", $paramPercentage, PDO::PARAM_INT);
			$stmt->bindParam(":startTime", $paramStartTime, PDO::PARAM_INT);
			$stmt->bindParam(":endTime", $paramEndTime, PDO::PARAM_INT);
			$stmt->bindParam(":breakDuration", $paramBreakDuration, PDO::PARAM_INT);
			$stmt->bindParam(":hikerProfileId", $paramHikerProfileId, PDO::PARAM_INT);
			
			$paramHikerProfileId = $profile->hikerProfileId;
			
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
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
}

?>