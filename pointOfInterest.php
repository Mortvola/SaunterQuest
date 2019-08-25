<?php
namespace bpp;

require_once "pointOfInterestUtils.php";


if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $userHikeId = $_GET["id"];

    $pointsOfInterest = getPointsOfInterest($userHikeId);

    if (isset($pointsOfInterest)) {
        echo json_encode($pointsOfInterest);
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "PUT") {
    $pointOfInterest = json_decode(file_get_contents("php://input"));

    try {
        $sql = "update pointOfInterest
				set modificationDate = now(), lat = :lat, lng = :lng, name = :name, description = :description
				where pointOfInterestId = :pointOfInterestId";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);
            $stmt->bindParam(":lat", $paramLat, PDO::PARAM_STR);
            $stmt->bindParam(":lng", $paramLng, PDO::PARAM_STR);
            $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
            $stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);

            $paramPointOfInterestId = $pointOfInterest->pointOfInterestId;
            $paramLat = $pointOfInterest->lat;
            $paramLng = $pointOfInterest->lng;
            $paramName = $pointOfInterest->name;
            $paramDescription = $pointOfInterest->description;

            $stmt->execute();

            unset($stmt);
        }

        // Delete any constraints and then re-add them, if there are any
        $sql = "delete from pointOfInterestConstraint where pointOfInterestId = :pointOfInterestId";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);

            $paramPointOfInterestId = $pointOfInterest->pointOfInterestId;

            $stmt->execute();

            unset($stmt);
        }

        if (isset($pointOfInterest->constraints)) {
            foreach ($pointOfInterest->constraints as $constraint) {
                $sql = "insert into pointOfInterestConstraint (creationDate, modificationDate, pointOfInterestId, type, time)
						values (now(), now(), :pointOfInterestId, :type, :time)";

                if ($stmt = $pdo->prepare($sql)) {
                    $stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);
                    $stmt->bindParam(":type", $paramType, PDO::PARAM_STR);
                    $stmt->bindParam(":time", $paramTime, PDO::PARAM_INT);

                    $paramPointOfInterestId = $pointOfInterest->pointOfInterestId;
                    $paramType = $constraint->type;
                    $paramTime = $constraint->time;

                    $stmt->execute();

                    unset($stmt);
                }
            }
        }

        echo json_encode($pointOfInterest);
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $pointOfInterest = json_decode(file_get_contents("php://input"));

    try {
        $sql = "insert into pointOfInterest (creationDate, modificationDate, userHikeId, lat, lng, name, description)
	 				values (now(), now(), :userHikeId, :lat, :lng, :name, :description)";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
    //      $stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
            $stmt->bindParam(":lat", $paramLat, PDO::PARAM_STR);
            $stmt->bindParam(":lng", $paramLng, PDO::PARAM_STR);
            $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
            $stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);

            $paramUserHikeId = $pointOfInterest->userHikeId;
    //      $paramUserId = $_SESSION["userId"];
            $paramLat = $pointOfInterest->lat;
            $paramLng = $pointOfInterest->lng;
            $paramName = $pointOfInterest->name;
            $paramDescription = $pointOfInterest->description;

            $stmt->execute();

            $pointOfInterest->pointOfInterestId = $pdo->lastInsertId("pointOfInterestId");

            unset($stmt);
        }

        if (isset($pointOfInterest->pointOfInterestId) && isset($pointOfInterest->constraints)) {
            foreach ($pointOfInterest->constraints as $constraint) {
                $sql = "insert into pointOfInterestConstraint (creationDate, modificationDate, pointOfInterestId, type, time)
						values (now(), now(), :pointOfInterestId, :type, :time)";

                if ($stmt = $pdo->prepare($sql)) {
                    $stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);
                    $stmt->bindParam(":type", $paramType, PDO::PARAM_STR);
                    $stmt->bindParam(":time", $paramTime, PDO::PARAM_INT);

                    $paramPointOfInterestId = $pointOfInterest->pointOfInterestId;
                    $paramType = $constraint->type;
                    $paramTime = $constraint->time;

                    $stmt->execute();

                    unset($stmt);
                }
            }
        }

        echo json_encode($pointOfInterest);
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "DELETE") {
    $pointOfInterestId = json_decode(file_get_contents("php://input"));

    try {
        //
        // Delete the point of interest
        //
        $sql = "delete from pointOfInterest
				where pointOfInterestId = :pointOfInterestId";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);

            $paramPointOfInterestId = $pointOfInterestId;

            $stmt->execute();

            unset($stmt);
        }

        //
        // Delete any constraints associated with the point of interest
        //
        $sql = "delete from pointOfInterestConstraint
				where pointOfInterestId = :pointOfInterestId";

        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);

            $paramPointOfInterestId = $pointOfInterestId;

            $stmt->execute();

            unset($stmt);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
}
