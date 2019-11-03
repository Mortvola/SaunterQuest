<?php
namespace App;
require_once "utilities.php";


function findPath ($start, $end, $startRoute = null, $dumpGraph = false)
{
    error_log ('start: ' . json_encode ($start) . ', end: ' . json_encode($end));

    $stream = stream_socket_client("unix:///tmp/routeFind");

    if ($stream !== false)
    {
        $request = (object)[
            "start" => (object)["lat" => $start->lat, "lng" => $start->lng],
            "end" => (object)["lat" => $end->lat, "lng" => $end->lng],
        ];

        fwrite ($stream, json_encode ($request) . "\n");

        $response = stream_get_contents ($stream);

        if ($response !== false)
        {
            $newAnchors = json_decode($response);
        }

        fclose ($stream);
    }

    return $newAnchors;
}
