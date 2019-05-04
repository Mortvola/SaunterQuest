<?php 
require_once "checkLogin.php";
$lat = $_GET["lat"];
$lng = $_GET["lng"];

// Determine file name

$latInt = abs(floor($lat));
$lngInt = abs(floor($lng));

if ($lat >= 0)
{
	$latPrefix = "N";

	$row = round(($latInt + 1 - $lat) * 3600);
}
else
{
	$latPrefix = "S";

	$row = round(($latInt - 1 - $lat) * 3600);
}

if ($lng >= 0)
{
	$lngPrefix = "E";

	$col = round(($lng - $lngInt) * 3600);
}
else
{
	$lngPrefix = "W";

	$col = round(($lngInt + $lng) * 3600);
}

$filename = $latPrefix . $latInt . $lngPrefix . $lngInt . ".hgt";

// todo: do a simple lookup for now. Should change this to get a more
// precise measurement by taking an average.

$file = fopen("elevations/". $filename, "rb");

$result = fseek ($file, $row * 3601 * 2 + $col * 2);

$data = fread ($file, 2);

$elevation = unpack ("n", $data);

echo json_encode($elevation[1]);

?>
