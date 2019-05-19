<?php

require_once "coordinates.php";

function parseJSON ($inputFile)
{
	$handle = fopen($inputFile, "rb");
	
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
					$files = [];
					
					foreach ($trail->route as $t)
					{
						if (isset($t->lat) && isset($t->lng))
						{
							if (!isset($trail->minLat) || ($trail->minLat > $t->lat))
							{
								$trail->minLat = $t->lat;
							}
							
							if (!isset ($trail->maxLat) || ($trail->maxLat < $t->lat))
							{
								$trail->maxLat = $t->lat;
							}
							
							if (!isset($trail->minLng) || ($trail->minLng > $t->lng))
							{
								$trail->minLng = $t->lng;
							}
							
							if (!isset($trail->maxLng) || ($trail->maxLng < $t->lng))
							{
								$trail->maxLng = $t->lng;
							}
							
							$fileName = getTrailFileName ($t->lat, $t->lng);
							
							$files[$fileName] = TRUE;
						}
					}
					
					$jsonString = json_encode($trail) . "\n";
					
					foreach ($files as $fileName => $bool)
					{
						//echo "Writing to file ", $fileName, "\n";
						
						$out = fopen($fileName, "ab");
					
						if ($out)
						{
							fwrite ($out, $jsonString);
							fclose ($out);
						}
					}
				}
				else
				{
					error_log ("No route:");
					error_log ($jsonString);
				}
			}
			else
			{
				error_log ("JSON not decoable:");
				error_log ($jsonString);
			}
		}
		
		fclose ($handle);
	}
}

parseJSON ("trails.json");
parseJSON ("roads.json");

?>