<?php

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
							
							$lat = floor($t->lat);
							$lng = floor($t->lng);
							
							if ($lat && $lng)
							{
								if ($lat >= 0)
								{
									$fileName = "N" . $lat;
								}
								else
								{
									$fileName = "S" . -$lat;
								}
								
								if ($lng >= 0)
								{
									$fileName .= "E" . $lng;
								}
								else
								{
									$fileName .= "W" . -$lng;
								}
								
								//echo "Route in ", $fileName, "\n";
								
								$files[$fileName . ".trails"] = TRUE;
							}
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