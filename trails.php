<?php 
require_once "checkLogin.php";
require_once "coordinates.php";

if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$bounds = $_GET["b"];
	
	$parts = explode (",", $bounds);
	
	// todo: determine what sections the bounding rectangle covers and
	// return the trails in those sections.
	$lat = floatval($parts[0]) + (floatval($parts[2]) - floatval($parts[0])) / 2;
	$lng = floatval($parts[1]) + (floatval($parts[3]) - floatval($parts[1])) / 2;

	$fileName = "trails/" . getTrailFileName ($lat, $lng, ".trails");
	
	$first = true;
	
	echo '{ "bounds":[', $parts[0], ',', $parts[1], ',', $parts[2], ',', $parts[3], '],';
	echo '"trails":[';
	
	$handle = fopen($fileName, "rb");
	
	if ($handle)
	{
		for (;;)
		{
			$jsonString = fgets ($handle);
			
			if (!$jsonString)
			{
				break;
			}
			
			$trail = json_decode($jsonString);
			
			if (isset($trail))
			{
				if (isset($trail->routes))
				{
					$t = (object)[ "type" => $trail->type, "cn" => $trail->cn, "name" => $trail->name, "routes" => $trail->routes];
	
					if (!$first)
					{
						echo ",";
					}
					$first = false;
					
					echo json_encode ($t);
				}
			}
			else
			{
				echo "Failed to JSON decode:\n";
				echo $jsonString;
			}
		}
		
		fclose ($handle);
	}
	
	echo "]";

// 	echo '"intersections":';
	
// 	$handle = fopen ("trails/N405W1095.inter.json", "rb");
	
// 	if ($handle)
// 	{
// 		$jsonString = fgets ($handle);
		
// 		echo $jsonString;
		
// 		fclose ($handle);
// 	}
// 	else
// 	{
// 		echo "[]";
// 	}
	
	echo "}";
}
else if ($_SERVER["REQUEST_METHOD"] == "PUT")
{
}
?>
