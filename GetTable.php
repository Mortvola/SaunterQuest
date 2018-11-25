<?php

require_once "checkLogin.php";

// Include config file
require_once "config.php";

try
{
	$stmt = $pdo->prepare("select foodItemId, manufacturer, name, calories, gramsServingSize from foodItem");
	
	$stmt->execute ();
	
	$results['foodItems'] = $stmt->fetchAll (PDO::FETCH_ASSOC);
	
	foreach ($results['foodItems'] as &$foodItem)
	{
		$stmt = $pdo->prepare("select foodItemServingSizeId, description, grams from foodItemServingSize where foodItemId = :foodItemId");
		
		$stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
		$paramFoodItemId = $foodItem['foodItemId'];
		
		$stmt->execute ();
		
		$foodItem['lookup'] = $stmt->fetchAll (PDO::FETCH_ASSOC);
	}
	
	echo json_encode($results);
//	echo var_dump($output);
}
catch(PDOException $e)
{
	echo $e->getMessage();
}

$pdo = null;

?>
