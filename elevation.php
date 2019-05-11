<?php 
require_once "checkLogin.php";
$lat = $_GET["lat"];
$lng = $_GET["lng"];

require_once "coordinates.php";

echo json_encode(getElevation ($lat, $lng));

?>
