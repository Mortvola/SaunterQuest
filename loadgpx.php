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
	$shortestDistance = 1000000;
	$duplicateCount = 0;
	
	$points = [];
	
	foreach ($xml->rte->rtept as $coord)
	{
		$lat2 = $coord['lat'];
		$lng2 = $coord['lon'];
		$ele2 = $coord->ele;

		//
		// Throw out coords that seem bad (below the Dead Sea or above Everest).
		//
		if ($ele2 < -413 || $ele2 > 8848)
		{
//			echo "Point thrown out: lat: ", $lat2, ", lon: ", $lng2, ", ele: ", $ele2, "\n";
			continue;
		}
		
		$duplicateFound = false;
		foreach ($points as $point)
		{
			if ($point->lat == $lat2 && $point->lng == $lng2)
			{
				//				echo "Found duplicate point.";
				$duplicateFound = true;
			}
		}
		
		if ($duplicateFound)
		{
			continue;
		}
		
		if ($first)
		{
			$first = false;
		}
		else
		{
			$d = haversineGreatCircleDistance (floatval($lat1), floatval($lng1), floatVal($lat2), floatval($lng2));

			if ($d < 30)
			{
				$duplicateCount++;
				continue;
			}
			
			$shortestDistance = min ($shortestDistance, $d);
			
			$totalDist += $d; // * 1.128547862;
		}
	
		array_push($points, (object)["lat" => floatval($lat2), "lng" => floatval($lng2), "ele" => floatval($ele2), "dist" => $totalDist]);
		
		$lat1 = $lat2;
		$lng1 = $lng2;
		$ele1 = $ele2;
	}
	
	$totalPoints = count($points);
	
	error_log("Shortest Distance: $shortestDistance");
	error_log("Duplicates removed: $duplicateCount");
	error_log("Total points: $totalPoints");
	echo json_encode($points), "\n";
}
?>
