<?php

require_once "coordinates.php";

$xml = simplexml_load_file($argv[1]);

if (!isset($xml))
{
	echo "Could not open file ", $argv[1], "\n";
}
else
{
	$first = true;
	$totalDist = 0;
	
	$points = [];
	
	foreach ($xml->rte->rtept as $coord)
	{
		$lat2 = $coord['lat'];
		$lng2 = $coord['lon'];
		$ele2 = $coord->ele;
	
		if ($first)
		{
			$first = false;
		}
		else
		{
			$d = haversineGreatCircleDistance (floatval($lat1), floatval($lng1), floatVal($lat2), floatval($lng2));
			
			$totalDist += $d; // * 1.128547862;
		}
	
		array_push($points, (object)["lat" => floatval($lat2), "lng" => floatval($lng2), "ele" => floatval($ele2), "dist" => $totalDist]);
		
		$lat1 = $lat2;
		$lng1 = $lng2;
		$ele1 = $ele2;
	
	}
	
	echo json_encode($points), "\n";
}
?>
