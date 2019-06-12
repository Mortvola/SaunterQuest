<?php

require_once "coordinates.php";

$closeIntersectThreshold = 0;

$intersectionCount = 0;
$overlapCount = 0;
$pointCount = 0;
$duplicatePointCount = 0;
$closeIntersectionCount = 0;
$allIntersections = [];
$overlappingTrailRectscount = 0;
$totalIntersectionsCount = 0;

function vector ($p1, $p2)
{
	return (object)["x" => $p2->lng - $p1->lng, "y" => $p2->lat - $p1->lat];
}


function crossProduct ($v1, $v2)
{
	return $v1->x * $v2->y - $v1->y * $v2->x;
}


function dotProduct ($v1, $v2)
{
	return $v1->x * $v2->x + $v1->y * $v2->y;
}


function nearlyColinear ($numerator, $r, $s, $coord1, $coord3)
{
	global $overlapCount;
	
	if ($numerator <= 1E-8 && $numerator >= -1E-8)
	{
		// Make sure they are not nearly co-linear and overlapping
		$denominator = dotProduct($r, $r);
		
		if ($denominator <= 1E-8 && $denominator >= -1E-8)
		{
			// segments are colinear
			$t0 = dotProduct (vector ($coord1, $coord3), $r) / $denominator;
			$t1 = $t0 + dotProduct($s, $r) / $denominator;
			
			if (dotProduct($s, $r) > 0)
			{
				if ($t0 < 1 && $t1 > 0)
				{
					$overlapCount++;
					//						echo "segments are colinear and overlap\n";

					return true;
				}
			}
			else
			{
				if ($t1 < 1 && $t0 > 0)
				{
					$overlapCount++;
					//						echo "segments are colinear and overlap\n";
					return true;
				}
			}
		}
	}
	
	return false;
}


function segmentsIntersection ($coord1, $coord2, $coord3, $coord4)
{
	global $closeIntersectThreshold;
	global $intersectionCount, $overlapCount, $pointCount, $closeIntersectionCount;
	
	$r = vector ($coord1, $coord2);
	$s = vector ($coord3, $coord4);
	
	if (($r->x == 0 && $r->y == 0)
	 || $s->x == 0 && $s->y == 0)
	{
		$pointCount++;
//		echo "one of the segments is a point\n";
	}
	else
	{
		$v = vector ($coord1, $coord3);
		$numerator = crossProduct($v, $s);
		$denominator = crossProduct ($r, $s);
	
		if ($denominator != 0)
		{
			$t = $numerator / $denominator;
			$u = crossProduct($v, $r) / $denominator;
			
			$intersection = (object)["lat" => $coord1->lat + $t * $r->y, "lng" => $coord1->lng + $t * $r->x];
			
			if ($t >= 0 && $t <= 1
			&& $u >= 0 && $u <= 1)
			{
//				if (!nearlyColinear ($numerator, $r, $s, $coord1, $coord3))
				{
// 					var_dump ($numerator);
// 					var_dump ($denominator);
// 					echo "===== first set ==== \n";
// 					var_dump ($coord1);
// 					var_dump ($coord2);
// 					echo "===== r ==== \n";
// 					var_dump ($r);
					
// 					echo "===== second set ==== \n";
// 					var_dump ($coord3);
// 					var_dump ($coord4);
// 					echo "===== s ==== \n";
// 					var_dump ($s);
	
// 					echo "===== v ==== \n";
// 					var_dump ($v);
				
// 	 				var_dump ($t);
// 	 				var_dump ($u);
					
// 	 				echo "\n\n";
					
					$intersectionCount++;
					return $intersection;
				}
			}
			else if ($t >= 0 && $t <= 1)
			{
				if ($u < 0)
				{
					$uIntersection = (object)["lat" => $coord3->lat + $u * $s->y, "lng" => $coord3->lng + $u * $s->x];
					
					$d = haversineGreatCircleDistance ($coord3->lat, $coord3->lng, $uIntersection->lat, $uIntersection->lng);
					
					if ($d <= $closeIntersectThreshold)
					{
						$closeIntersectionCount++;
						//echo "close intersection: $d\n";
						return $intersection;
					}
				}
				else if ($u > 1)
				{
					$uIntersection = (object)["lat" => $coord3->lat + $u * $s->y, "lng" => $coord3->lng + $u * $s->x];
					
					$d = haversineGreatCircleDistance ($coord4->lat, $coord4->lng, $uIntersection->lat, $uIntersection->lng);
					
					if ($d <= $closeIntersectThreshold)
					{
						$closeIntersectionCount++;
						//echo "close intersection: $d\n";
						return $intersection;
					}
				}
				else
				{
					$closeIntersectionCount++;
					//echo "close intersection: $d\n";
					return $intersection;
				}
			}
			else if ($t < 0)
			{
				$intersection = (object)["lat" => $coord1->lat + $t * $r->y, "lng" => $coord1->lng + $t * $r->x];
				
				$d = haversineGreatCircleDistance ($coord1->lat, $coord1->lng, $intersection->lat, $intersection->lng);
				
				if ($d <= $closeIntersectThreshold)
				{
					if ($u < 0)
					{
						$uIntersection = (object)["lat" => $coord3->lat + $u * $s->y, "lng" => $coord3->lng + $u * $s->x];
						
						$d = haversineGreatCircleDistance ($coord3->lat, $coord3->lng, $uIntersection->lat, $uIntersection->lng);
					
						if ($d <= $closeIntersectThreshold)
						{
							$closeIntersectionCount++;
							//echo "close intersection: $d\n";
							return $intersection;
						}
					}
					else if ($u > 1)
					{
						$uIntersection = (object)["lat" => $coord3->lat + $u * $s->y, "lng" => $coord3->lng + $u * $s->x];
						
						$d = haversineGreatCircleDistance ($coord4->lat, $coord4->lng, $uIntersection->lat, $uIntersection->lng);
						
						if ($d <= $closeIntersectThreshold)
						{
							$closeIntersectionCount++;
							//echo "close intersection: $d\n";
							return $intersection;
						}
					}
					else
					{
						$closeIntersectionCount++;
						//echo "close intersection: $d\n";
						return $intersection;
					}
				}
			}
			else if ($t > 1)
			{
				$d = haversineGreatCircleDistance ($coord2->lat, $coord2->lng, $intersection->lat, $intersection->lng);
			
				if ($d <= $closeIntersectThreshold)
				{
					if ($u < 0)
					{
						$uIntersection = (object)["lat" => $coord3->lat + $u * $s->y, "lng" => $coord3->lng + $u * $s->x];
						
						$d = haversineGreatCircleDistance ($coord3->lat, $coord3->lng, $uIntersection->lat, $uIntersection->lng);
						
						if ($d <= $closeIntersectThreshold)
						{
							$closeIntersectionCount++;
							//echo "close intersection: $d\n";
							return $intersection;
						}
					}
					else if ($u > 1)
					{
						$uIntersection = (object)["lat" => $coord3->lat + $u * $s->y, "lng" => $coord3->lng + $u * $s->x];
						
						$d = haversineGreatCircleDistance ($coord4->lat, $coord4->lng, $uIntersection->lat, $uIntersection->lng);
						
						if ($d <= $closeIntersectThreshold)
						{
							$closeIntersectionCount++;
							//echo "close intersection: $d\n";
							return $intersection;
						}
					}
					else
					{
						$closeIntersectionCount++;
						//echo "close intersection: $d\n";
						return $intersection;
					}
				}
			}
		}
		else
		{
			if ($numerator == 0)
			{
				$denominator = dotProduct($r, $r);
				
				if ($denominator != 0)
				{
					// segments are colinear
					$t0 = dotProduct (vector ($coord1, $coord3), $r) / $denominator;
					$t1 = $t0 + dotProduct($s, $r) / $denominator;
					
					if (dotProduct($s, $r) > 0)
					{
						if ($t0 < 1 && $t1 > 0)
						{
							$overlapCount++;
	//						echo "segments are colinear and overlap\n";
						}
					}
					else
					{
						if ($t1 < 1 && $t0 > 0)
						{
							$overlapCount++;
	//						echo "segments are colinear and overlap\n";
						}
					}
				}
			}
			else
			{
				// segments are parallel
	//			echo "segments are parallel\n";
			}
		}
	}
}

function segmentCrossesTrail ($coord1, $coord2, $route)
{
	$intersections = [];
	
	$prevPoint = $route[0];
	
	for ($i = 1; $i < count($route); $i++)
	{
		if ($prevPoint->lat != $route[$i]->lat
		&& $prevPoint->lng != $route[$i]->lng)
		{
			$intersection = segmentsIntersection ($coord1, $coord2,
				$prevPoint, $route[$i]);
		
			if (isset($intersection))
			{
				if ((isset($prevIntersection)
						&& $prevIntersection == $intersection))
				{
//					error_log ("duplicate intersection: \n" . var_dump_ret($prevIntersection) . "\n" . var_dump_ret($intersection));
				}
				else
				{
// 					if (count($intersections) > 0)
// 					{
// 						error_log("pushing another intersection: \n" . var_dump_ret($intersection) . "\nPrevious = \n" . var_dump_ret($prevIntersection));
// 						error_log($prevIntersection == $intersection ? "equal" : "not equal");
// 						error_log(var_dump_ret($prevIntersection->lat - $intersection->lat));
// 						error_log(var_dump_ret($prevIntersection->lng - $intersection->lng));
// 					}
					
					array_push($intersections, $intersection);
					
					$prevIntersection = $intersection;
				}
			}
			
			$prevPoint = $route[$i];
		}
	}
	
	return $intersections;
}


function withinBounds ($point, $bounds)
{
	return $point->lat >= $bounds[0]
	 && $point->lng >= $bounds[1]
	 && $point->lat <= $bounds[2]
	 && $point->lng <= $bounds[3];
}


function boundsIntersect ($b1, $b2)
{
	return ($b1[0] <= $b2[2]
	 && $b1[2] >= $b2[0]
	 && $b1[1] <= $b2[3]
	 && $b1[3] >= $b2[1]);
}

function var_dump_ret($mixed = null)
{
	ob_start();
	var_dump($mixed);
	$content = ob_get_contents();
	ob_end_clean();
	return $content;
}

function findJunctions2 ($r, $routes, $startIndex, &$intersections)
{
	global $duplicatePointCount;
	global $overlappingTrailRectscount;
	global $totalIntersectionsCount;
	
	for ($k = $startIndex; $k < count($routes); $k++)
	{
		$r2 = $routes[$k];
		
		if (count($r->bounds) == 0 || count($r2->bounds) == 0 || boundsIntersect ($r->bounds, $r2->bounds))
		{
			$prevPoint = $r->route[0];
//			$junctionCount = 0;
			$contiguousJunctionCount = 0;
			$prevHadJunction = false;
			
			for ($i = 1; $i < count($r->route); $i++)
			{
				if ($prevPoint->lat != $r->route[$i]->lat
						&& $prevPoint->lng != $r->route[$i]->lng)
				{
					if (count($r2->bounds) == 0 ||
							withinBounds ($prevPoint, $r2->bounds) ||
							withinBounds ($r->route[$i], $r2->bounds))
					{
						$overlappingTrailRectscount++;
						
						$newIntersections = segmentCrossesTrail ($prevPoint,
								$r->route[$i],
								$r2->route);
						
						if (count($newIntersections) > 0)
						{
							$totalIntersectionsCount += count($newIntersections);
							
// 							if (count($newIntersections) > 1)
// 							{
// 								error_log ("multiple intersections = " . count($newIntersections));
								
// 								error_log (var_dump_ret($newIntersections));
// 							}
							
//							$junctionCount += count($newIntersections);
							
							if ($prevHadJunction)
							{
								$contiguousJunctionCount++;
							}
							else
							{
								if (count($intersections) > 0
										&& $intersections[count($intersections) - 1]->lat == $newIntersections[0]->lat
										&& $intersections[count($intersections) - 1]->lng == $newIntersections[0]->lng)
								{
									// The last point in the All Intersections array is the same as the first point
									// in the New Intersections array. Splice it out and add any remaining New Intersection
									// points to the All Intersections array.
									if (count($newIntersections) > 1)
									{
										array_splice ($newIntersections, 0, 1);
										array_splice ($intersections, count($intersections), 0, $newIntersections);
									}
								}
								else
								{
									array_splice ($intersections, count($intersections), 0, $newIntersections);
								}
							}
							
							$prevHadJunction = true;
						}
						else
						{
							if ($contiguousJunctionCount > 0)
							{
								error_log("longest contiguous junctions: $contiguousJunctionCount");
							}
							
							$contiguousJunctionCount = 0;
							$prevHadJunction = false;
						}
					}
					else
					{
						$prevHadJunction = false;
					}
					
					$prevPoint = $r->route[$i];
				}
				else
				{
					$duplicatePointCount++;
				}
			}
		}
	}
}


function findJunctions ($trail, $handle)
{
	global $allIntersections;
	
//	echo "++++++\n";
	
	$startPos = ftell($handle);
	
	if (isset($trail))
	{
		if (isset($trail->routes))
		{
	//		echo "*****\n";
			
			$intersections = [];
			
			$maxContiguousCount = 0;
			
//			error_log("count of trail routes: ". count($trail->routes));
			
			for ($j = 0; $j < count($trail->routes); $j++)
			{
				$r = $trail->routes[$j];

				findJunctions2 ($r, $trail->routes, $j + 1, $intersections);

				for (;;)
				{
					$jsonString = fgets ($handle);
					
					if (!$jsonString)
					{
						break;
					}
					
//					error_log("+++ file position " . ftell($handle));
					
					$otherTrail = json_decode($jsonString);
					
//					error_log("count of other trail routes: ". count($otherTrail->routes));
					
					findJunctions2 ($r, $otherTrail->routes, 0, $intersections);
				}
				
				fseek ($handle, $startPos);
			}
			
			if (count ($intersections) > 0)
			{
				array_splice($allIntersections, count($allIntersections), 0, $intersections);
//				echo "total intersections ", count($allIntersections), "\n";
			}
		}
		else
		{
			error_log ("No routes:");
			error_log ($jsonString);
		}
	}
	else
	{
		error_log ("JSON not decodable:");
		error_log ($jsonString);
	}
}


function parseJSON ($inputFile)
{
	global $allIntersections;
	global $intersectionCount, $overlapCount, $pointCount, $duplicatePointCount, $closeIntersectionCount;
	global $overlappingTrailRectscount;
	global $totalIntersectionsCount;
	
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
			
			$startPos = ftell($handle);
			
//			error_log ("file position = " . $startPos);
			
			$trail = json_decode($jsonString);
			
			findJunctions ($trail, $handle);
			
			fseek ($handle, $startPos);

			//$intersectionCount = 0;
// 			$overlapCount = 0;
// 			$pointCount = 0;
// 			$duplicatePointCount = 0;
// 			$closeIntersectionCount = 0;
			
//			break;
		}

		fclose ($handle);
	}

	error_log("intersect count = " . $intersectionCount);
	error_log("total intersections = " . $totalIntersectionsCount);
	error_log("intersections stored = " . count($allIntersections));
	error_log("overlapping trail bounds = " . $overlappingTrailRectscount);
	error_log("close intersect count = " . $closeIntersectionCount);
	error_log("overlap count = " . $overlapCount);
	error_log("point count = " . $pointCount);
	error_log("duplicate point count = " . $duplicatePointCount);
	echo json_encode(array_values ($allIntersections));
}

// $intersection = segmentsIntersection (
// 	(object)["lat" => 40.0, "lng" => 112.0],
// 	(object)["lat" => 60.0, "lng" => 112.0],
// 	(object)["lat" => 50.0, "lng" => 110.0],
// 	(object)["lat" => 50.0, "lng" => 113.0]);

// var_dump ($intersection);

parseJSON ("N405W1095.json.deduped");

?>