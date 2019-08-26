<?php
namespace bpp;
//use const bpp\Day\$cantMoveStartMeters as false;

class Day
{
    public $meters = 0;
    public $lat;
    public $lng;
    public $ele;
    public $gain = 0;
    public $loss = 0;
    public $foodPlanId;
    public $foodWeight = 0;
    public $accumWeight = 0;
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
    public function dayInitialize($hikerProfile, $point, $prevDayMeters, &$dayMeters, $k, $segmentMeters)
    {
        $this->meters = $prevDayMeters + $dayMeters;

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

        $this->segment = $k;
        $this->segmentMeters = $segmentMeters;

        //unset($this->events);
        $this->events = [];
    }
    
    public function end ($dayMeters, $dayGain, $dayLoss, $endTime)
    {
        $this->gain = $dayGain;
        $this->loss = $dayLoss;
        $this->distance = $dayMeters;
        $this->endTime = $endTime;
    }
}
