<?php 
require_once "checkLogin.php";
require_once "config.php";

if($_SERVER["REQUEST_METHOD"] == "PUT")
{
	$routeUpdate = json_decode(file_get_contents("php://input"));
	
	try
	{
		$sql = "select file
				from hike h
				join userHike uh on uh.hikeId = h.hikeId
				where uh.userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);

			$paramUserHikeId = $routeUpdate->userHikeId;
			
			$stmt->execute ();
			
			$output = $stmt->fetchAll (PDO::FETCH_ASSOC);
			
			$fileName = $output[0]["file"];
			
			unset ($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
	
	$segments = json_decode(file_get_contents("data/" . $fileName));
	
	echo "starting segments: ", count($segments), "\n";
	
	var_dump($routeUpdate);
	
	$length = $routeUpdate->end - $routeUpdate->start;
	
	echo "length = $length\n";
	
	array_splice ($segments, $routeUpdate->start + 1,
			$length,
			$routeUpdate->points);
	
	echo "remaining segments: ", count($segments), "\n";
	
	$result = file_put_contents ("data/" . $fileName, json_encode($segments));
	
	echo "result = $result\n";
}
?>