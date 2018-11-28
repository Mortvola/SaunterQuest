<?php

require_once "checkLogin.php";

if($_SERVER["REQUEST_METHOD"] == "POST")
{
	// Include config file
	require_once "config.php";
	
	try
	{
		$stmt = "DELETE FROM userHike WHERE userHikeId = :userHikeId";
	
		if($stmt = $pdo->prepare($stmt))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			
			$paramUserHikeId = $_POST["id"];
			
			$stmt->execute ();
			
			unset($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}

	// Close connection
	unset($pdo);
}

?>