<?php 
require_once "checkLogin.php";
require_once "config.php";
require_once "coordinates.php";

if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$trails = [];
	
 	array_push($trails, json_decode(file_get_contents("CentralGWT.trail")));
 	array_push($trails, json_decode(file_get_contents("TieForkGWT.trail")));
 	array_push($trails, json_decode(file_get_contents("StrawberryRidgeGWT.trail")));
 	array_push($trails, json_decode(file_get_contents("SouthForkToPackardCanyon.trail")));
 	
	echo json_encode($trails);
}
else if ($_SERVER["REQUEST_METHOD"] == "PUT")
{
}
?>