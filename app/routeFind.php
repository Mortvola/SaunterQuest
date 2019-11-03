<?php
namespace App;
require_once app_path('utilities.php');

function findPath ($start, $end, $startRoute = null, $dumpGraph = false)
{
    error_log ('start: ' . json_encode ($start) . ', end: ' . json_encode($end));

    $request = (object)[
        "method" => "GET",
        "command" => "/map/route",
        "start" => (object)["lat" => $start->lat, "lng" => $start->lng],
        "end" => (object)["lat" => $end->lat, "lng" => $end->lng],
    ];

    return sendRequest ($request);
}
