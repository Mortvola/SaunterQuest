<?php
namespace bpp;
//use const bpp\Day\$cantMoveStartMeters as false;

class Day implements \JsonSerializable
{
    private $meters = 0;
    private $startMeters = 0;

    private $lat;
    private $lng;
    private $ele;
    
    private $gain = 0;
    private $loss = 0;
    
    public $foodPlanId;
    public $foodWeight = 0;
    public $accumWeight = 0;

    private $elapsedTime = 0;
    private $startTime;
    public $endTime;
    
    public $notes;
    public $segment = 0;
    public $segmentMeters = 0;
    private $cantMoveStartMeters = false;
    public $events = [];

    public function jsonSerialize ()
    {
        $array = ["startTime" => $this->startTime,
                "endTime" => $this->endTime,
                "startMeters" => $this->startMeters,
                "meters" => $this->meters,
                "lat" => $this->lat,
                "lng" => $this->lng,
                "ele" => $this->ele,
                "gain" => $this->gain,
                "loss" => $this->loss];
        
        if (isset ($this->endLat))
        {
            $array["endLat"] = $this->endLat;
        }
        
        if (isset ($this->endLng))
        {
            $array["endLng"] = $this->endLng;
        }
        
        if (isset ($this->endEle))
        {
            $array["endEle"] = $this->endEle;
        }
        
        if (isset ($this->endMeters))
        {
            $array["endMeters"] = $this->endMeters;
        }
        
        return $array;
    }
    
    //
    // Initialize the day
    //
    public function initialize($hikerProfile, $point, $startMeters, $segment, $segmentMeters)
    {
        $this->startMeters = $startMeters;

        getFoodPlan($this->foodPlanId, $this->foodWeight);

        if ($this->notes == null) {
            $this->notes = "";
        }

        if ($this->startTime == null) {
            $this->startTime = $hikerProfile->startTime;
        }

        if ($this->endTime == null) {
            $this->endTime = $hikerProfile->endTime;
        }

        $this->lat = $point->lat;
        $this->lng = $point->lng;
        $this->ele = $point->ele;

        $this->segment = $segment;
        $this->segmentMeters = $segmentMeters;

        $this->events = [];
    }
    
    public function end ()
    {
        $this->endTime = $this->startTime + $this->elapsedTime;
    }
    
    public function metersAdd ($meters)
    {
        $this->meters += $meters;
    }
    
    public function metersGet ()
    {
        return $this->meters;
    }
    
    public function totalMetersGet ()
    {
        return $this->startMeters + $this->meters;
    }
    
    public function currentTimeGet ()
    {
        return $this->startTime + $this->elapsedTime;
    }
    
    public function timeAdd ($hours)
    {
        $this->elapsedTime += $hours;
    }
    
    public function updateGainLoss ($eleDelta)
    {
        if ($eleDelta > 0) {
            $this->gain += $eleDelta;
        } else {
            $this->loss += -$eleDelta;
        }
    }
    
    public function pointGet ()
    {
        return (object)["lat" => $this->lat, "lng" => $this->lng];
    }
    
    public function reset ()
    {
        $this->meters = 0;
        $this->elapsedTime = 0;
        $this->gain = 0;
        $this->loss = 0;
    }
}
