<?php

require_once "checkLogin.php";

if($_SERVER["REQUEST_METHOD"] == "POST")
{
	// Include config file
	require_once "config.php";
	
	try
	{
		$stmt = "DELETE FROM dayTemplateFoodItem WHERE dayTemplateId = :dayTemplateId";
	
		if($stmt = $pdo->prepare($stmt))
		{
			$stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
			
			$paramDayTemplateId = $_POST["mealPlanId"];
			
			$stmt->execute ();
			
			unset($stmt);
		}
		
		$stmt = "DELETE FROM dayTemplate WHERE dayTemplateId = :dayTemplateId AND userId = :userId";
		
		if($stmt = $pdo->prepare($stmt))
		{
			$stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			
			$paramDayTemplateId = $_POST["mealPlanId"];
			$paramUserId = $_SESSION["userId"];
			
			$stmt->execute ();
			
			unset($stmt);
		}
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}

	// Close connection
	unset($pdo);
}

?>