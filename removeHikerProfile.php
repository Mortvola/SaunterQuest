<?php

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	if($_SERVER["REQUEST_METHOD"] == "POST")
	{
		require_once "config.php";

		$hikerProfileId = $_POST["hikerProfileId"];
		
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
			echo $e->getMessage();
		}
	}
}

?>