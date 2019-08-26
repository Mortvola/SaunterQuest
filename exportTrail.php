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
$maximumDistanceBetweenPoints = 400; // meters
$maxNumberOfPointsPerSegment = 200;

function writeTrackPoint($xw, $point)
{
    global $numberOfPoints;
    global $startDistance;
    global $maximumDistanceBetweenPoints;
    global $maxNumberOfPointsPerSegment;
    global $prevPoint;

    if ($point->dist - $startDistance >= $maximumDistanceBetweenPoints) {
        if ($numberOfPoints >= $maxNumberOfPointsPerSegment) {
            // End the current segment and start a new segment
            // Use the last point of the prevous segment as the
            // start of the next segment.
            $xw->endElement(); // trkseg
            $xw->startElement("trkseg");

            if (isset($prevPoint)) {
                $xw->startElement("trkpt");

                $xw->writeAttribute("lat", $prevPoint->lat);
                $xw->writeAttribute("lon", $prevPoint->lng);

                $xw->endElement(); // trkpt

                $numberOfPoints = 1;
            }
        }

        $xw->startElement("trkpt");

        $xw->writeAttribute("lat", $point->lat);
        $xw->writeAttribute("lon", $point->lng);

        $xw->endElement(); // trkpt

        $numberOfPoints++;

        $prevPoint = $point;

        $startDistance = $point->dist;
    }
}


function writeWayPoint($xw, $point, $name)
{
    $xw->startElement("wpt");

    $xw->writeAttribute("lat", $point->lat);
    $xw->writeAttribute("lon", $point->lng);

    $xw->startElement("name");

    $xw->text($name);

    $xw->endElement(); // name

    $xw->endElement(); // wpt
}


if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $userId = $_SESSION["userId"];
    $userHikeId = $_GET["id"];

    if (isset($_GET["segmentMax"])) {
        $maxNumberOfPointsPerSegment = $_GET["segmentMax"];
    }

    if (isset($_GET["maxDistance"])) {
        $maximumDistanceBetweenPoints = $_GET["maxDistance"];
    }

    $points = getRoutePointsFromUserHike($userHikeId);

    if (isset($points)) {
        $xw = new XMLWriter();

        $xw->openMemory();

        $xw->startDocument("1.0");

        $xw->setIndentString("  ");
        $xw->setIndent(true);

        $xw->startElement("gpx");

        $xw->writeAttribute("xmlns:xsd", "http://www.w3.org/2001/XMLSchema");
        $xw->writeAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");

        $days = getSchedule($userId, $userHikeId, $points);

        for ($d = 1; $d < count($days); $d++) {
            writeWayPoint($xw, $days[$d], "Day " . $d . " camp");
        }

        $pointsOfInterest = getPointsOfInterest($userHikeId);

        foreach ($pointsOfInterest as $poi) {
            writeWayPoint($xw, $poi, $poi->name);
        }

        $xw->startElement("trk");

        $xw->startElement("trkseg");

        $startDistance = $points[0]->dist - $maximumDistanceBetweenPoints;

        foreach ($points as $p) {
            writeTrackPoint($xw, $p);
        }

        $xw->endElement(); // trkseg

        $xw->endElement(); // trk

        $xw->endElement(); // gpx

        $xw->endDocument();

        echo $xw->outputMemory();
    }
}
