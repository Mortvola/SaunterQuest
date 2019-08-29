<?php

require_once "checkLogin.php";
require_once "config.php";


if ($_SERVER["REQUEST_METHOD"] == "GET") {
    try {
        $stmt = $pdo->prepare("select dayTemplateFoodItemId, mealTimeId, fi.foodItemId AS foodItemId, manufacturer, name,
				servingSizeDescription, gramsServingSize, calories, foodItemServingSizeId, numberOfServings
				from dayTemplateFoodItem dtfi
				join foodItem fi on fi.foodItemId = dtfi.foodItemId
				where dayTemplateId = :dayTemplateId");

        $stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);

        $paramDayTemplateId = $_GET["id"];

        $stmt->execute();

        $output = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($output as &$foodItem) {
            $stmt = $pdo->prepare("select foodItemServingSizeId, description, grams from foodItemServingSize where foodItemId = :foodItemId");

            $stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
            $paramFoodItemId = $foodItem['foodItemId'];

            $stmt->execute();

            $foodItem['servingDescriptions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($output);
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }

    unset($pdo);
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $obj = json_decode($_POST["x"], false);

    //
    if (!property_exists($obj, "dayTemplateId")) {
        $sql = "INSERT INTO dayTemplate (creationDate, modificationDate, name, userId) VALUES (now(), now(), :name, :userId)";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);

            if (!property_exists($obj, "name")) {
                $stmt->bindParam(":name", $paramName, PDO::PARAM_NULL);
            } else {
                $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
                $paramName = $obj->name;
            }

            $paramUserId = $_SESSION["userId"];

            $stmt->execute();

            $obj->id = $pdo->lastInsertId("id");

            unset($stmt);
        }
    }

    if (property_exists($obj, "dayTemplateId")) {
        try {
            if (property_exists($obj, "addedItems")) {
                // Prepare a select statement
                $sql = "INSERT INTO dayTemplateFoodItem
							(creationDate, modificationDate, dayTemplateId, mealTimeId, foodItemId,
							 foodItemServingSizeId, numberOfServings)
						VALUES (now(), now(), :dayTemplateId, :mealTimeId, :itemId, :foodItemServingSizeId, :numberOfServings)";

                if ($stmt = $pdo->prepare($sql)) {
                    // Bind variables to the prepared statement as parameters
                    $stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
                    $stmt->bindParam(":mealTimeId", $paramMealTimeId, PDO::PARAM_INT);
                    $stmt->bindParam(":itemId", $paramItemId, PDO::PARAM_INT);
                    $stmt->bindParam(":foodItemServingSizeId", $paramFoodItemServingSizeId, PDO::PARAM_INT);
                    $stmt->bindParam(":numberOfServings", $paramNumberOfServings, PDO::PARAM_STR);

                    foreach ($obj->addedItems as $item) {
                        // Set parameters
                        $paramDayTemplateId = $obj->dayTemplateId;
                        $paramMealTimeId = $item->mealTimeId;
                        $paramItemId = $item->foodItemId;
                        $paramFoodItemServingSizeId = $item->foodItemServingSizeId;
                        $paramNumberOfServings = $item->numberOfServings;

                        $stmt->execute();
                    }

                    // Close statement
                    unset($stmt);
                }
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo $e->getMessage();
        }

        try {
            if (property_exists($obj, "deletedItems")) {
                $sql = "DELETE FROM dayTemplateFoodItem WHERE dayTemplateFoodItemId = :id";

                if ($stmt = $pdo->prepare($sql)) {
                    // Bind variables to the prepared statement as parameters
                    $stmt->bindParam(":id", $paramId, PDO::PARAM_INT);

                    foreach ($obj->deletedItems as $id) {
                        // Set parameters
                        $paramId = $id;

                        $stmt->execute();
                    }

                    // Close statement
                    unset($stmt);
                }
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo $e->getMessage();
        }

        try {
            if (property_exists($obj, "modifiedItems")) {
                $sql = "UPDATE dayTemplateFoodItem
						SET modificationDate = now(),
							foodItemServingSizeId = :foodItemServingSizeId,
							numberOfServings = :numberOfServings
						WHERE dayTemplateFoodItemId = :dayTemplateFoodItemId";

                if ($stmt = $pdo->prepare($sql)) {
                    // Bind variables to the prepared statement as parameters
                    $stmt->bindParam(":foodItemServingSizeId", $paramFoodItemServingSizeId, PDO::PARAM_INT);
                    $stmt->bindParam(":numberOfServings", $paramNumberOfServings, PDO::PARAM_STR);
                    $stmt->bindParam(":dayTemplateFoodItemId", $paramDayTemplateFoodItemId, PDO::PARAM_INT);

                    foreach ($obj->modifiedItems as $item) {
                        // Set parameters
                        $paramDayTemplateFoodItemId = $item->dayTemplateFoodItemId;
                        $paramFoodItemServingSizeId = $item->foodItemServingSizeId;
                        $paramNumberOfServings = $item->numberOfServings;

                        $stmt->execute();
                    }

                    // Close statement
                    unset($stmt);
                }
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo $e->getMessage();
        }
    }

    // Close connection
    unset($pdo);
} elseif ($_SERVER["REQUEST_METHOD"] == "DELETE") {
    $mealPlanId = json_decode(file_get_contents("php://input"));

    try {
        $stmt = "DELETE FROM dayTemplateFoodItem WHERE dayTemplateId = :dayTemplateId";

        if ($stmt = $pdo->prepare($stmt)) {
            $stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);

            $paramDayTemplateId = $mealPlanId;

            $stmt->execute();

            unset($stmt);
        }

        $stmt = "DELETE FROM dayTemplate WHERE id = :dayTemplateId AND userId = :userId";

        if ($stmt = $pdo->prepare($stmt)) {
            $stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
            $stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);

            $paramDayTemplateId = $mealPlanId;
            $paramUserId = $_SESSION["userId"];

            $stmt->execute();

            unset($stmt);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }

    // Close connection
    unset($pdo);
}
