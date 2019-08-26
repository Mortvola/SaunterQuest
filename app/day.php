<?php
namespace bpp;
//use const bpp\Day\$cantMoveStartMeters as false;

class Day
{
    public $meters = 0;
    public $startMeters = 0;

    public $lat;
    public $lng;
    public $ele;
    
    public $gain = 0;
    public $loss = 0;
    
    public $foodPlanId;
    public $foodWeight = 0;
    public $accumWeight = 0;

    private $elapsedTime = 0;
    public $startTime;
    public $endTime;
    
    public $hoursHiked = 0;
    public $notes;
    public $segment = 0;
    public $segmentMeters = 0;
    public $cantMoveStartMeters = false;
    public $events = [];

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
    
    public function reset ()
    {
        $this->meters = 0;
        $this->elapsedTime = 0;
        $this->gain = 0;
        $this->loss = 0;
    }
}
