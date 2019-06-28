<?php

function writeConsolidation ($current, $outputFile)
{
	$out = fopen($outputFile, "ab");
	
	if ($out)
	{
		$jsonString = json_encode($current) . "\n";
		
		fwrite ($out, $jsonString);
		fclose ($out);
	}
}


function consolidate ($inputFile, $outputFile)
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
					if (isset($current) && $trail->cn == $current->cn)
					{
						// Add route to array of routes
						
						array_push($current->routes, $trail->route);
					}
					else
					{
						// Write current collection and start a new one
						
						if (isset($current))
						{
							writeConsolidation ($current, $outputFile);
						}
						
						$current = (object)[];
						
						$current->routes = [];
						
						array_push($current->routes, $trail->route);
						$current->cn = $trail->cn;
						$current->type = $trail->type;
						
						if (isset ($trail->number))
						{
							$current->number = $trail->number;
						}
						
						if (isset($trail->name))
						{
							$current->name = $trail->name;
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
		
		if (isset($current))
		{
			writeConsolidation ($current, $outputFile);
		}
		
		fclose ($handle);
	}
}

if (isset($argv[1]) && isset($argv[2]))
{
	consolidate ($argv[1], $argv[2]);
}
?>