<?php
require_once "checkLogin.php";
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    try {
        $stmt = $pdo->prepare("select foodItemId, manufacturer, name, calories,
							servingSizeDescription, gramsServingSize,
							totalFat, saturatedFat, transFat, cholesterol, sodium,
							totalCarbohydrates, dietaryFiber, sugars, protein
							from foodItem
							order by manufacturer, name");

        $stmt->execute();

        $results['foodItems'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($results['foodItems'] as &$foodItem) {
            $stmt = $pdo->prepare("select foodItemServingSizeId, description, grams
								  from foodItemServingSize
								  where foodItemId = :foodItemId");

            $stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
            $paramFoodItemId = $foodItem['foodItemId'];

            $stmt->execute();

            $foodItem['servingDescriptions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($results);
        //  echo var_dump($output);
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $foodItem = json_decode(file_get_contents("php://input"));

    try {
        $sql = "INSERT INTO foodItem (
					creationDate, modificationDate, manufacturer, name, calories, servingSizeDescription, gramsServingSize,
					totalFat, saturatedFat, transFat, cholesterol, sodium, totalCarbohydrates,
					dietaryFiber, sugars, protein)
				VALUES (
					now(), now(), :manufacturer, :name, :calories, :servingSizeDescription, :gramsServingSize,
					:totalFat, :saturatedFat, :transFat, :cholesterol,
					:sodium, :totalCarbohydrates, :dietaryFiber,
					:sugars, :protein)";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":manufacturer", $paramManufacturer, PDO::PARAM_STR);
            $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
            $stmt->bindParam(":calories", $paramCalories, PDO::PARAM_INT);
            $stmt->bindParam(":servingSizeDescription", $paramServingSizeDescription, PDO::PARAM_STR);
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
            $paramServingSizeDescription = $foodItem->servingSizeDescription;
            $paramGramsServingSize = $foodItem->gramsServingSize;

            $paramTotalFat = $foodItem->totalFat;

            if ($foodItem->saturatedFat != "") {
                $paramSaturatedFat = $foodItem->saturatedFat;
            }

            if ($foodItem->transFat != "") {
                $paramTransFat = $foodItem->transFat;
            }

            if ($foodItem->cholesterol != "") {
                $paramCholesterol = $foodItem->cholesterol;
            }

            if ($foodItem->sodium != "") {
                $paramSodium = $foodItem->sodium;
            }

            $paramTotalCarbohydrates = $foodItem->totalCarbohydrates;

            if ($foodItem->dietaryFiber != "") {
                $paramDietaryFiber = $foodItem->dietaryFiber;
            }

            if ($foodItem->sugars != "") {
                $paramSugars = $foodItem->sugars;
            }

            $paramProtein = $foodItem->protein;

            $stmt->execute();

            $foodItemId = $pdo->lastInsertId("foodItemId");

            unset($stmt);

            if (isset($foodItemId)) {
                foreach ($foodItem->servingDescriptions as $servingDescription) {
                    try {
                        $sql = "INSERT INTO foodItemServingSize (creationDate, modificationDate, foodItemId, description, grams)
							VALUES (now(), now(), :foodItemId, :description, :grams)";

                        if ($stmt = $pdo->prepare($sql)) {
                            $stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
                            $stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
                            $stmt->bindParam(":grams", $paramGrams, PDO::PARAM_INT);

                            $paramFoodItemId = $foodItemId;
                            $paramDescription = $servingDescription->description;
                            $paramGrams = $servingDescription->grams;

                            $stmt->execute();

                            unset($stmt);
                        }
                    } catch (PDOException $e) {
                        echo $e->getMessage();
                    }
                }
            }
        }

        unset($pdo);
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "PUT") {
    $foodItem = json_decode(file_get_contents("php://input"));

    try {
        $sql = "UPDATE foodItem SET
					modificationDate = now(),
					manufacturer = :manufacturer,
					name = :name,
					calories = :calories,
					servingSizeDescription = :servingSizeDescription,
					gramsServingSize = :gramsServingSize,
					totalFat = :totalFat,
					saturatedFat = :saturatedFat,
					transFat = :transFat,
					cholesterol = :cholesterol,
					sodium = :sodium,
					totalCarbohydrates = :totalCarbohydrates,
					dietaryFiber = :dietaryFiber,
					sugars = :sugars,
					protein = :protein
				WHERE foodItemId = :foodItemId";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
            $stmt->bindParam(":manufacturer", $paramManufacturer, PDO::PARAM_STR);
            $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
            $stmt->bindParam(":calories", $paramCalories, PDO::PARAM_INT);
            $stmt->bindParam(":servingSizeDescription", $paramServingSizeDescription, PDO::PARAM_STR);
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

            $paramFoodItemId = $foodItem->foodItemId;
            $paramManufacturer = $foodItem->manufacturer;
            $paramName = $foodItem->name;
            $paramCalories = $foodItem->calories;
            $paramServingSizeDescription = $foodItem->servingSizeDescription;
            $paramGramsServingSize = $foodItem->gramsServingSize;

            $paramTotalFat = $foodItem->totalFat;

            if ($foodItem->saturatedFat != "") {
                $paramSaturatedFat = $foodItem->saturatedFat;
            }

            if ($foodItem->transFat != "") {
                $paramTransFat = $foodItem->transFat;
            }

            if ($foodItem->cholesterol != "") {
                $paramCholesterol = $foodItem->cholesterol;
            }

            if ($foodItem->sodium != "") {
                $paramSodium = $foodItem->sodium;
            }

            $paramTotalCarbohydrates = $foodItem->totalCarbohydrates;

            if ($foodItem->dietaryFiber != "") {
                $paramDietaryFiber = $foodItem->dietaryFiber;
            }

            if ($foodItem->sugars != "") {
                $paramSugars = $foodItem->sugars;
            }

            $paramProtein = $foodItem->protein;

            $stmt->execute();

            unset($stmt);

            foreach ($foodItem->servingDescriptions as $servingDescription) {
                if (isset($servingDescription->servingSizeId)) {
                    try {
                        $sql = "UPDATE foodItemServingSize
								SET modificationDate=now(),
								description = :description,
								grams = :grams
								WHERE foodItemServingSizeId = :servingSizeId";

                        if ($stmt = $pdo->prepare($sql)) {
                            $stmt->bindParam(":servingSizeId", $paramServingSizeId, PDO::PARAM_INT);
                            $stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
                            $stmt->bindParam(":grams", $paramGrams, PDO::PARAM_INT);

                            $paramServingSizeId = $servingDescription->servingSizeId;
                            $paramDescription = $servingDescription->description;
                            $paramGrams = $servingDescription->grams;

                            $stmt->execute();

                            unset($stmt);
                        }
                    } catch (PDOException $e) {
                    }
                } else {
                    try {
                        $sql = "INSERT INTO foodItemServingSize (creationDate, modificationDate, foodItemId, description, grams)
								VALUES (now(), now(), :foodItemId, :description, :grams)";

                        if ($stmt = $pdo->prepare($sql)) {
                            $stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
                            $stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
                            $stmt->bindParam(":grams", $paramGrams, PDO::PARAM_INT);

                            $paramFoodItemId = $foodItem->foodItemId;
                            $paramDescription = $servingDescription->description;
                            $paramGrams = $servingDescription->grams;

                            $stmt->execute();

                            unset($stmt);
                        }
                    } catch (PDOException $e) {
                    }
                }
            }
        }

        unset($pdo);
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
}
