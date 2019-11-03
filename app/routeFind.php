<?php
namespace App;


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

        $bytesWritten = fwrite ($stream, json_encode ($request) . "\n");

        if ($bytesWritten > 0)
        {
            $response = stream_get_contents ($stream);

            fclose ($stream);

            if ($response !== false)
            {
                return json_decode($response);
            }
        }
    }
}
