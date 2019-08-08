<?php

require_once "checkLogin.php";
require_once "calculate.php";


if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];

	$points = getRoutePointsFromUserHike ($userHikeId);

	$day = getSchedule ($userId, $points);

	echo json_encode($day);
}
?>