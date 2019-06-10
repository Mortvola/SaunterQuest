<?php

require_once "coordinates.php";

$closeIntersectThreshold = 1;

$intersectionCount = 0;
$overlapCount = 0;
$pointCount = 0;
$duplicatePointCount = 0;
$closeIntersectionCount = 0;
$allIntersections = [];
$totalJunctionsRemoved = 0;

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

function segmentCrossesTrail ($coord1, $coord2, $route, &$intersections)
{
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
//							echo "found intersection\n";
							
							if (count($intersections) != 0
							&& ($intersections[count($intersections) - 1]->lat != $intersection->lat
							|| $intersections[count($intersections) - 1]->lng != $intersection->lng))
							{
								//echo "duplicate intersection.\n";
							}
							else
							{
// 								echo "===== intersection ==== \n";
// 								var_dump ($intersection);
								
// 								if (count($intersections) > 0)
// 								{
// 									var_dump ($intersections[count($intersections) - 1]);
// 								}
								
								array_push($intersections, $intersection);
							}

//							echo "\n\n";
						}
						
						$prevPoint = $route[$i];
					}
				}
}


function getBounds ($route)
{
	foreach ($route as $r)
	{
		if (isset($r->lat) && isset($r->lng))
		{
			if (!isset($minLat))
			{
				$minLat = $r->lat;
			}
			else
			{
				$minLat = min ($minLat, $r->lat);
			}
			
			if (!isset ($maxLat))
			{
				$maxLat = $r->lat;
			}
			else
			{
				$maxLat = max($maxLat, $r->lat);
			}
			
			if (!isset($minLng))
			{
				$minLng = $r->lng;
			}
			else
			{
				$minLng = min($minLng, $r->lng);
			}
			
			if (!isset($maxLng))
			{
				$maxLng = $r->lng;
			}
			else
			{
				$maxLng = max($maxLng, $r->lng);
			}
		}
	}
	
	return [$minLat, $minLng, $maxLat, $maxLng];
}

function withinBounds ($point, $bounds)
{
	return $point->lat >= $bounds[0]
	 && $point->lng >= $bounds[1]
	 && $point->lat <= $bounds[2]
	 && $point->lng <= $bounds[3];
}


function var_dump_ret($mixed = null) {
	ob_start();
	var_dump($mixed);
	$content = ob_get_contents();
	ob_end_clean();
	return $content;
}

function removeDuplicates2 (&$routes, $otherRoutes, $startingIndex)
{
	global $allIntersections, $intersectionCount;
	global $duplicatePointCount, $totalJunctionsRemoved;
	
	$debug = false;
	
	error_log ("count of routes = " . count($routes));
	
	if (count($routes) > 0)
	{
		for ($j = $startingIndex; $j < count($otherRoutes); $j++)
		{
			$r2 = $otherRoutes[$j];
		
			$dedupedRoutes = [];
			
			foreach ($routes as $r)
			{
				$prevPoint = $r->route[0];
				$contiguousJunctionCount = 0;
				$prevHadJunction = false;
				
				$dedupedRoute = [];
				
				for ($i = 1; $i < count($r->route); $i++)
				{
					if ($prevPoint->lat != $r->route[$i]->lat
							&& $prevPoint->lng != $r->route[$i]->lng)
					{
						if (count($r2->bounds) == 0 ||
								withinBounds ($prevPoint, $r2->bounds) ||
								withinBounds ($r->route[$i], $r2->bounds))
						{
							$newIntersections = [];
							
							segmentCrossesTrail ($prevPoint,
									$r->route[$i],
									$r2->route, $newIntersections);
							
							if ($debug)
							{
								error_log("intersections = " . count($newIntersections));
							}
							
							if (count($newIntersections) > 0)
							{
								if ($prevHadJunction)
								{
									$contiguousJunctionCount++;
								}
								else
								{
									if ($debug)
									{
										error_log("pushed point");
									}
									
									if (count($dedupedRoute) == 0)
									{
										array_push($dedupedRoute, $prevPoint);
									}
									
									array_push($dedupedRoute, $r->route[$i]);
								}
								
								$prevHadJunction = true;
							}
							else
							{
								if ($prevHadJunction && $contiguousJunctionCount > 0)
								{
									
									error_log ("contiguous junctions: count of dedupedRoute = " . count($dedupedRoute));
									
									if (count($dedupedRoute) > 1)
									{
										array_push($dedupedRoutes, (object)["bounds" => getBounds ($dedupedRoute), "route" => $dedupedRoute]);
									}
									
									$dedupedRoute = [];
								}
								
//								if ($contiguousJunctionCount > 0)
//								{
//									echo "$contiguousJunctionCount\n";
//								}
									
								$totalJunctionsRemoved += $contiguousJunctionCount;
								$contiguousJunctionCount = 0;
								
								array_push($dedupedRoute, $r->route[$i]);
								$prevHadJunction = false;
							}
						}
						else
						{
							$prevHadJunction = false;
							
							if (count($dedupedRoute) == 0)
							{
								array_push($dedupedRoute, $prevPoint);
							}
							
							array_push($dedupedRoute, $r->route[$i]);
						}
						
						$prevPoint = $r->route[$i];
					}
					else
					{
						$duplicatePointCount++;
					}
				}
				
				error_log ("count of dedupedRoute = " . count($dedupedRoute));
				
				if (count($dedupedRoute) > 1)
				{
					array_push($dedupedRoutes, (object)["bounds" => getBounds($dedupedRoute), "route" => $dedupedRoute]);
				}
			}
			
			array_splice($routes, 0, count($routes), $dedupedRoutes);
		}
	}
	else
	{
		error_log ("No points in route");
	}
}


function removeDuplicates ($trail, $handle)
{
	global $allIntersections, $intersectionCount;
	global $duplicatePointCount, $totalJunctionsRemoved;
	
//	echo "Here ****************\n";
	
	if (isset($trail))
	{
		if (isset($trail->routes) && count($trail->routes) > 0)
		{
			if (isset($trail->name))
			{
				error_log ("Processing trail " . $trail->name);
			}
			else
			{
				error_log ("Processing trail " . $trail->cn);
			}
			
			$dedupedRoutes = [];
				
//			echo "routes count = ", count($trail->routes), "\n";
			
			for ($j = 0; $j < count($trail->routes); $j++)
			{
				$newDedupedRoutes = [];
				
				if (count($trail->routes[$j]->route) > 0)
				{
					// initialize the deduped routes array with the route passed in
					array_push($newDedupedRoutes, (object)["bounds" => $trail->routes[$j]->bounds, "route" => $trail->routes[$j]->route]);
					
					removeDuplicates2 ($newDedupedRoutes, $trail->routes, $j + 1);
					
					if (count($newDedupedRoutes) <= 0)
					{
						error_log ("**** new routes left ***");
					}
					
					$debug = false;
					
	//				if (isset($trail->name) && $trail->name == "LIMBER FLAG YURT X-C SKI"
	//						&& isset($otherTrail->name) && $otherTrail->name == "LIMBER FLAG YURT")
	//				{
	//					echo "Debug trails.\n";
	//					$debug = true;
	//				}
					
					for (;;)
					{
						if (count($newDedupedRoutes) <= 0)
						{
							break;
						}
						
						//		echo "Reading.\n";
						$jsonString = fgets ($handle);
						
						if (!$jsonString)
						{
							break;
						}
						
						$otherTrail = json_decode($jsonString);
						
						if (!isset($otherTrail))
						{
							error_log ("Missing routes: " . var_dump_ret($otherTrail));
							error_log ("jsonString = " . $jsonString);
						}
						
						removeDuplicates2 ($newDedupedRoutes, $otherTrail->routes, 0);
						
						if (count($newDedupedRoutes) <= 0)
						{
							if (isset($otherTrail->name))
							{
								error_log ("Removed by trail " . $otherTrail->name);
							}
							else
							{
								error_log ("Removed by trail " . $otherTrail->cn);
							}
						}
						
						if ($debug)
						{
							var_dump ($newDedupedRoutes);
						}
					}
				
					if (count($newDedupedRoutes) > 0)
					{
						array_splice ($dedupedRoutes, count($dedupedRoutes), 0, $newDedupedRoutes);
					}
				}
			}
			
			array_splice ($trail->routes, 0, count($trail->routes), $dedupedRoutes);
		}
		else
		{
			error_log ("No routes:");
			error_log ($jsonString);
		}
	}
	else
	{
		error_log ("JSON not decoable:");
		error_log ($jsonString);
	}
}


function parseJSON ($inputFile)
{
	global $allIntersections, $totalJunctionsRemoved;
	global $intersectionCount, $overlapCount, $pointCount, $duplicatePointCount, $closeIntersectionCount;
	
	$handle = fopen($inputFile, "rb");
	
	if ($handle)
	{
		$storedTrailCount = 0;
		$removedTrailcount = 0;
		
		for (;;)
		{
			$jsonString = fgets ($handle);
			
			if (!$jsonString)
			{
				break;
			}
			
			$startPos = ftell($handle);
			
			$trail = json_decode($jsonString);
			
			removeDuplicates ($trail, $handle);
			
			if (count($trail->routes) > 0)
			{
				$storedTrailCount++;
				
				echo json_encode($trail) . "\n";
			}
			else
			{
				$removedTrailcount++;
				
				if (isset($trail->name))
				{
					error_log ("Removed trail " . $trail->name);
				}
				else
				{
					error_log ("Removed trail " . $trail->cn);
				}
			}
			
			fseek ($handle, $startPos);

// 			echo "intersect count = ", $intersectionCount, " ";
// 			echo "close intersect count = ", $closeIntersectionCount, " ";
// 			echo "overlap count = ", $overlapCount, " ";
// 			echo "point count = ", $pointCount, " ";
// 			echo "duplicate point count = ", $duplicatePointCount, "\n";
			
			//$intersectionCount = 0;
			$overlapCount = 0;
			$pointCount = 0;
			$closeIntersectionCount = 0;
			
//			break;
		}

		$intersectionCount = 0;
		
		fclose ($handle);
	}

	error_log ("stored trails = " . $storedTrailCount);
	error_log ("trails removed = " . $removedTrailcount);
	error_log("junctions removed = " . $totalJunctionsRemoved);
	error_log("duplicate point count = " . $duplicatePointCount);
	
//	echo json_encode(array_values ($allIntersections));
}

// $intersection = segmentsIntersection (
// 	(object)["lat" => 40.0, "lng" => 112.0],
// 	(object)["lat" => 60.0, "lng" => 112.0],
// 	(object)["lat" => 50.0, "lng" => 110.0],
// 	(object)["lat" => 50.0, "lng" => 113.0]);

// var_dump ($intersection);

parseJSON ("N405W1095.trails.test");

?>