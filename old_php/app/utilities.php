<?php

function var_dump_ret($mixed = null)
{
    ob_start();
    var_dump($mixed);
    $content = ob_get_contents();
    ob_end_clean();
    return $content;
}

function getFileBaseName($fileName)
{
    $parts = explode(".", $fileName);

    return $parts[0];
}

function metersPerHourGet($dh, $dx)
{
    // This formula was defined by Tobler
    // On flat ground the formula works out to about 5 km/h.
    $metersPerHour = 6 * pow(2.71828, -3.5 * abs($dh / $dx + 0.05)) * 1000;

    // Make sure the minimum speede is 1/2 kilometer per hour.
    // Sometimes elevation data is wrong and it may look like one is
    // climbing up an extremely steep cliff.
    if ($metersPerHour < 500) {
        if (isset($debug)) {
            echo "dh = $dh, dx = $dx\n";
        }

        $metersPerHour = 500;
    }

    return $metersPerHour;
}


function metersToMilesRounded ($meters)
{
    return round($meters / 1609.34 * 10) / 10;
}

function sendRequest ($request, $socket)
{
    try
    {
        $stream = stream_socket_client($socket);

        if ($stream !== false)
        {
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
    } catch (Exception $e) {
        error_log("Caught exception: " . $e->getMessage() . "\n");
    }
}


function sendRouteFindRequest ($request)
{
    return sendRequest ($request, "unix:///run/routeFind/routeFind.sock");
}

function sendMapRenderRequest ($request)
{
    return sendRequest ($request, "unix:///run/mapRender/mapRender.sock");
}

