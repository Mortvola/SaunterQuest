<?php

require_once "coordinates.php";

$coordString = file_get_contents("SouthForkToPackardCanyon.txt");

$coords = explode(",", $coordString);

$first = true;

$points = [];

foreach ($coords as $coord)
{
	$components = explode(" ", $coord);

	$lat = $components[1];
	$lng = $components[0];

	array_push($points, (object)["lat" => floatval($lat), "lng" => floatval($lng)]);
}

echo json_encode($points), "\n";
	
?>
