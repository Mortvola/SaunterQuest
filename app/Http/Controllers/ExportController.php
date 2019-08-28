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
    
    public function get ()
    {
        $userId = Auth::user()->id;
        $userHikeId = $_GET["id"];
        
        if (isset($_GET["segmentMax"])) {
            $maxNumberOfPointsPerSegment = $_GET["segmentMax"];
        }
        
        if (isset($_GET["maxDistance"])) {
            $maximumDistanceBetweenPoints = $_GET["maxDistance"];
        }
        
        $export = new Export ($userId, $userHikeId, $maxNumberOfPointsPerSegment, $maximumDistanceBetweenPoints);
        
        return $export->get ();
    }
}
