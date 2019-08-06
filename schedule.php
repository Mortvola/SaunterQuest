<?php

$commandLine = 1;

if ($commandLine == 0)
{
	require_once "checkLogin.php";
}
else
{
	$_SERVER["REQUEST_METHOD"] = "GET";
	$_SESSION["userId"] = 1;
	$_GET["id"] = 100051;
}

require_once "calculate.php";


// Main routine
if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	global $userId, $userHikeId;

	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];

	$points = getRoutePointsFromUserHike ($userHikeId);

	$day = getSchedule ($userId, $points);

	$jsonHikeData = json_encode($day);

//	userHikeDataStore ($jsonHikeData);

	echo $jsonHikeData;
}
?>