<?php 
require_once "checkLogin.php";
require_once "config.php";
require_once "coordinates.php";

if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$trails = [];
	
	$handle = fopen("trails/N40W112.trails", "rb");
	
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
					array_push ($trails, $trail->route);
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
	
	echo json_encode($trails);
}
else if ($_SERVER["REQUEST_METHOD"] == "PUT")
{
}
?>