<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Elevation;

class ElevationController extends Controller
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

    public function get (Request $request)
    {
        $lat = $request->input('lat');
        $lng = $request->input('lng');

        $ele = (new Elevation)->getElevation($lat, $lng);

        if (isset($ele))
        {
            return $ele;
        }

        return json_encode(null);
    }

    public function downloadElevations (Request $request)
    {
        $point = json_decode($request->getContent());

        $ele = (new Elevation)->downloadFile($point);
    }
}
