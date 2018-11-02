<?php

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	// Include config file
	require_once "config.php";
	
	try
	{
		$stmt = $pdo->prepare("select dtfi.dayTemplateFoodItemId AS dayTemplateFoodItemId, name, weight, calories, price from dayTemplateFoodItem dtfi join foodItem on foodItem.foodItemId = dtfi.foodItemId where dayTemplateId = :dayTemplateId");
		
		$stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
		
		$paramDayTemplateId = $_GET["id"];
		
		$stmt->execute ();
		
		$output = $stmt->fetchAll (PDO::FETCH_ASSOC);
		
		echo json_encode($output);
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
	
	$pdo = null;
}
?>
