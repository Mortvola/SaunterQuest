<?php

require_once "checkLogin.php";
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $userId = $_SESSION["userId"];
    $userHike = json_decode(file_get_contents("php://input"));

    try {
        $stmt = "INSERT INTO userHike (creationDate, modificationDate, userId, name)
				 VALUES (now(), now(), :userId, :name)";

        if ($stmt = $pdo->prepare($stmt)) {
            $stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
            $stmt->bindParam(":name", $paramName, PDO::PARAM_INT);

            $paramUserId = $userId;
            $paramName = $userHike->name;

            $stmt->execute();

            $userHike->userHikeId = $pdo->lastInsertId("userHikeId");

            echo json_encode($userHike);

            unset($stmt);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "DELETE") {
    $userHike = json_decode(file_get_contents("php://input"));

    try {
        $stmt = "DELETE FROM userHike WHERE id = :userHikeId";

        if ($stmt = $pdo->prepare($stmt)) {
            $stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);

            $paramUserHikeId = $userHike->userHikeId;

            $stmt->execute();

            unset($stmt);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
}
