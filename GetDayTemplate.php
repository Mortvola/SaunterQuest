<?php

require_once "checkLogin.php";

// Include config file
require_once "config.php";

try
{
	$stmt = $pdo->prepare("select dayTemplateFoodItemId, mealTimeId, fi.foodItemId AS foodItemId, manufacturer, name, gramsServingSize, calories, foodItemServingSizeId, numberOfServings
			from dayTemplateFoodItem dtfi
			join foodItem fi on fi.foodItemId = dtfi.foodItemId
			where dayTemplateId = :dayTemplateId");
			
	$stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
	
	$paramDayTemplateId = $_GET["id"];
	
	$stmt->execute ();
	
	$output = $stmt->fetchAll (PDO::FETCH_ASSOC);
	
	foreach ($output as &$foodItem)
	{
		$stmt = $pdo->prepare("select foodItemServingSizeId, description, grams from foodItemServingSize where foodItemId = :foodItemId");
		
		$stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
		$paramFoodItemId = $foodItem['foodItemId'];
		
		$stmt->execute ();
		
		$foodItem['lookup'] = $stmt->fetchAll (PDO::FETCH_ASSOC);
	}
	
	echo json_encode($output);
}
catch(PDOException $e)
{
	http_response_code (500);
	echo $e->getMessage();
}

$pdo = null;

?>
