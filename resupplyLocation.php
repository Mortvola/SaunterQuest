<?php

require_once "checkLogin.php";

require_once "config.php";


function hasValue($v)
{
    return isset($v) && ($v != "");
}


function isValidRequest($location)
{
    return hasValue($location->lat)
     && hasValue($location->lng)
     && hasValue($location->name)
     && hasValue($location->address1)
     && hasValue($location->city)
     && hasValue($location->state)
     && hasValue($location->zip);
}


if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $userId = $_SESSION["userId"];
    $userHikeId = $_GET["id"];
    
    try {
        $sql = "select shippingLocationId, lat, lng, sl.name, inCareOf, address1, address2, city, state, zip
				from shippingLocation sl
				join userHike uh ON (uh.userHikeId = sl.userHikeId OR uh.hikeId = sl.hikeId) and uh.userHikeId =  :userHikeId";
        
        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
            
            $paramUserHikeId = $userHikeId;
            
            $stmt->execute();
            
            $output = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($output);
            
            unset($stmt);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $userHikeId = $_POST["userHikeId"];
    $location = json_decode($_POST["resupplyLocation"]);

    if (!isValidRequest($location) || !hasvalue($userHikeId)) {
        http_response_code(400);
    } else {
        try {
            $sql = "insert into shippingLocation (creationDate, modificationDate, userHikeId, lat, lng,
						name, inCareOf, address1, address2, city, state, zip)
					values (now(), now(), :userHikeId, :lat, :lng, TRIM(:name), TRIM(:inCareOf),
						TRIM(:address1), TRIM(:address2), TRIM(:city), TRIM(:state), TRIM(:zip))";
            
            if ($stmt = $pdo->prepare($sql)) {
                $stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
                $stmt->bindParam(":lat", $paramLat, PDO::PARAM_INT);
                $stmt->bindParam(":lng", $paramLng, PDO::PARAM_INT);
                $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
                $stmt->bindParam(":inCareOf", $paramInCareOf, PDO::PARAM_STR);
                $stmt->bindParam(":address1", $paramAddress1, PDO::PARAM_STR);
                $stmt->bindParam(":address2", $paramAddress2, PDO::PARAM_STR);
                $stmt->bindParam(":city", $paramCity, PDO::PARAM_STR);
                $stmt->bindParam(":state", $paramState, PDO::PARAM_STR);
                $stmt->bindParam(":zip", $paramZip, PDO::PARAM_STR);
                
                $paramUserHikeId = $userHikeId;
                $paramLat = $location->lat;
                $paramLng = $location->lng;
                $paramName = $location->name;
                if (isset($location->inCareOf)) {
                    $paramInCareOf = $location->inCareOf;
                }
                $paramAddress1 = $location->address1;
                if (isset($location->address2)) {
                    $paramAddress2 = $location->address2;
                }
                $paramCity = $location->city;
                $paramState = $location->state;
                $paramZip = $location->zip;
                
                $stmt->execute();
                
                $shippingLocationId = $pdo->lastInsertId("shippingLocationId");
                
                echo json_encode($shippingLocationId);
                
                unset($stmt);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo $e->getMessage();
        }
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "PUT") {
    $location = json_decode(file_get_contents("php://input"));
    
    if (!isValidRequest($location) || !hasValue($location->shippingLocationId)) {
        http_response_code(400);
    } else {
        try {
            $sql = "update shippingLocation set
						modificationDate = now(),
						lat = :lat,
						lng = :lng,
						name = TRIM(:name),
						inCareOf = TRIM(:inCareOf),
						address1 = TRIM(:address1),
						address2 = TRIM(:address2),
						city = TRIM(:city),
						state = TRIM(:state),
						zip = TRIM(:zip)
					where shippingLocationId = :shippingLocationId";
            
            if ($stmt = $pdo->prepare($sql)) {
                $stmt->bindParam(":shippingLocationId", $paramShippingLocationId, PDO::PARAM_INT);
                $stmt->bindParam(":lat", $paramLat, PDO::PARAM_INT);
                $stmt->bindParam(":lng", $paramLng, PDO::PARAM_INT);
                $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
                $stmt->bindParam(":inCareOf", $paramInCareOf, PDO::PARAM_STR);
                $stmt->bindParam(":address1", $paramAddress1, PDO::PARAM_STR);
                $stmt->bindParam(":address2", $paramAddress2, PDO::PARAM_STR);
                $stmt->bindParam(":city", $paramCity, PDO::PARAM_STR);
                $stmt->bindParam(":state", $paramState, PDO::PARAM_STR);
                $stmt->bindParam(":zip", $paramZip, PDO::PARAM_STR);
                
                $paramShippingLocationId = $location->shippingLocationId;
                $paramLat = $location->lat;
                $paramLng = $location->lng;
                $paramName = $location->name;
                if (isset($location->inCareOf)) {
                    $paramInCareOf = $location->inCareOf;
                }
                $paramAddress1 = $location->address1;
                if (isset($location->address2)) {
                    $paramAddress2 = $location->address2;
                }
                $paramCity = $location->city;
                $paramState = $location->state;
                $paramZip = $location->zip;
                
                $stmt->execute();
                
                unset($stmt);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo $e->getMessage();
        }
    }
}
