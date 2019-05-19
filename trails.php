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

	$fileName = "trails/" . getTrailFileName ($lat, $lng);
	
	$first = true;
	
	echo "[";
	
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
				if (isset($trail->route))
				{
					$t = (object)[ "type" => $trail->type, "route" => $trail->route];
	
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
}
else if ($_SERVER["REQUEST_METHOD"] == "PUT")
{
}
?>
