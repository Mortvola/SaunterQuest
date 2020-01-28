<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Tile;
require_once app_path("utilities.php");

class TileController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function get ($request, $layer, $x, $y, $z)
    {
        $tileRequest = (object)["command" => "getTile", "x" => intval($x), "y" => intval($y), "z" => intval($z)];

        if ($layer == 'images')
        {
            $tileRequest->command = "getTile";
        }
        else
        {
            $tileRequest->command = "getTerrain";
        }

        $response = sendMapRenderRequest($tileRequest);

        $file = $response;

        if (file_exists($file))
        {
            if (file_exists($file . '.md5'))
            {
                $md5 = file_get_contents ($file . '.md5');
            }
            else
            {
                $contents = file_get_contents($file);
                $md5 = md5($contents);
            }

            $etag = $request->header('If-None-Match');

            if (isset($etag) && $md5 == $etag)
            {
                $response = response (null, 304);
            }
            else
            {
                if (!isset($contents))
                {
                    $contents = file_get_contents($file);
                }

                $response = response($contents)
                    ->header('content-type', "image/png");
            }

            $response->header('Cache-Control', 'max-age=' . (7 * 24 * 60 * 60))
                ->header ('ETag', $md5);

            return $response;
        }

        return abort(404);
    }
}
