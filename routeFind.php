<?php

require_once "coordinates.php";
require_once "routeFile.php";
require_once "utilities.php";


function dump_node ($nodeIndex, $graph)
{
	error_log ("---------------");
	error_log ("Node Index: " . $nodeIndex);
	
	$node = &$graph->nodes[$nodeIndex];
	
	error_log ("Number of edges: " . count($node->edges));
	
	for ($i = 0; $i < count($node->edges); $i++)
	{
		$edge = &$graph->edges[$node->edges[$i]];
		
		if (!isset($edge->prev))
		{
			error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node");
		}
		else if ($edge->prev->nodeIndex != $nodeIndex)
		{
			error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->prev->nodeIndex);
		}
		
		if (!isset($edge->next))
		{
			error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node");
		}
		else if ($edge->next->nodeIndex != $nodeIndex)
		{
			error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->next->nodeIndex);
		}
		
		if (!isset($edge->next) && !isset($edge->prev))
		{
			error_log ("edge index: " . $node->edges[$i] . ", no route" );
		}
	}
	error_log ("---------------");
}


function findPath ($start, $end)
{
	$trailName = "";
	$startTrailIndex = -1;
	
	findTrail ($start, $trailName, $startTrailIndex, $startRoute, $startRouteIndex);
	
	$start->trailName = $trailName;
	
	error_log(json_encode($start));
	
	var_dump ($trailName);
	var_dump ($startTrailIndex);
	var_dump ($startRouteIndex);
	
	$startCN = explode(":", $trailName)[1];
	
	findTrail ($end, $trailName, $endTrailIndex, $endRoute, $endRouteIndex);
	
	$end->trailName = $trailName;
	var_dump ($trailName);
	var_dump ($endTrailIndex);
	var_dump ($endRouteIndex);
	
	$endCN = explode(":", $trailName)[1];

	$graph = json_decode(file_get_contents("trails/N405W1095.inter.json"));
	
	$nodes = [];
	
	// Find the edge we are starting on and push its connected nodes onto the queue.
	for ($i = 0; $i < count($graph->edges); $i++)
	{
		$edge = &$graph->edges[$i];
		
		if ($edge->cn == $startCN)
		{
			if ((!isset($edge->prev) || $edge->prev->routeIndex < $startRouteIndex)
			 && (!isset($edge->next) || $edge->next->routeIndex > $startRouteIndex))
			{
				if (isset($edge->prev))
				{
					$graph->nodes[$edge->prev->nodeIndex]->bestEdge = $i;
					$graph->nodes[$edge->prev->nodeIndex]->cost = 0;
					array_push ($nodes, $edge->prev->nodeIndex);

					dump_node($edge->prev->nodeIndex, $graph);
				}
				
				if (isset($edge->next))
				{
					$graph->nodes[$edge->next->nodeIndex]->bestEdge = $i;
					$graph->nodes[$edge->next->nodeIndex]->cost = 0;
					array_push ($nodes, $edge->next->nodeIndex);
					
					dump_node($edge->next->nodeIndex, $graph);
				}
				
				$edge->visited = true;
				
				break;
			}
		}
	}
	
	//todo: get cost of trail to first nodes
	
	while (count($nodes) > 0)
	{
		error_log ("current node queue:");
		var_dump ($nodes);
		
		// Pop off a node from the queue
		$nodeIndex = $nodes[0];
		
		dump_node($nodeIndex, $graph);
		
		array_splice($nodes, 0, 1);
		
		error_log ("current node:");
		var_dump ($nodeIndex);
		
		$node = &$graph->nodes[$nodeIndex];
		
		error_log ("Best edge:");
		var_dump ($node->bestEdge);
		
		// For each edge connected to this node...
		foreach ($node->edges as $edgeIndex)
		{
			error_log ("edge index: " . $edgeIndex);
			
			$edge = &$graph->edges[$edgeIndex];
			
			if (!isset($edge->visited))
			{
				if ($edge->cn == $endCN
					&& (!isset($edge->prev) || $edge->prev->routeIndex > $endRouteIndex)
					&& (!isset($edge->next) || $edge->next->routeIndex < $endRouteIndex))
				{
					error_log("Found end. Last edge ". $edgeIndex);
					error_log(var_dump_ret ($edge));
					$nodes = [];
					break;
				}
				else
				{
					//todo: get cost from edge
					$cost = 1;
					
					if (isset($edge->prev) && $edge->prev->nodeIndex != $nodeIndex)
					{
						$graph->nodes[$edge->prev->nodeIndex]->bestEdge = $edgeIndex;
						$graph->nodes[$edge->prev->nodeIndex]->cost = $graph->nodes[$nodeIndex]->cost + $cost;
						array_push($nodes, $edge->prev->nodeIndex);
					}
					else if (isset($edge->next) && $edge->next->nodeIndex != $nodeIndex)
					{
						$graph->nodes[$edge->next->nodeIndex]->bestEdge = $edgeIndex;
						$graph->nodes[$edge->next->nodeIndex]->cost = $graph->nodes[$nodeIndex]->cost + $cost;
						array_push($nodes, $edge->next->nodeIndex);
					}
					
					$edge->visited = true;
					
					// For now, until we get an edge cost, use the last edge traversed
					// as the best edge.
//					$node->bestEdge = $edgeIndex;
				}
			}
		}
	}
	
	//
	
	$newSegments = [];
	
	$end->routeIndex = $endRouteIndex;
	
	error_log (json_encode($end));
	array_push ($newSegments, $end);
	
	$trailName = $end->trailName;
	
	while (isset($nodeIndex))
	{
		$node = &$graph->nodes[$nodeIndex];

		$segment = (object)[];
		
		$segment->lat = $node->lat;
		$segment->lng = $node->lng;
		
		$segment->trailName = $trailName;

		if (isset($edge->prev) && $edge->prev->nodeIndex == $nodeIndex)
		{
			$segment->routeIndex = $edge->prev->routeIndex;
		}
		else if (isset($edge->next) && $edge->next->nodeIndex == $nodeIndex)
		{
			$segment->routeIndex = $edge->next->routeIndex;
		}
		
		error_log(json_encode($segment));
		//array_push ($newSegments, $segment);
		array_splice ($newSegments, 0, 0, array($segment));
		
		$segment = (object)[];
		
		$segment->lat = $node->lat;
		$segment->lng = $node->lng;
		
		if (isset($node->bestEdge))
		{
			$edge = &$graph->edges[$node->bestEdge];
			
			$trailName = $edge->type . ":" . $edge->cn . ":" . $edge->route;
			
			$segment->trailName = $trailName;
			
			if (isset($edge->prev) && $edge->prev->nodeIndex == $nodeIndex)
			{
				$segment->routeIndex = $edge->prev->routeIndex;
			}
			else if (isset($edge->next) && $edge->next->nodeIndex == $nodeIndex)
			{
				$segment->routeIndex = $edge->next->routeIndex;
			}
			
			// Get the next node index
			if (isset($edge->prev) && $edge->prev->nodeIndex != $nodeIndex)
			{
				$nodeIndex = $edge->prev->nodeIndex;
			}
			else if (isset($edge->next) && $edge->next->nodeIndex != $nodeIndex)
			{
				$nodeIndex = $edge->next->nodeIndex;
			}
			else
			{
				unset($nodeIndex);
			}
		}
		else
		{
			unset ($nodeIndex);
		}
	
		error_log(json_encode($segment));
//		array_push ($newSegments, $segment);
		array_splice ($newSegments, 0, 0, array($segment));
	}
	
//	error_log (json_encode($start));
	$start->routeIndex = $startRouteIndex;
	
	error_log (json_encode($start));
	//array_push ($newSegments, $start);
	array_splice ($newSegments, 0, 0, array($start));
	
	error_log(json_encode($newSegments));
	
//	error_log(json_encode(array_reverse ($newSegments))); 
}


//$fileName = "/var/www/html/data/100047";

if ($argv[1])
{
	// Read the data from the file.
	$segments = readAndSanitizeFile ($argv[1]);
	
//	error_log (json_encode($segments));
	
	// Find the start by checking for "start" type at the beginning and at the end of the segments
	if (isset($segments[0]->type))
	{
		if ($segments[0]->type == "start")
		{
			$start = &$segments[0];
		}
		else if ($segments[0]->type == "end")
		{
			$segments = array_reverse($segments);
			$start = &$segments[0];
		}
	}
	
	// If "start" or "end" was not found at the beginning of the array, check the end of the array.
	if (!isset($start) && isset($segments[count($segments) - 1]->type))
	{
		if ($segments[count($segments) - 1]->type == "start")
		{
			$segments = array_reverse($segments);
			$start = &$segments[0];
		}
		else if ($segments[count($segments) - 1]->type == "end")
		{
			$start = &$segments[0];
		}
	}
	
	// If "start" or "end" were not found at either end of the array, assume the start is at the beginning of the array
	if (!isset($start))
	{
		$start = &$segments[0];
	}
	
	// Now loop until the next anchor or until the end of the array is reached.
	
	findPath ($start, $segments[1]);
}

?>