<?php
require_once "checkLogin.php";
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] == "GET")
{
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
		http_response_code (500);
		echo $e->getMessage();
	}
}
if ($_SERVER["REQUEST_METHOD"] == "POST")
{
	$foodItem = json_decode(file_get_contents("php://input"));

	try
	{
		$sql = "INSERT INTO foodItem (creationDate, modificationDate, manufacturer, name, calories, gramsServingSize,
										  totalFat, saturatedFat, transFat, cholesterol, sodium, totalCarbohydrates,
										  dietaryFiber, sugars, protein)
					VALUES (now(), now(), :manufacturer, :name, :calories, :gramsServingSize,
							:totalFat, :saturatedFat, :transFat, :cholesterol,
							:sodium, :totalCarbohydrates, :dietaryFiber,
							:sugars, :protein)";

		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":manufacturer", $paramManufacturer, PDO::PARAM_STR);
			$stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
			$stmt->bindParam(":calories", $paramCalories, PDO::PARAM_INT);
			$stmt->bindParam(":gramsServingSize", $paramGramsServingSize, PDO::PARAM_INT);
			$stmt->bindParam(":totalFat", $paramTotalFat, PDO::PARAM_INT);
			$stmt->bindParam(":saturatedFat", $paramSaturatedFat, PDO::PARAM_INT);
			$stmt->bindParam(":transFat", $paramTransFat, PDO::PARAM_INT);
			$stmt->bindParam(":cholesterol", $paramCholesterol, PDO::PARAM_INT);
			$stmt->bindParam(":sodium", $paramSodium, PDO::PARAM_INT);
			$stmt->bindParam(":totalCarbohydrates", $paramTotalCarbohydrates, PDO::PARAM_INT);
			$stmt->bindParam(":dietaryFiber", $paramDietaryFiber, PDO::PARAM_INT);
			$stmt->bindParam(":sugars", $paramSugars, PDO::PARAM_INT);
			$stmt->bindParam(":protein", $paramProtein, PDO::PARAM_INT);

			$paramManufacturer = $foodItem->manufacturer;
			$paramName = $foodItem->name;
			$paramCalories = $foodItem->calories;
			$paramGramsServingSize = $foodItem->gramsServingSize;

			$paramTotalFat = $foodItem->totalFat;

			if ($foodItem->saturatedFat != "")
			{
				$paramSaturatedFat = $foodItem->saturatedFat;
			}

			if ($foodItem->transFat != "")
			{
				$paramTransFat = $foodItem->transFat;
			}

			if ($foodItem->cholesterol != "")
			{
				$paramCholesterol = $foodItem->cholesterol;
			}

			if ($foodItem->sodium != "")
			{
				$paramSodium = $foodItem->sodium;
			}

			$paramTotalCarbohydrates = $foodItem->totalCarbohydrates;

			if ($foodItem->dietaryFiber != "")
			{
				$paramDietaryFiber = $foodItem->dietaryFiber;
			}

			if ($foodItem->sugars != "")
			{
				$paramSugars = $foodItem->sugars;
			}

			$paramProtein = $foodItem->protein;

			$stmt->execute();

			$foodItemId = $pdo->lastInsertId ("foodItemId");

			unset($stmt);

			if ($foodItemId)
			{
				$sql = "INSERT INTO foodItemServingSize (creationDate, modificationDate, foodItemId, description, grams)
							VALUES (now(), now(), :foodItemId, :description, :grams)";

				if ($stmt = $pdo->prepare($sql))
				{
					$stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
					$stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
					$stmt->bindParam(":grams", $paramGrams, PDO::PARAM_INT);

					$paramFoodItemId = $foodItemId;
					$paramDescription = $foodItem->servingDescription;
					$paramGrams = $foodItem->gramsServingSize;

					$stmt->execute ();

					unset($stmt);
				}
			}
		}

		unset($pdo);
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
}
?>