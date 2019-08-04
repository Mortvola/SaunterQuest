<?php

require_once "coordinates.php";

$continueCount = 0;

function parseJSON ($inputFile)
{
	global $continueCount;

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

					for ($t = 0; $t < count($trail->route); $t++)
					{
						if (isset($trail->route[$t]->lat) && isset($trail->route[$t]->lng))
						{
							if (!isset($minLat))
							{
								$minLat = $trail->route[$t]->lat;
							}
							else
							{
								$minLat = min ($minLat, $trail->route[$t]->lat);
							}

							if (!isset ($maxLat))
							{
								$maxLat = $trail->route[$t]->lat;
							}
							else
							{
								$maxLat = max($maxLat, $trail->route[$t]->lat);
							}

							if (!isset($minLng))
							{
								$minLng = $trail->route[$t]->lng;
							}
							else
							{
								$minLng = min($minLng, $trail->route[$t]->lng);
							}

							if (!isset($maxLng))
							{
								$maxLng = $trail->route[$t]->lng;
							}
							else
							{
								$maxLng = max($maxLng, $trail->route[$t]->lng);
							}

							$fileName = "trails/" . getTrailFileName ($trail->route[$t]->lat, $trail->route[$t]->lng, ".initial");

							if (!isset($prevFileName) || $fileName != $prevFileName)
							{
								if (!isset($files[$fileName]))
								{
									$files[$fileName] = (object)[];
									$files[$fileName]->type = $trail->type;
									$files[$fileName]->cn = $trail->cn;
									if (isset($trail->name))
									{
										$files[$fileName]->name = $trail->name;
									}

									$files[$fileName]->routes = [];
								}

								array_push($files[$fileName]->routes, (object)[]);
								$trailRoute = $files[$fileName]->routes[count($files[$fileName]->routes) - 1];
								$trailRoute->bounds = [];
								$trailRoute->route = [];
								$trailRoute->feature = $trail->feature;

								if (isset ($prevFileName))
								{
									$prevTrailRoute->bounds = [$minLat, $minLng, $maxLat, $maxLng];
									$prevTrailRoute->to = $fileName . ':' . $continueCount;
									$trailRoute->from = $prevFileName . ':' . $continueCount;
									$trailRoute->startIndex = $t;

									$continueCount++;
								}

								unset ($minLat);
								unset ($minLng);
								unset ($maxLat);
								unset ($maxLng);
							}

							array_push($trailRoute->route, (object)["lat" => $trail->route[$t]->lat, "lng" => $trail->route[$t]->lng]);

							$prevFileName = $fileName;
							$prevTrailRoute = $trailRoute;
						}
					}

					if (count($trailRoute->bounds) == 0 && count($trailRoute->route) > 1)
					{
						if (!isset($minLat))
						{
							echo "count = ", count($trailRoute->route), "\n";
						}
						$trailRoute->bounds = [$minLat, $minLng, $maxLat, $maxLng];
					}

					foreach ($files as $fileName => $fileTrail)
					{
						//echo "Writing to file ", $fileName, "\n";

						$out = fopen($fileName, "ab");

						if ($out)
						{
							$jsonString = json_encode($fileTrail) . "\n";

							fwrite ($out, $jsonString);
							fclose ($out);
						}
					}

					unset($prevFileName);
					unset($prevTrailRoute);
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

if (isset($argv[1]))
{
	parseJSON ($argv[1]);
}
//parseJSON ("roads.combined.json");

?>
