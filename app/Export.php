<?php

namespace App;

use App\Schedule;

require_once app_path("routeFile.php");

class Export
{
    private $userId;
    private $userHikeId;
    private $maximumDistanceBetweenPoints = 400; // meters
    private $maxNumberOfPointsPerSegment = 200;
    private $numberOfPoints = 0;
    private $startDistance = 0;
    private $prevPoint;
    
    public function __construct ($userId, $userHikeId, $maxNumberOfPointsPerSegment, $maximumDistanceBetweenPoints)
    {
        $this->userId = $userId;
        $this->userHikeId = $userHikeId;
        
        if (isset ($maxNumberOfPointsPerSegment))
        {
            $this->maxNumberOfPointsPerSegment = $maxNumberOfPointsPerSegment;
        }
        
        if (isset ($maximumDistanceBetweenPoints))
        {
            $this->maximumDistanceBetweenPoints = $maximumDistanceBetweenPoints;
        }
    }
    
    public function get ()
    {
        $points = getRoutePointsFromUserHike($this->userHikeId);
        
        if (isset($points)) {
            $xw = new \XMLWriter();
            
            $xw->openMemory();
            
            $xw->startDocument("1.0");
            
            $xw->setIndentString("  ");
            $xw->setIndent(true);
            
            $xw->startElement("gpx");
            
            $xw->writeAttribute("xmlns:xsd", "http://www.w3.org/2001/XMLSchema");
            $xw->writeAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
            
            $schedule = new Schedule ($this->userId, $this->userHikeId);
            $days = $schedule->get ();
            
            for ($d = 1; $d < count($days); $d++) {
                $this->writeWayPoint($xw, $days[$d]->pointGet (), "Day " . $d . " camp");
            }
            
            $pointsOfInterest = PointOfInterest::where('userHikeId', $this->userHikeId)->get ();
            
            foreach ($pointsOfInterest as $poi) {
                $this->writeWayPoint($xw, $poi, $poi->name);
            }
            
            $xw->startElement("trk");
            
            $xw->startElement("trkseg");
            
            $this->startDistance = $points[0]->dist - $this->maximumDistanceBetweenPoints;
            
            foreach ($points as $p) {
                $this->writeTrackPoint($xw, $p);
            }
            
            $xw->endElement(); // trkseg
            
            $xw->endElement(); // trk
            
            $xw->endElement(); // gpx
            
            $xw->endDocument();
            
            return $xw->outputMemory();
        }
    }
    
    function writeTrackPoint($xw, $point)
    {
        if ($point->dist - $this->startDistance >= $this->maximumDistanceBetweenPoints) {
            if ($this->numberOfPoints >= $this->maxNumberOfPointsPerSegment) {
                // End the current segment and start a new segment
                // Use the last point of the prevous segment as the
                // start of the next segment.
                $xw->endElement(); // trkseg
                $xw->startElement("trkseg");
                
                if (isset($this->prevPoint)) {
                    $xw->startElement("trkpt");
                    
                    $xw->writeAttribute("lat", $this->prevPoint->lat);
                    $xw->writeAttribute("lon", $this->prevPoint->lng);
                    
                    $xw->endElement(); // trkpt
                    
                    $this->numberOfPoints = 1;
                }
            }
            
            $xw->startElement("trkpt");
            
            $xw->writeAttribute("lat", $point->lat);
            $xw->writeAttribute("lon", $point->lng);
            
            $xw->endElement(); // trkpt
            
            $this->numberOfPoints++;
            
            $this->prevPoint = $point;
            
            $this->startDistance = $point->dist;
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
}
