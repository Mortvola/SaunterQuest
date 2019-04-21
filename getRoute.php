<?php

require_once "checkLogin.php";

$userId = $_SESSION["userId"];
$userHikeId = $_GET["id"];

require_once "config.php";

class hike {};

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

		echo file_get_contents($hike[0]->file);

		unset($stmt);
	}
}
catch(PDOException $e)
{
	http_response_code (500);
	echo $e->getMessage();
	throw $e;
}

?>
