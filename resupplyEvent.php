<?php

require_once "checkLogin.php";

require_once "config.php";

if($_SERVER["REQUEST_METHOD"] == "POST")
{
	$resupplyEvent = json_decode(file_get_contents("php://input"));
	
	// 	if (!isValidRequest($resupplyEvent) || !hasvalue($userHikeId))
// 	{
// 		http_response_code (400);
// 	}
// 	else
	{
		try
		{
			$sql = "insert into resupplyEvent (creationDate, modificationDate, userHikeId, shippingLocationId)
					values (now(), now(), :userHikeId, :shippingLocationId)";
			
			if ($stmt = $pdo->prepare($sql))
			{
				$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
				$stmt->bindParam(":shippingLocationId", $paramShippingLocationId, PDO::PARAM_STR);
				
				$paramUserHikeId = $resupplyEvent->userHikeId;
				$paramShippingLocationId = $resupplyEvent->shippingLocationId;
				
				$stmt->execute ();
				
				$resupplyEventId = $pdo->lastInsertId ("resupplyEventId");
				
				echo json_encode($resupplyEventId);
				
				unset ($stmt);
			}
		}
		catch(PDOException $e)
		{
			http_response_code (500);
			echo $e->getMessage();
		}
	}
}
?>