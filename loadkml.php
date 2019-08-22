<?php

require_once "coordinates.php";

$xml = simplexml_load_file("CDT_Google_Earth_2017.kml");

$coordString = $xml->Document->Folder->Placemark->MultiGeometry->LineString->coordinates;

$coords = explode(" ", $coordString);

$first = true;
$totalDist = 0;

$points = [];

foreach ($coords as $coord) {
    $components = explode(",", $coord);

    $lat2 = $components[1];
    $lng2 = $components[0];
    $ele2 = $components[2];

    if ($first) {
        $first = false;
    } else {
        $d = haversineGreatCircleDistance($lat1, $lng1, $lat2, $lng2);
        
        $totalDist += $d * 1.128547862;
    }

    array_push($points, (object)["lat" => floatval($lat2), "lng" => floatval($lng2), "ele" => floatval($ele2), "dist" => $totalDist]);
    
    $lat1 = $lat2;
    $lng1 = $lng2;
    $ele1 = $ele2;
}

echo json_encode($points), "\n";
