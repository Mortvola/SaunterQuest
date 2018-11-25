<?php

require_once "checkLogin.php";

if($_SERVER["REQUEST_METHOD"] == "POST")
{
	// Include config file
	require_once "config.php";
   
	$obj = json_decode($_POST["x"], false);
	
	// 
	if (!property_exists($obj, "dayTemplateId"))
	{
		$sql = "INSERT INTO dayTemplate (creationDate, modificationDate, name, userId) VALUES (now(), now(), :name, :userId)";
	 	
	 	if($stmt = $pdo->prepare($sql))
	 	{
	 		$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);

	 		if (!property_exists($obj, "name"))
	 		{
	 			$stmt->bindParam(":name", $paramName, PDO::PARAM_NULL);
	 		}
	 		else
	 		{
	 			$stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
	 			$paramName = $obj->name;
	 		}
	 		
	 		$paramUserId = $_SESSION["userId"];
	 		
	 		$stmt->execute ();
	 		
	 		$obj->dayTemplateId = $pdo->lastInsertId ("dayTemplateId");
	 		
	 		unset($stmt);
	 	}
	}

	if (property_exists($obj, "dayTemplateId"))
	{
		try
		{
			if (property_exists($obj, "addedItems"))
			{
				// Prepare a select statement
				$sql = "INSERT INTO dayTemplateFoodItem
							(creationDate, modificationDate, dayTemplateId, mealTimeId, foodItemId,
							 foodItemServingSizeId, numberOfServings)
						VALUES (now(), now(), :dayTemplateId, :mealTimeId, :itemId, :foodItemServingSizeId, :numberOfServings)";
			
	 			if($stmt = $pdo->prepare($sql))
	 			{
	 				// Bind variables to the prepared statement as parameters
	 				$stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
	 				$stmt->bindParam(":mealTimeId", $paramMealTimeId, PDO::PARAM_INT);
	 				$stmt->bindParam(":itemId", $paramItemId, PDO::PARAM_INT);
	 				$stmt->bindParam(":foodItemServingSizeId", $paramFoodItemServingSizeId, PDO::PARAM_INT);
	 				$stmt->bindParam(":numberOfServings", $paramNumberOfServings, PDO::PARAM_STR);
					
	 				foreach ($obj->addedItems as $item)
	 				{
	 					// Set parameters
	 					$paramDayTemplateId = $obj->dayTemplateId;
	 					$paramMealTimeId = $item->mealTimeId;
	 					$paramItemId = $item->foodItemId;
	 					$paramFoodItemServingSizeId = $item->foodItemServingSizeId;
	 					$paramNumberOfServings = $item->numberOfServings;
						
	 					$stmt->execute ();
	 				}
					
	 				// Close statement
	 				unset($stmt);
	 			}
			}
		}
		catch(PDOException $e)
		{
			echo $e->getMessage();
		}
			
		try
		{
			if (property_exists($obj, "deletedItems"))
			{
				$sql = "DELETE FROM dayTemplateFoodItem WHERE dayTemplateFoodItemId = :id";

				if ($stmt = $pdo->prepare($sql))
				{
					// Bind variables to the prepared statement as parameters
					$stmt->bindParam(":id", $paramId, PDO::PARAM_INT);
					
					foreach ($obj->deletedItems as $id)
					{
						// Set parameters
						$paramId = $id;
						
						$stmt->execute ();
					}
					
					// Close statement
					unset($stmt);
				}
			}
		}
		catch(PDOException $e)
		{
			echo $e->getMessage();
		}
		
		try
		{
			if (property_exists($obj, "modifiedItems"))
			{
				$sql = "UPDATE dayTemplateFoodItem
						SET modificationDate = now(),
							foodItemServingSizeId = :foodItemServingSizeId,
							numberOfServings = :numberOfServings
						WHERE dayTemplateFoodItemId = :dayTemplateFoodItemId";
				
				if ($stmt = $pdo->prepare($sql))
				{
					// Bind variables to the prepared statement as parameters
					$stmt->bindParam(":foodItemServingSizeId", $paramFoodItemServingSizeId, PDO::PARAM_INT);
					$stmt->bindParam(":numberOfServings", $paramNumberOfServings, PDO::PARAM_STR);
					$stmt->bindParam(":dayTemplateFoodItemId", $paramDayTemplateFoodItemId, PDO::PARAM_INT);
					
					foreach ($obj->modifiedItems as $item)
					{
						// Set parameters
						$paramDayTemplateFoodItemId = $item->dayTemplateFoodItemId;
						$paramFoodItemServingSizeId = $item->foodItemServingSizeId;
						$paramNumberOfServings = $item->numberOfServings;
						
						$stmt->execute ();
					}
					
					// Close statement
					unset($stmt);
				}
			}
		}
		catch(PDOException $e)
		{
			echo $e->getMessage();
		}
	}
	
	// Close connection
	unset($pdo);
}

?>
