<?php
	$sql = "select name
			from hike
			where hikeId = :hikeId";
	
	if ($stmt = $pdo->prepare($sql))
	{
		$stmt->bindParam(":hikeId", $paramHikeId, PDO::PARAM_INT);
		
		$paramHikeId = $hikeId;
		
		$stmt->execute ();
		
		$hike = $stmt->fetchAll (PDO::FETCH_ASSOC);
		
		unset ($stmt);
		
		$sql = "insert into userHike (creationDate, modificationDate, hikeId, userId, name)
				values (now(), now(), :hikeId, :userId, :name)";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":hikeId", $paramHikeId, PDO::PARAM_INT);
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
			
			$paramHikeId = $hikeId;
			$paramUserId = $_SESSION["userId"];
			$paramName = $hike[0]["name"]." Test Hike";
			
			$stmt->execute ();
			
			$userHikeId = $pdo->lastInsertId ("userHikeId");
			
			unset ($stmt);
		}
	}
?>