<?php 
require_once "checkLogin.php";

if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$handle = fopen("trails/N40W112.trails", "rb");
	$first = true;
	
	echo "[";
	
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
