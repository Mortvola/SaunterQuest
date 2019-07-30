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

			if (isset ($edge->file))
			{
				error_log ("edge index: " . $node->edges[$i] . ", route to file " . $edge->file . ". " . isset($edge->visited));
			}
			else
			{
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
		}
		error_log ("---------------");
	}
}


function addNewAnchor (&$newSegments, $segment)
{
	if ($segment->lat != $newSegments[0]->lat || $segment->lng != $newSegments[0]->lng)
	{
		if (count($newSegments) >= 1 && isset($segment->next->file))
		{
			// Push the anchor onto the front of the array
			array_splice ($newSegments, 0, 0, array($segment));
		}
		else
		{
			if (count($newSegments) >= 1
					&& $segment->next->trailName != $newSegments[0]->prev->trailName)
			{
				error_log ("next and previous trails don't match: next: " . $segment->next->trailName . ", prev: " . $newSegments[0]->prev->trailName);
				error_log (json_encode ($segment));
			}

			// Determine if we should replace the previously pushed anchor
			// or add a new one. If the anchor at position 0 is between
			// the new one and the one at position 1, then we can just replace
			// the one at position 0.
			if (count($newSegments) > 1 && !isset($newSegments[0]->next->file)
				&& $segment->next->trailName == $newSegments[0]->prev->trailName
					&& $segment->next->trailName == $newSegments[1]->prev->trailName
				&& (($segment->next->routeIndex > $newSegments[0]->prev->routeIndex && $newSegments[0]->next->routeIndex > $newSegments[1]->prev->routeIndex)
					|| ($segment->next->routeIndex < $newSegments[0]->prev->routeIndex && $newSegments[0]->next->routeIndex < $newSegments[1]->prev->routeIndex)))
			{
				error_log ("Replacing " . json_encode ($newSegments[0]));
				error_log ("with " . json_encode ($segment));

				$newSegments[0] = $segment;
			}
			else
			{
				// Push the anchor onto the front of the array
				array_splice ($newSegments, 0, 0, array($segment));
			}
		}
	}
}


function translateFileName ($fileName)
{
	$fileName = explode (":", $fileName)[0];

	$parts = explode (".", $fileName);

	return $parts[0] . ".inter.json";
}


$fileGraphMap = [];
$endCN = [];
$endRoute = [];
$endRouteIndex = [];

function getGraph ($fileName)
{
	global $fileGraphMap;

	if (!array_key_exists ($fileName, $fileGraphMap))
	{
		$fileGraphMap[$fileName] = json_decode(file_get_contents($fileName));
	}

	return $fileGraphMap[$fileName];
}


function getOtherNodeIndex ($edge, $nodeIndex)
{
	if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex != $nodeIndex)
	{
		return $edge->prev->nodeIndex;
	}
	else if (isset($edge->next->nodeIndex) && $edge->next->nodeIndex != $nodeIndex)
	{
		return $edge->next->nodeIndex;
	}
	else
	{
		error_log ("no matching previous or next");
	}
}


function pushNode ($edgeIndex, $fromNodeIndex, &$graph, $graphFile, &$nodes, &$foundEnd)
{
	global $endCN, $endRoute, $endRouteIndex, $endGraphFile;
	global $handle;

	$node = &$graph->nodes[$fromNodeIndex];
	$edge = &$graph->edges[$edgeIndex];

	if (!isset ($edge))
	{
		error_log ("edge index: " . $edgeIndex);
		error_log ("number of edges: " . count ($graph->edges));
	}

	if (isset($edge->file))
	{
		error_log ("edge with file found: " . $edge->file);

		$nextNodeIndex = $edge->nodeIndex;

		$nextNode = &$graph->nodes[$nextNodeIndex];

		$nextNode->bestEdge = $edgeIndex;

		array_push($nodes, (object)["index" => $nextNodeIndex, "file" => $graphFile]);
	}
	else
	{
		error_log ("End graph file: " . $endGraphFile . ", curent file: " . $graphFile);

		if ($graphFile == $endGraphFile
			&& $edge->cn == $endCN && $edge->route == $endRoute
			&& ($endRouteIndex >= $edge->prev->routeIndex && $endRouteIndex <= $edge->next->routeIndex))
		{
			error_log("Found end. Last edge ". $edgeIndex);
			error_log(var_dump_ret ($edge));
			$foundEnd = true;
		}
		else
		{
//			if ($edge->cn == "5059.002691")
//			{
//				$cost = $node->cost;
//			}
//			else
			{
				$cost = $node->cost + $edge->cost;
			}

			$nextNodeIndex = getOtherNodeIndex ($edge, $fromNodeIndex);

			if (isset ($nextNodeIndex))
			{
				$nextNode = &$graph->nodes[$nextNodeIndex];

				if (!isset ($nextNode->cost) || $cost < $nextNode->cost)
				{
					$nextNode->bestEdge = $edgeIndex;

					if (!isset($nextNode->cost))
					{
						error_log ("found cheaper path to node");
					}

					$nextNode->cost = $cost;
					array_push($nodes, (object)["index" => $nextNodeIndex, "file" => $graphFile]);

					if ($handle) fwrite ($handle, $fromNodeIndex . " -> " . $nextNodeIndex . ";\n");

					// For now, until we get an edge cost, use the last edge traversed
					// as the best edge.
					//					$node->bestEdge = $edgeIndex;
				}
			}
		}
	}

	$edge->visited = true;
}


function getOtherGraphInfo ($edge, &$otherFile, &$otherGraph, &$otherEdgeIndex, &$otherNodeIndex)
{
	$otherFile = translateFileName($edge->file);

	$otherGraph = getGraph ($otherFile);

	$id = explode (":", $edge->file)[1];

	for ($otherEdgeIndex = 0; $otherEdgeIndex < count($otherGraph->edges); $otherEdgeIndex++)
	{
		$e = $otherGraph->edges[$otherEdgeIndex];

		if (isset ($e->file))
		{
			$parts = explode (":", $e->file);

			error_log ("this id: " . $id . " other id: " . $parts[1]);
			if ($parts[1] == $id)
			{
				$otherNodeIndex = $e->nodeIndex;

				break;
			}
		}
	}

	if (!isset ($otherNodeIndex))
	{
		error_log ("file connector not found: file: " . $otherFile . ", id: " . $id);
	}
}

function sortComparison ($a, $b)
{
	$aGraph = getGraph ($a->file);
	$bGraph = getGraph ($b->file);

	if ($aGraph->nodes[$a->index]->cost < $bGraph->nodes[$b->index]->cost)
	{
		return -1;
	}
	else if ($aGraph->nodes[$a->index]->cost > $bGraph->nodes[$b->index]->cost)
	{
		return 1;
	}

	return 0;
}


function findPath ($start, $end)
{
	global $handle;
	global $endCN, $endRoute, $endRouteIndex, $endGraphFile;

	$trailName = "";
	$startTrailIndex = -1;

	findTrail ($start, $trailName, $startTrailIndex, $startRoute, $startRouteIndex);

	$start->trailName = $trailName;

	error_log(json_encode($start));

	error_log("Start Route Index: " . json_encode($startRouteIndex));
	error_log ("start trailName: " . $trailName);
	error_log ("start trailIndex: " . $startTrailIndex);
	error_log ("start routeIndex: " . $startRouteIndex);

	$parts = explode(":", $trailName);
	$startCN = $parts[1];
	$startRoute = $parts[2];

	error_log ("Start CN/Route: " . $startCN . "/" . $startRoute);

	findTrail ($end, $trailName, $endTrailIndex, $endRoute, $endRouteIndex);

	$end->trailName = $trailName;

	error_log(json_encode($end));
	error_log ("end trailName: " . $trailName);
	error_log ("end trailIndex: " . $endTrailIndex);
	error_log ("end routeIndex: " . $endRouteIndex);
// 	var_dump ($trailName);
// 	var_dump ($endTrailIndex);
// 	var_dump ($endRouteIndex);

	$parts = explode(":", $trailName);
	$endCN = $parts[1];
	$endRoute = $parts[2];

	error_log ("End CN/Route: " . $endCN . "/" . $endRoute);

	$startGraphFile = "trails/" . getTrailFileName ($start->lat, $start->lng, ".inter.json");
	$endGraphFile = "trails/" . getTrailFileName ($end->lat, $end->lng, ".inter.json");

	$graphFile = $startGraphFile;
	$graph = getGraph ($graphFile);

	if ($handle) fwrite ($handle, "digraph G {\n");

	$nodes = [];

	// Find the edge we are starting on and push its connected nodes onto the queue.
	for ($i = 0; $i < count($graph->edges); $i++)
	{
		$edge = &$graph->edges[$i];

		if (!isset($edge->file))
		{
			if ($edge->cn == $startCN && $edge->route == $startRoute)
			{
				error_log ("Start Route Index: " . $startRouteIndex);
				error_log ("Edge start route index: " . $edge->prev->routeIndex);
				error_log ("Edge end route index: " . $edge->next->routeIndex);
			}

			if ($edge->cn == $startCN && $edge->route == $startRoute
			 && ($edge->prev->routeIndex <= $startRouteIndex)
			 && ($edge->next->routeIndex > $startRouteIndex))
			{
				error_log(json_encode($edge));

				// If the end is also on this same edge...
				if ($edge->cn == $endCN && $edge->route == $endRoute
					&& ($edge->prev->routeIndex <= $endRouteIndex)
					&& ($edge->next->routeIndex > $endRouteIndex))
				{
					if ($startRouteIndex > $endRouteIndex)
					{
						if (isset ($edge->next->nodeIndex))
						{
							$graph->nodes[$edge->next->nodeIndex]->bestEdge = $i;
							$graph->nodes[$edge->next->nodeIndex]->cost = 0;
							array_push ($nodes, (object)["index" => $edge->next->nodeIndex, "file" => $graphFile]);

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
							array_push ($nodes, (object)["index" => $edge->prev->nodeIndex, "file" => $graphFile]);

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

				if (isset($edge->prev->nodeIndex))
				{
					$graph->nodes[$edge->prev->nodeIndex]->bestEdge = $i;
					$graph->nodes[$edge->prev->nodeIndex]->cost = 0;
					array_push ($nodes, (object)["index" => $edge->prev->nodeIndex, "file" => $graphFile]);

					if ($handle) fwrite ($handle, "S -> " . $edge->prev->nodeIndex . ";\n");

					dump_node($edge->prev->nodeIndex, $graph);
				}

				if (isset($edge->next->nodeIndex))
				{
					$graph->nodes[$edge->next->nodeIndex]->bestEdge = $i;
					$graph->nodes[$edge->next->nodeIndex]->cost = 0;
					array_push ($nodes, (object)["index" => $edge->next->nodeIndex, "file" => $graphFile]);

					if ($handle) fwrite ($handle, "S -> " . $edge->next->nodeIndex . ";\n");

					dump_node($edge->next->nodeIndex, $graph);
				}

				$edge->visited = true;

				break;
			}
		}
	}

	if (count($nodes) == 0)
	{
		error_log ("**** Start edge and nodes not found!");
	}


	if (isset($noNodeSegments) && count($noNodeSegments) > 0)
	{
		error_log ("No Node Segments: " . json_encode($noNodeSegments));
	}

	//todo: get cost of trail to first nodes

	$foundEnd = false;

	while (count($nodes) > 0)
	{
		// Sort the nodes from lowest cost to highest cost
		usort ($nodes, "sortComparison");

		error_log ("current node queue:");
		var_dump ($nodes);

		// Pop off a node from the queue
		$nodeIndex = $nodes[0]->index;
		$graphFile = $nodes[0]->file;

		$graph = getGraph ($graphFile);

		dump_node($nodeIndex, $graph);

		array_splice($nodes, 0, 1);

		error_log ("current node:" . $nodeIndex);

		$node = &$graph->nodes[$nodeIndex];

		error_log ("node: " . json_encode ($node));
		error_log ("Best edge: " . $node->bestEdge);

		// For each edge connected to this node...
		foreach ($node->edges as $edgeIndex)
		{
			$edge = &$graph->edges[$edgeIndex];

			if (isset($edge->file))
			{
				error_log ("edge index: " . $edgeIndex . ", edge file: " . $edge->file);
			}
			else
			{
				error_log ("edge index: " . $edgeIndex . ", edge CN: " . $edge->cn);
			}

			if (!isset($edge->visited))
			{
				var_dump ($endCN);
				var_dump ($edge);

				if (isset($edge->file))
				{
					// Find edge that has matching "file" connection identifier and get the node index

					getOtherGraphInfo ($edge, $otherFile, $otherGraph, $otherEdgeIndex, $otherNodeIndex);

					if (isset ($otherNodeIndex))
					{
						if ($otherNodeIndex >= count($otherGraph->nodes))
						{
							error_log ("other node index exceeds node array");
						}

						$otherNode = $otherGraph->nodes[$otherNodeIndex];
						$otherNode->cost = $node->cost;

						error_log ("edge: " . json_encode ($edge));
						error_log ("Other edge index: " . $otherEdgeIndex);
						error_log ("Other node index: " . $otherNodeIndex);
						error_log ("Other node: " . json_encode($otherNode));

						pushNode ($otherEdgeIndex, $otherNodeIndex, $otherGraph, $otherFile, $nodes, $foundEnd);
					}
					else
					{
						error_log ("corresponding node not found in " . $otherFile);
					}

					$edge->visited = true;
				}
				else
				{
					pushNode ($edgeIndex, $nodeIndex, $graph, $graphFile, $nodes, $foundEnd);
				}
			}

			if ($foundEnd)
			{
				error_log ("End found");
				var_dump ($nodes);
				$nodes = [];
				break;
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
		error_log ("******** find path backwards ******");

		$anchor = (object)[];
		$anchor->lat = $end->lat;
		$anchor->lng = $end->lng;
		$anchor->type = "end";

		$anchor->prev = (object)[];
		$anchor->prev->trailName = $end->trailName;
		$anchor->prev->routeIndex = $endRouteIndex;

		array_push ($newSegments, $anchor);

		if ($handle && isset($nodeIndex)) fwrite ($handle, $nodeIndex . " -> E;\n");

		$trailName = $end->trailName;

		if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex == $nodeIndex)
		{
			$nextRouteIndex = $edge->prev->routeIndex;
		}
		else if (isset($edge->next->nodeIndex) && $edge->next->nodeIndex == $nodeIndex)
		{
			$nextRouteIndex = $edge->next->routeIndex;
		}

		while (isset($nodeIndex))
		{
			$node = &$graph->nodes[$nodeIndex];
			error_log ("node index: " . $nodeIndex);

			if (isset($node->bestEdge))
			{
				$edge = &$graph->edges[$node->bestEdge];

				$anchor = (object)[];

				$anchor->lat = $node->lat;
				$anchor->lng = $node->lng;

				$anchor->next = (object)[];

				$anchor->next->trailName = $trailName;
				$anchor->next->routeIndex = $nextRouteIndex;

				if (isset ($edge->file))
				{
					getOtherGraphInfo ($edge, $otherFile, $otherGraph, $otherEdgeIndex, $otherNodeIndex);

					if (isset ($otherNodeIndex))
					{
						error_log ("other edge: " . json_encode($otherGraph->edges[$otherEdgeIndex]));
						$graphFile = $otherFile;
						$graph = $otherGraph;
						$nodeIndex = $otherNodeIndex;
						$node = $graph->nodes[$nodeIndex];

						$edge = $graph->edges[$node->bestEdge];

						$anchor->next->file = $graph->edges[$otherEdgeIndex]->file;
					}
				}

				$trailName = $edge->type . ":" . $edge->cn . ":" . $edge->route;

				error_log ("trail name: " . $trailName);
				error_log ("edge: " . json_encode($edge));
				error_log ("node index : " . $nodeIndex);

				$anchor->prev = (object)[];

				$anchor->prev->trailName = $trailName;

				if (isset($edge->prev->nodeIndex) && $edge->prev->nodeIndex == $nodeIndex)
				{
					if ($handle) fwrite ($handle, $edge->next->nodeIndex . " -> " . $nodeIndex . ";\n");

					$anchor->prev->routeIndex = $edge->prev->routeIndex;
					$nodeIndex = $edge->next->nodeIndex;
					$nextRouteIndex = $edge->next->routeIndex;
				}
				else if (isset($edge->next->nodeIndex) && $edge->next->nodeIndex == $nodeIndex)
				{
					if ($handle) fwrite ($handle, $edge->prev->nodeIndex . " -> " . $nodeIndex . ";\n");

					$anchor->prev->routeIndex = $edge->next->routeIndex;
					$nodeIndex = $edge->prev->nodeIndex;
					$nextRouteIndex = $edge->prev->routeIndex;
				}
				else
				{
					error_log ("**** no previous or next ****");

					unset ($nodeIndex);
				}

				error_log ("startGraphFile: " . $startGraphFile . ", startCN: " . $startCN . ", startRoute: " . $startRoute);
				error_log ("graphFile: " . $graphFile . ", edge CN: " . $edge->cn . ", edge route: " . $edge->route);

				// Are we back at the start? If so, unset the node index so that we can exit the loop.
				if ($graphFile == $startGraphFile
					&& $edge->cn == $startCN && $edge->route == $startRoute
					&& ($startRouteIndex >= $edge->prev->routeIndex && $startRouteIndex <= $edge->next->routeIndex))
				{
					error_log ("Found start: startRoute: " . $startRoute);
					unset($nodeIndex);
				}
			}
			else
			{
				error_log ("**** no best edge ****");

				unset ($nodeIndex);
			}

			error_log(json_encode($anchor));

			addNewAnchor ($newSegments, $anchor);
		}

		$anchor = (object)[];
		$anchor->lat = $start->lat;
		$anchor->lng = $start->lng;
		$anchor->type = "start";

		$anchor->next = (object)[];
		$anchor->next->trailName = $start->trailName;
		$anchor->next->routeIndex = $startRouteIndex;

		addNewAnchor ($newSegments, $anchor);

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
	global $fileGraphMap;

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

		error_log("Final route: " . json_encode($segments));

		foreach ($fileGraphMap as $file => $graph)
		{
			error_log ($file);
		}
	}
}

if ($argv[1])
{
	test ($argv[1]);
}

?>