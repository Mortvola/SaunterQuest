<?php

require_once "coordinates.php";
require_once "routeFile.php";
require_once "utilities.php";

$handle = null;


function dump_node ($nodeIndex, $graph)
{
	if (isset($nodeIndex))
	{
		error_log ("---------------");
		error_log ("Node Index: " . $nodeIndex);
		
		$node = &$graph->nodes[$nodeIndex];
		
		error_log ("Number of edges: " . count($node->edges));
		
		for ($i = 0; $i < count($node->edges); $i++)
		{
			$edge = &$graph->edges[$node->edges[$i]];
			
			if (!isset($edge->prev->nodeIndex))
			{
				error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . isset($edge->visited));
			}
			else if ($edge->prev->nodeIndex != $nodeIndex)
			{
				error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->prev->nodeIndex . ". " . isset($edge->visited));
			}
			
			if (!isset($edge->next->nodeIndex))
			{
				error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to no node. " . isset($edge->visited));
			}
			else if ($edge->next->nodeIndex != $nodeIndex)
			{
				error_log ("edge index: " . $node->edges[$i] . ", route " . $edge->cn . " to " . $edge->next->nodeIndex . ". " . isset($edge->visited));
			}
			
			if (!isset($edge->next->nodeIndex) && !isset($edge->prev->nodeIndex))
			{
				error_log ("edge index: " . $node->edges[$i] . ", no route" );
			}
		}
		error_log ("---------------");
	}
}


function dumpGraph ($graph)
{
	$handle = fopen ("graph.dot", "wb");
	
	if ($handle)
	{
		$deadEndCount = 0;
		
		fwrite ($handle, "graph G {\n");
		
// 		for ($i = 0; $i < count($graph->nodes); $i++)
// 		{
// 			$node = $graph->nodes[$i];
			
// 			fwrite ($handle, "n" . $i . " [ pos = \"" . $node->lng * 400 . "," . $node->lat * 400 . "!\" ];\n");
// 		}
		
		for ($i = 0; $i < count($graph->edges); $i++)
		{
			$edge = $graph->edges[$i];
			
			if ($edge->type == "connector")
			{
				$color = ",color=red";
			}
			else
			{
				$color = "";
			}
			
			$label = "label = " . $edge->cn;
			
			if (isset($edge->prev->nodeIndex) && isset($edge->next->nodeIndex))
			{
				fwrite ($handle, "n" . $edge->prev->nodeIndex . " -- n" . $edge->next->nodeIndex . " [ " . $label . $color . "];\n");
			}
			else if (isset($edge->prev->nodeIndex))
			{
				$deadEndCount++;
				fwrite ($handle, "n" . $edge->prev->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $color . "];\n");
			}
			else if (isset($edge->next->nodeIndex))
			{
				$deadEndCount++;
				fwrite ($handle, "n" . $edge->next->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $color . "];\n");
			}
		}
		
		fwrite ($handle, "}\n");
		
		fclose ($handle);
	}
	
}


function addNewSegment (&$newSegments, $segment)
{
	if ($segment->lat != $newSegments[0]->lat || $segment->lng != $newSegments[0]->lng
			|| $segment->trailName != $newSegments[0]->trailName)
	{
		if (count($newSegments) > 1
			&& $segment->trailName == $newSegments[0]->trailName
			&& $newSegments[0]->trailName == $newSegments[1]->trailName
			&& (($segment->routeIndex > $newSegments[0]->routeIndex && $newSegments[0]->routeIndex > $newSegments[1]->routeIndex)
				|| ($segment->routeIndex < $newSegments[0]->routeIndex && $newSegments[0]->routeIndex < $newSegments[1]->routeIndex)))
		{
			$newSegments[0] = $segment;
		}
		else
		{
			array_splice ($newSegments, 0, 0, array($segment));
		}
	}
}


function findPath ($start, $end)
{
	global $handle;
	
	$trailName = "";
	$startTrailIndex = -1;
	
	findTrail ($start, $trailName, $startTrailIndex, $startRoute, $startRouteIndex);
	
	$start->trailName = $trailName;
	
	error_log(json_encode($start));
	
// 	var_dump ($trailName);
// 	var_dump ($startTrailIndex);
// 	var_dump ($startRouteIndex);
	
	$startCN = explode(":", $trailName)[1];
	
	findTrail ($end, $trailName, $endTrailIndex, $endRoute, $endRouteIndex);
	
	$end->trailName = $trailName;

	error_log(json_encode($end));
	
// 	var_dump ($trailName);
// 	var_dump ($endTrailIndex);
// 	var_dump ($endRouteIndex);
	
	$endCN = explode(":", $trailName)[1];

	$graph = json_decode(file_get_contents("trails/N405W1095.inter.json"));
	
	if ($handle) dumpGraph ($graph);
	
	if ($handle) fwrite ($handle, "digraph G {\n");
	
	$nodes = [];
	
	// Find the edge we are starting on and push its connected nodes onto the queue.
	for ($i = 0; $i < count($graph->edges); $i++)
	{
		$edge = &$graph->edges[$i];
		
		if ($edge->cn == $startCN
		 && ($edge->prev->routeIndex < $startRouteIndex)
		 && ($edge->next->routeIndex > $startRouteIndex))
		{
			if ($edge->cn == $endCN
					&& ($edge->prev->routeIndex < $endRouteIndex)
					&& ($edge->next->routeIndex > $endRouteIndex))
			{
				if ($startRouteIndex > $endRouteIndex)
				{
					if (isset ($edge->next->nodeIndex))
					{
						$graph->nodes[$edge->next->nodeIndex]->bestEdge = $i;
						$graph->nodes[$edge->next->nodeIndex]->cost = 0;
						array_push ($nodes, $edge->next->nodeIndex);
					
						if ($handle) fwrite ($handle, "S -> " . $edge->next->nodeIndex . ";\n");
					
						dump_node($edge->next->nodeIndex, $graph);
					}
				}
				else if ($startRouteIndex < $endRouteIndex)
				{
					if (isset ($edge->prev->nodeIndex))
					{
						$graph->nodes[$edge->prev->nodeIndex]->bestEdge = $i;
						$graph->nodes[$edge->prev->nodeIndex]->cost = 0;
						array_push ($nodes, $edge->prev->nodeIndex);
						
						if ($handle) fwrite ($handle, "S -> " . $edge->prev->nodeIndex . ";\n");
						
						dump_node($edge->prev->nodeIndex, $graph);
					}
				}
				
				$noNodeSegments = [];
				
				$start->routeIndex = $startRouteIndex;
				$end->routeIndex = $endRouteIndex;
				
				array_push ($noNodeSegments, $start);
				array_push ($noNodeSegments, $end);
			}
			else if (isset($edge->prev->nodeIndex))
			{
				$graph->nodes[$edge->prev->nodeIndex]->bestEdge = $i;
				$graph->nodes[$edge->prev->nodeIndex]->cost = 0;
				array_push ($nodes, $edge->prev->nodeIndex);
				
				if ($handle) fwrite ($handle, "S -> " . $edge->prev->nodeIndex . ";\n");

				dump_node($edge->prev->nodeIndex, $graph);
			}
			
			if (isset($edge->next->nodeIndex))
			{
				$graph->nodes[$edge->next->nodeIndex]->bestEdge = $i;
				$graph->nodes[$edge->next->nodeIndex]->cost = 0;
				array_push ($nodes, $edge->next->nodeIndex);

				if ($handle) fwrite ($handle, "S -> " . $edge->next->nodeIndex . ";\n");
				
				dump_node($edge->next->nodeIndex, $graph);
			}
			
			$edge->visited = true;
			
			break;
		}
	}
	
	//todo: get cost of trail to first nodes
	
	$foundEnd = false;
	
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
			$edge = &$graph->edges[$edgeIndex];
			
			error_log ("edge index: " . $edgeIndex . ", edge CN: " . $edge->cn);
			
			if (!isset($edge->visited))
			{
				var_dump ($endCN);
				var_dump ($edge);
				
				if ($edge->cn == $endCN
					&& ($endRouteIndex >= $edge->prev->routeIndex && $endRouteIndex <= $edge->next->routeIndex))
				{
					error_log("Found end. Last edge ". $edgeIndex);
					error_log(var_dump_ret ($edge));
					$foundEnd = true;
					var_dump ($nodes);
					$nodes = [];
					break;
				}
				else
				{
					//todo: get cost from edge
					$cost = 1;
					
					if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex != $nodeIndex)
					{
						$graph->nodes[$edge->prev->nodeIndex]->bestEdge = $edgeIndex;
						$graph->nodes[$edge->prev->nodeIndex]->cost = $graph->nodes[$nodeIndex]->cost + $cost;
						array_push($nodes, $edge->prev->nodeIndex);
						
						if ($handle) fwrite ($handle, $nodeIndex . " -> " . $edge->prev->nodeIndex . ";\n");
					}
					else if (isset($edge->next->nodeIndex) && $edge->next->nodeIndex != $nodeIndex)
					{
						$graph->nodes[$edge->next->nodeIndex]->bestEdge = $edgeIndex;
						$graph->nodes[$edge->next->nodeIndex]->cost = $graph->nodes[$nodeIndex]->cost + $cost;
						array_push($nodes, $edge->next->nodeIndex);
						
						if ($handle) fwrite ($handle, $nodeIndex . " -> " . $edge->next->nodeIndex . ";\n");
					}
					
					$edge->visited = true;
					
					// For now, until we get an edge cost, use the last edge traversed
					// as the best edge.
//					$node->bestEdge = $edgeIndex;
				}
			}
		}
	}
	
	if ($handle)
	{
		if (isset($nodeIndex)) fwrite ($handle, $nodeIndex . " -> E;\n");
		
		fwrite ($handle, "edge [color=red]\n");
	}
	//
	
	$newSegments = [];
	
	if ($foundEnd)
	{
		$end->routeIndex = $endRouteIndex;
		
		error_log ("******** find path backwards ******");
		
		error_log (json_encode($end));
		array_push ($newSegments, $end);
		if ($handle && isset($nodeIndex)) fwrite ($handle, $nodeIndex . " -> E;\n");
		
		$trailName = $end->trailName;
		
		while (isset($nodeIndex))
		{
			$node = &$graph->nodes[$nodeIndex];
	
			$segment = (object)[];
			
			$segment->lat = $node->lat;
			$segment->lng = $node->lng;
			
			$segment->trailName = $trailName;
	
			if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex == $nodeIndex)
			{
				$segment->routeIndex = $edge->prev->routeIndex;
			}
			else if (isset($edge->next->nodeIndex) && $edge->next->nodeIndex == $nodeIndex)
			{
				$segment->routeIndex = $edge->next->routeIndex;
			}
			
			error_log ("node index: " . $nodeIndex);
			error_log(json_encode($segment));
			//array_push ($newSegments, $segment);
			
			addNewSegment ($newSegments, $segment);
			
			$segment = (object)[];
			
			$segment->lat = $node->lat;
			$segment->lng = $node->lng;
			
			if (isset($node->bestEdge))
			{
				$edge = &$graph->edges[$node->bestEdge];
				
				$trailName = $edge->type . ":" . $edge->cn . ":" . $edge->route;
				
				$segment->trailName = $trailName;
				
				if ($edge->cn == $startCN
					&& ($startRouteIndex >= $edge->prev->routeIndex && $startRouteIndex <= $edge->next->routeIndex))
				{
					unset($nodeIndex);
				}
				else
				{
					if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex == $nodeIndex)
					{
						$segment->routeIndex = $edge->prev->routeIndex;
					}
					else if (isset($edge->next->nodeIndex) && $edge->next->nodeIndex == $nodeIndex)
					{
						$segment->routeIndex = $edge->next->routeIndex;
					}
					
					// Get the next node index
					if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex != $nodeIndex)
					{
						if ($handle) fwrite ($handle, $edge->prev->nodeIndex . " -> " . $nodeIndex . ";\n");
						
						$nodeIndex = $edge->prev->nodeIndex;
					}
					else if (isset($edge->next->nodeIndex) && $edge->next->nodeIndex != $nodeIndex)
					{
						if ($handle) fwrite ($handle, $edge->next->nodeIndex . " -> " . $nodeIndex . ";\n");
		
						$nodeIndex = $edge->next->nodeIndex;
					}
					else
					{
						unset($nodeIndex);
					}
				}
			}
			else
			{
				unset ($nodeIndex);
			}
		
			error_log(json_encode($segment));
	//		array_push ($newSegments, $segment);
	
			addNewSegment ($newSegments, $segment);
		}
		
	//	error_log (json_encode($start));
		$start->routeIndex = $startRouteIndex;
		
		error_log (json_encode($start));
		//array_push ($newSegments, $start);
		
		addNewSegment ($newSegments, $start);
		
	//	error_log(json_encode($newSegments));
	}
	else if (isset($noNodeSegments))
	{
		$newSegments = $noNodeSegments;
	}

	if ($handle)
	{
		fwrite ($handle, "}\n");
		fclose ($handle);
	}
	
	return $newSegments;
}

function test ($fileName)
{
	global $handle;
	
	if ($fileName)
	{
		$handle = fopen ("paths.dot", "wb");
		
		// Read the data from the file.
		$segments = readAndSanitizeFile ($fileName);
		
		for ($i = 0; $i < count ($segments); $i++)
		{
			if (isset($segments[$i]->type))
			{
				if ($segments[$i]->type == "end")
				{
					$endIndex = $i;
				}
				else if ($segments[$i]->type == "start")
				{
					$startIndex = $i;
				}
			}
		}
		
		
		$segments = findPath ($segments[$startIndex], $segments[$endIndex]);
		
		error_log(json_encode($segments)); 
	}
}

if ($argv[1])
{
	test ($argv[1]);
}

?>