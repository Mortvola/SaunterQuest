<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Export;

class ExportController extends Controller
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

    public function get ($hikeId, Request $request)
    {
        $userId = Auth::user()->id;
        $maxNumberOfPointsPerSegment = $request->input('segmentMax');
        $maximumDistanceBetweenPoints = $request->input('maxDistance');

        $export = new Export ($userId, $hikeId, $maxNumberOfPointsPerSegment, $maximumDistanceBetweenPoints);

        return $export->get ();
    }
}
