<?php

require_once "coordinates.php";

$closeIntersectThreshold = 0;

$intersectionCount = 0;
$overlapCount = 0;
$pointCount = 0;
$duplicatePointCount = 0;
$closeIntersectionCount = 0;
$allIntersections = [];
$edges = [];
$overlappingTrailRectscount = 0;
$totalIntersectionsCount = 0;
$connectorCount = 0;
$connectors = (object)[ "type" => "connector", "cn" => "connector", "routes" => []];

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
	global $duplicatePointCount;
	
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
					
					$intersection->index = $i;
					
					array_push($intersections, $intersection);
					
					$prevIntersection = $intersection;
				}
			}
			
			$prevPoint = $route[$i];
		}
		else
		{
			$duplicatePointCount++;
		}
	}
	
	return $intersections;
}


function addConnector ($coord, $route)
{
	global $connectorCount;
	global $connectors;
	
	$result = pointOnPath ($coord, $route, 30);
	
	if (isset($result))
	{
		$route = (object)["route" => []];
		array_push ($route->route, (object)["lat" => $coord->lat, "lng" => $coord->lng]);
		array_push ($route->route, $result->point);
		
		array_push($connectors->routes, $route);
		
		$connectorCount++;
		
		$intersection = (object)[];
		
		$intersection->connectorIndex = count($connectors->routes);
		$intersection->index = $result->index;
		$intersection->lat = $result->point->lat;
		$intersection->lng = $result->point->lng;
	}

	if (isset($intersection))
	{
		return $intersection;
	}
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

function findJunctions2 ($trail1, $index, $trail2, $startIndex)
{
	global $duplicatePointCount;
	global $overlappingTrailRectscount;
	global $totalIntersectionsCount;
	
	$intersections = [];
	
	$r = $trail1->routes[$index];
	
	for ($k = $startIndex; $k < count($trail2->routes); $k++)
	{
		$r2 = $trail2->routes[$k];
		
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
							withinBounds ($prevPoint, $r2->bounds, 0) ||
							withinBounds ($r->route[$i], $r2->bounds, 0))
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
								foreach ($newIntersections as $intersection)
								{
									if (count($intersections) == 0
										|| ($intersections[count($intersections) - 1]->lat != $intersection->lat
											&& $intersections[count($intersections) - 1]->lng != $intersection->lng))
									{
										array_push ($intersections, (object)[
											"lat" => $intersection->lat,
											"lng" => $intersection->lng,
											"route" => [
												(object)["type" => $trail1->type, "cn" => $trail1->cn, "index" => $index, "routeIndex" => $i, "routeIndexMax" => count($r->route) - 1,],
												(object)["type" => $trail2->type, "cn" => $trail2->cn, "index" => $k, "routeIndex" => $intersection->index, "routeIndexMax" => count($r2->route) - 1]]]);
									}
								}
							}
							
							$prevHadJunction = true;
						}
						else
						{
							// If this was the first segment in the route check to see if there are any near by
							// segments in the other route. We may want to add a connector if close enough.
							if ($i == 1)
							{
								$newIntersection = addConnector ($prevPoint, $r2->route);

								if (isset($newIntersection))
								{
									array_push ($intersections, (object)[
											"lat" => $prevPoint->lat,
											"lng" => $prevPoint->lng,
											"route" => [
													(object)["type" => $trail1->type, "cn" => $trail1->cn, "index" => $index, "routeIndex" => 0, "routeIndexMax" => count($r->route) - 1,],
													(object)["type" => "connector", "cn" => "connector", "index" => $newIntersection->connectorIndex, "routeIndex" => 0, "routeIndexMax" => 1]]]);

									if ($trail1->cn == "440010391")
									{
										error_log (json_encode ($intersections[count($intersections) - 1]));
									}
									
									array_push ($intersections, (object)[
											"lat" => $newIntersection->lat,
											"lng" => $newIntersection->lng,
											"route" => [
												(object)["type" => "connector", "cn" => "connector", "index" => $newIntersection->connectorIndex, "routeIndex" => 1, "routeIndexMax" => 1,],
													(object)["type" => $trail2->type, "cn" => $trail2->cn, "index" => $k, "routeIndex" => $newIntersection->index, "routeIndexMax" => count($r2->route) - 1]]]);

									if ($trail1->cn == "440010391")
									{
										error_log (json_encode ($intersections[count($intersections) - 1]));
									}
								}
							}
							else if ($i == count($r->route) - 1)
							{
								$newIntersection = addConnector ($r->route[$i], $r2->route);
								
								if (isset($newIntersection))
								{
									array_push ($intersections, (object)[
											"lat" => $r->route[$i]->lat,
											"lng" => $r->route[$i]->lng,
											"route" => [
												(object)["type" => $trail1->type, "cn" => $trail1->cn, "index" => $index, "routeIndex" => count($r->route) - 1, "routeIndexMax" => count($r->route) - 1,],
												(object)["type" => "connector", "cn" => "connector", "index" => $newIntersection->connectorIndex, "routeIndex" => 0, "routeIndexMax" => 1]]]);
									
									if ($trail1->cn == "440010391")
									{
										error_log (json_encode ($intersections[count($intersections) - 1]));
									}
									
									array_push ($intersections, (object)[
											"lat" => $newIntersection->lat,
											"lng" => $newIntersection->lng,
											"route" => [
												(object)["type" => "connector", "cn" => "connector", "index" => $newIntersection->connectorIndex, "routeIndex" => 1, "routeIndexMax" => 1,],
													(object)["type" => $trail2->type, "cn" => $trail2->cn, "index" => $k, "routeIndex" => $newIntersection->index, "routeIndexMax" => count($r2->route) - 1]]]);

									if ($trail1->cn == "440010391")
									{
										error_log (json_encode ($intersections[count($intersections) - 1]));
									}
								}
							}
							
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
	
	return $intersections;
}


function addIntersections (
	$intersections)
{
	global $allIntersections;
	
	if (count ($intersections) > 0)
	{
		foreach ($intersections as $intersection)
		{
			$i = (object)[
				"lat" => $intersection->lat,
				"lng" => $intersection->lng
			];
			
			$i->routes = [];

			foreach ($intersection->route as $route)
			{
				array_push($i->routes, (object)[
					"type" => $route->type,
					"cn" => $route->cn,
					"index" => $route->index,
					"routeIndex" => $route->routeIndex,
					"routeIndexMax" => $route->routeIndexMax
				]);
			}
			
			array_push($allIntersections, $i);
		}
	}
}


function findJunctions ($trail, $handle)
{
//	echo "++++++\n";
	
	$startPos = ftell($handle);
	
	if (isset($trail))
	{
		if (isset($trail->routes))
		{
	//		echo "*****\n";
			
			$maxContiguousCount = 0;
			
//			error_log("count of trail routes: ". count($trail->routes));
			
			for ($j = 0; $j < count($trail->routes); $j++)
			{
				$r = $trail->routes[$j];

				$intersections = findJunctions2 ($trail, $j, $trail, $j + 1);

				addIntersections ($intersections);
				
				for (;;)
				{
					$jsonString = fgets ($handle);
					
					if (!$jsonString)
					{
						break;
					}
					
//					error_log("+++ file position " . ftell($handle));
					
					$otherTrail = json_decode($jsonString);
					
					if ($otherTrail->type != "connector")
					{
//						error_log("count of other trail routes: ". count($otherTrail->routes));
					
						$intersections = findJunctions2 ($trail, $j, $otherTrail, 0);

						addIntersections ($intersections);
					}
				}
				
				fseek ($handle, $startPos);
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

// 440010391

function findEdges ()
{
	global $allIntersections;
	global $edges;
	
	for ($i = 0; $i < count($allIntersections); $i++)
	{
		$node1 = $allIntersections[$i];
		
		$debug = false;
		foreach ($node1->routes as $route)
		{
			if ($route->cn == "440010391")
			{
				$debug = true;
				break;
			}
		}

		if ($debug)
		{
			error_log ("Node: " . json_encode ($node1));
		}
		
		for ($k = 0; $k < count($node1->routes); $k++)
		{
			if (!isset($node1->routes[$k]->prevConnected) || !isset($node1->routes[$k]->nextConnected))
			{
				if ($debug)
				{
					error_log ("search for other junction to match " . $node1->routes[$k]->cn . ", route " . $node1->routes[$k]->index . ", routeIndex " . $node1->routes[$k]->routeIndex);
				}
				
				unset($foundPrevTerminus);
				unset($foundNextTerminus);
				
				for ($j = $i + 1; $j < count($allIntersections); $j++)
				{
					$node2 = $allIntersections[$j];
				
					for ($l = 0; $l < count($node2->routes); $l++)
					{
						if ($node1->routes[$k]->cn == $node2->routes[$l]->cn && $node1->routes[$k]->index == $node2->routes[$l]->index)
						{
							if (!isset($node1->routes[$k]->prevConnected)
								&& $node1->routes[$k]->routeIndex > $node2->routes[$l]->routeIndex
								&& (!isset($foundPrevTerminus)
								|| ($node2->routes[$l]->routeIndex > $foundPrevTerminus->routeIndex)))
							{
								$foundPrevTerminus = &$node2->routes[$l];
								$foundPrevNodeIndex = $j;
								$foundPrevRouteIndex = $node2->routes[$l]->routeIndex;
							}
							
							if (!isset($node1->routes[$k]->nextConnected)
								&& $node1->routes[$k]->routeIndex < $node2->routes[$l]->routeIndex
								&& (!isset($foundNextTerminus)
								|| ($node2->routes[$l]->routeIndex < $foundNextTerminus->routeIndex)))
							{
								$foundNextTerminus = &$node2->routes[$l];
								$foundNextNodeIndex = $j;
								$foundNextRouteIndex = $node2->routes[$l]->routeIndex;
							}
						}
					}
				}
				
				// Add the edge that precedes this node.
				
				$edge = (object)[];
				
				if (!isset($node1->routes[$k]->prevConnected))
				{
					$edge->type = $node1->routes[$k]->type;
					$edge->cn = $node1->routes[$k]->cn;
					$edge->route = $node1->routes[$k]->index;
					
					$edge->next = (object)[];
					$edge->next->nodeIndex = $i;
					$edge->next->routeIndex = $node1->routes[$k]->routeIndex;
					
					if (!isset ($node1->edges))
					{
						$node1->edges = [];
					}
					
					$node1->routes[$k]->prevConnected = true;
					
					$edge->prev = (object)[];
					
					if (isset($foundPrevTerminus))
					{
						$edge->prev->nodeIndex = $foundPrevNodeIndex;
						$edge->prev->routeIndex = $foundPrevRouteIndex;
						
						if ($debug)
						{
							error_log ("Prev Edge: " . json_encode($edge));
						}
						
						array_push($edges, $edge);
						
						array_push ($node1->edges, count($edges) - 1);
		
						if (!isset ($allIntersections[$foundPrevNodeIndex]->edges))
						{
							$allIntersections[$foundPrevNodeIndex]->edges = [];
						}
						
						array_push ($allIntersections[$foundPrevNodeIndex]->edges, count($edges) - 1);
						
						$foundPrevTerminus->nextConnected = true;
						
						if ($debug)
						{
							error_log ("*** found 'prev' edge ***\n" . var_dump_ret($node1->routes[$k]) . "\n" . var_dump_ret($foundPrevTerminus));
						}
					}
					else
					{
						if ($edge->next->routeIndex != 0)
						{
							$edge->prev->routeIndex = 0;
						
							if ($debug)
							{
								error_log ("Prev Edge: " . json_encode($edge));
							}
							
							array_push($edges, $edge);
							
							array_push ($node1->edges, count($edges) - 1);
						}
					}
				}
				
				// Add the edge that follows this node
				if (!isset($node1->routes[$k]->nextConnected))
				{
					$edge = (object)[];
					
					$edge->type = $node1->routes[$k]->type;
					$edge->cn = $node1->routes[$k]->cn;
					$edge->route = $node1->routes[$k]->index;
					
					$edge->prev = (object)[];
					$edge->prev->nodeIndex = $i;
					$edge->prev->routeIndex = $node1->routes[$k]->routeIndex;
					
					if (!isset ($node1->edges))
					{
						$node1->edges = [];
					}
					
					$node1->routes[$k]->nextConnected = true;
					
					$edge->next = (object)[];
					
					if (isset($foundNextTerminus))
					{
						$edge->next->nodeIndex = $foundNextNodeIndex;
						$edge->next->routeIndex = $foundNextRouteIndex;
						
						if ($debug)
						{
							error_log ("Next Edge: " . json_encode($edge));
						}
						
						array_push($edges, $edge);
						
						array_push ($node1->edges, count($edges) - 1);
						
						if (!isset ($allIntersections[$foundNextNodeIndex]->edges))
						{
							$allIntersections[$foundNextNodeIndex]->edges = [];
						}
						
						array_push ($allIntersections[$foundNextNodeIndex]->edges, count($edges) - 1);
						
						$foundNextTerminus->prevConnected = true;
						
						if ($debug)
						{
							error_log ("*** found 'next' edge ***\n" . var_dump_ret($node1->routes[$k]) . "\n" . var_dump_ret($foundNextTerminus));
						}
					}
					else
					{
						if ($edge->prev->routeIndex != $node1->routes[$k]->routeIndexMax)
						{
							$edge->next->routeIndex = $node1->routes[$k]->routeIndexMax;
							
							if ($debug)
							{
								error_log ("Next Edge: " . json_encode($edge));
							}
							
							array_push($edges, $edge);
							
							array_push ($node1->edges, count($edges) - 1);
						}
					}
				}
			}
		}
		
		unset($node1->routes);
	}
}


function parseJSON ($inputFile)
{
	global $allIntersections;
	global $intersectionCount, $overlapCount, $pointCount, $duplicatePointCount, $closeIntersectionCount;
	global $overlappingTrailRectscount;
	global $totalIntersectionsCount;
	global $edges;
	global $connectorCount;
	global $connectors;
	
	$handle = fopen($inputFile, "rb");
	
	if ($handle)
	{
		for (;;)
		{
			$trailStartPos = ftell ($handle);
			
			$jsonString = fgets ($handle);
			
			if (!$jsonString)
			{
				break;
			}
			
			$startPos = ftell($handle);
			
//			error_log ("file position = " . $startPos);
			
			$trail = json_decode($jsonString);
			
			if ($trail->type == "connector")
			{
				$connectorOffset = $trailStartPos;
			}
			else 
			{
				findJunctions ($trail, $handle);
			}
			
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

	findEdges ();
	
	error_log("intersect count = " . $intersectionCount);
	error_log("total intersections = " . $totalIntersectionsCount);
	error_log("intersections stored = " . count($allIntersections));
	error_log("overlapping trail bounds = " . $overlappingTrailRectscount);
	error_log("close intersect count = " . $closeIntersectionCount);
	error_log("overlap count = " . $overlapCount);
	error_log("point count = " . $pointCount);
	error_log("duplicate point count = " . $duplicatePointCount);
	error_log("edge count = " . count($edges));
	error_log("connector count = " . $connectorCount);
	
	$graph = (object)[];
	
	$graph->nodes = array_values ($allIntersections);
	$graph->edges = $edges;
	
	echo json_encode($graph);
	
	if (count($connectors) > 0)
	{
		$handle = fopen($inputFile, "cb");
		
		if ($handle)
		{
			if (isset($connectorOffset))
			{
				fseek ($handle, $connectorOffset);
			}
			else
			{
				fseek ($handle, 0, SEEK_END);
			}
			
			$jsonString = json_encode($connectors) . "\n";
			
			fwrite ($handle, $jsonString);
			fclose ($handle);
		}
	}
}

// $intersection = segmentsIntersection (
// 	(object)["lat" => 40.0, "lng" => 112.0],
// 	(object)["lat" => 60.0, "lng" => 112.0],
// 	(object)["lat" => 50.0, "lng" => 110.0],
// 	(object)["lat" => 50.0, "lng" => 113.0]);

// var_dump ($intersection);

parseJSON ("N405W1095.json.deduped");

?>