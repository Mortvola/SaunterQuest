<?php

require_once "checkLogin.php";
require_once "config.php";
require_once "routeFile.php";
require_once "calculate.php";
require_once "pointOfInterestUtils.php";

// $_SERVER["REQUEST_METHOD"] = "GET";
// $_SESSION["userId"] = 1;
// $_GET["id"] = 100051;


$numberOfPoints = 0;
$startDistance = 0;
$minimumDistanceBetweenPoints = 400; // meters
$maxNumberOfPointsPerSegment = 200;

function writeTrackPoint ($xw, $point)
{
	global $numberOfPoints;
	global $startDistance;
	global $minimumDistanceBetweenPoints;
	global $maxNumberOfPointsPerSegment;

	if ($point->dist - $startDistance >= $minimumDistanceBetweenPoints)
	{
		if ($numberOfPoints >= $maxNumberOfPointsPerSegment)
		{
			$xw->endElement (); // trkseg
			$xw->startElement ("trkseg");

			$numberOfPoints = 0;
		}

		$xw->startElement ("trkpt");

		$xw->writeAttribute ("lat", $point->lat);
		$xw->writeAttribute ("lon", $point->lng);

		$xw->endElement (); // trkpt

		$numberOfPoints++;

		$startDistance = $point->dist;
	}
}


function writeWayPoint ($xw, $point, $name)
{
	$xw->startElement ("wpt");

	$xw->writeAttribute ("lat", $point->lat);
	$xw->writeAttribute ("lon", $point->lng);

	$xw->startElement ("name");

	$xw->text ($name);

	$xw->endElement ();

	$xw->endElement (); // trkpt
}


if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];

	$points = getRoutePointsFromUserHike ($userHikeId);

	if (isset ($points))
	{
		$xw = new XMLWriter ();

		$xw->openMemory ();

		$xw->startDocument ("1.0");

		$xw->setIndentString ("  ");
		$xw->setIndent (true);

		$xw->startElement ("gpx");

		$xw->writeAttribute ("xmlns:xsd", "http://www.w3.org/2001/XMLSchema");
		$xw->writeAttribute ("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");

		$days = getSchedule ($userId, $points);

		for ($d = 1; $d < count($days); $d++)
		{
			writeWayPoint ($xw, $days[$d], "Day " . $d . " camp");
		}

		$pointsOfInterest = getPointsOfInterest ($userHikeId);

		foreach ($pointsOfInterest as $poi)
		{
			writeWayPoint ($xw, $poi, $poi->name);
		}

		$xw->startElement ("trk");

		$xw->startElement ("trkseg");

		$startDistance = $points[0]->dist - $minimumDistanceBetweenPoints;

		foreach ($points as $p)
		{
			writeTrackPoint ($xw, $p);
		}

		$xw->endElement (); // trkseg

		$xw->endElement (); // trk

		$xw->endElement (); // gpx

		$xw->endDocument ();

		echo $xw->outputMemory ();
	}
}

?>