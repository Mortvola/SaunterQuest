<?php 

require_once "checkLogin.php";
require_once "config.php";

$userId = $_SESSION["userId"];

if($_SERVER["REQUEST_METHOD"] == "GET")
{
	$userHikeId = $_GET["id"];
	
	try
	{
		$sql = "select tc.trailConditionId, tc.hikeId, tc.userHikeId, startLat, startLng, endLat, endLng, type, description, speedFactor
				from trailCondition tc
				join userHike uh on (uh.userHikeId = tc.userHikeId OR uh.hikeId = tc.hikeId)
				and uh.userHikeId = :userHikeId and uh.userId = :userId";
		
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
else if ($_SERVER["REQUEST_METHOD"] == "POST")
{
	$trailCondition = json_decode(file_get_contents("php://input"));
	
	try
	{
		$sql = "insert into trailCondition (creationDate, modificationDate, userHikeId,
					type, description,
					startLat, startLng, endLat, endLng,
					speedFactor)
	 			values (now(), now(), :userHikeId,
					:type, :description,
					:startLat, :startLng, :endLat, :endLng,
					:speedFactor)";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			$stmt->bindParam(":type", $paramType, PDO::PARAM_INT);
			$stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
			$stmt->bindParam(":startLat", $paramStartLat, PDO::PARAM_INT);
			$stmt->bindParam(":startLng", $paramStartLng, PDO::PARAM_INT);
			$stmt->bindParam(":endLat", $paramEndLat, PDO::PARAM_INT);
			$stmt->bindParam(":endLng", $paramEndLng, PDO::PARAM_INT);
			$stmt->bindParam(":speedFactor", $paramSpeedFactor, PDO::PARAM_INT);
			
			$paramUserHikeId = $trailCondition->userHikeId;
			$paramType = $trailCondition->type;
			$paramDescription = $trailCondition->description;
			$paramStartLat = $trailCondition->startLat;
			$paramStartLng = $trailCondition->startLng;
			$paramEndLat = $trailCondition->endLat;
			$paramEndLng = $trailCondition->endLng;
			
			if (isset($trailCondition->speedFactor) && $trailCondition->speedFactor != "")
			{
				$paramSpeedFactor = $trailCondition->speedFactor;
			}
			
			$stmt->execute ();
			
			$trailCondition->trailConditionId = $pdo->lastInsertId ("trailConditionId");
			
			echo json_encode($trailCondition);
			
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
	$trailCondition = json_decode(file_get_contents("php://input"));
	
	try
	{
		$sql = "update trailCondition set
					modificationDate = now(),
					type = :type,
					startLat = :startLat,
					startLng = :startLng,
					endLat = :endLat,
					endLng = :endLng,
					description = :description,
					speedFactor = :speedFactor
				where trailConditionId = :trailConditionId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":type", $paramType, PDO::PARAM_INT);
			$stmt->bindParam(":startLat", $paramStartLat, PDO::PARAM_INT);
			$stmt->bindParam(":startLng", $paramStartLng, PDO::PARAM_INT);
			$stmt->bindParam(":endLat", $paramEndLat, PDO::PARAM_INT);
			$stmt->bindParam(":endLng", $paramEndLng, PDO::PARAM_INT);
			$stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
			$stmt->bindParam(":speedFactor", $paramSpeedFactor, PDO::PARAM_INT);
			$stmt->bindParam(":trailConditionId", $paramTrailConditionId, PDO::PARAM_INT);
			
			$paramTrailConditionId = $trailCondition->trailConditionId;
			
			$paramType = $trailCondition->type;
			$paramStartLat = $trailCondition->startLat;
			$paramStartLng = $trailCondition->startLng;
			$paramEndLat = $trailCondition->endLat;
			$paramEndLng = $trailCondition->endLng;

			$paramDescription = $trailCondition->description;
			
			$paramSpeedFactor = $trailCondition->speedFactor;
			
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
else if($_SERVER["REQUEST_METHOD"] == "DELETE")
{
	$trailConditionId = json_decode(file_get_contents("php://input"));
	
	try
	{
		$sql = "delete from trailCondition
				where trailConditionId = :trailConditionId";
//				and userId = :userId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			//$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":trailConditionId", $paramTrailConditionId, PDO::PARAM_INT);
			
			//$paramUserId = $_SESSION["userId"];
			$paramTrailConditionId = $trailConditionId;
			
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