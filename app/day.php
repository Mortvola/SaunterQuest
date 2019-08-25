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
    public function dayInitialize($d, $lat, $lng, $ele, &$dayMeters, $k, $segmentMeters)
    {
        global $food, $hikerProfile, $debug, $day;

        if ($d > 0) {
            $this->meters = $day[$d - 1]->meters + $dayMeters;
        } else {
            $this->meters = $dayMeters;
        }

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

        $this->lat = $lat;
        $this->lng = $lng;
        $this->ele = $ele;

        $this->segment = $k;
        $this->segmentMeters = $segmentMeters;

        //unset($this->events);
        $this->events = [];

        if (isset($debug)) {
            echo "Initializing Day $d, meters: $this->meters, segment: $k, segment meters: $segmentMeters\n";
        }
    }
}
