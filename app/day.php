<?php
namespace bpp;

// use const bpp\Day\$cantMoveStartMeters as false;
class Day implements \JsonSerializable
{

    private $meters = 0;

    private $startMeters = 0;

    private $point;

    private $gain = 0;

    private $loss = 0;

    public $foodPlanId;

    public $foodWeight = 0;

    public $accumWeight = 0;

    private $elapsedTime = 0;

    // in minutes
    private $startTime;

    // in minutes from midnight
    public $endTime;

    // in minutes from midnight
    public $notes;

    private $segment = 0;

    private $segmentMeters = 0;

    private $cantMoveStartMeters = false;

    public $events = [ ];

    public function jsonSerialize ()
    {
        $array = [
            "startTime" => $this->startTime,
            "endTime" => $this->endTime,
            "startMeters" => $this->startMeters,
            "meters" => $this->meters,
            "point" => $this->point,
            "gain" => $this->gain,
            "loss" => $this->loss,
            "accumWeight" => $this->accumWeight,
            "foodPlanId" => $this->foodPlanId
        ];

        if (isset($this->endLat))
        {
            $array["endLat"] = $this->endLat;
        }

        if (isset($this->endLng))
        {
            $array["endLng"] = $this->endLng;
        }

        if (isset($this->endEle))
        {
            $array["endEle"] = $this->endEle;
        }

        if (isset($this->endMeters))
        {
            $array["endMeters"] = $this->endMeters;
        }

        return $array;
    }

    //
    // Initialize the day
    //
    public function initialize ($hikerProfile, $point, $startMeters, $segment, $segmentMeters)
    {
        $this->startMeters = $startMeters;

        list ($this->foodPlanId, $this->foodWeight) = getFoodPlan();

        if ($this->notes == null)
        {
            $this->notes = "";
        }

        if ($this->startTime == null)
        {
            $this->startTime = $hikerProfile->startTime;
        }

        if ($this->endTime == null)
        {
            $this->endTime = $hikerProfile->endTime;
        }

        $this->point = (object)[ ];
        $this->point->lat = $point->lat;
        $this->point->lng = $point->lng;
        $this->point->ele = $point->ele;

        $this->segment = $segment;
        $this->segmentMeters = $segmentMeters;

        $this->events = [ ];
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

    public function timeAdd ($minutes)
    {
        $this->elapsedTime += $minutes;
    }

    public function updateGainLoss ($eleDelta)
    {
        if ($eleDelta > 0)
        {
            $this->gain += $eleDelta;
        }
        else
        {
            $this->loss += -$eleDelta;
        }
    }

    public function pointGet ()
    {
        return $this->point;
    }

    public function reset ()
    {
        $this->meters = 0;
        $this->elapsedTime = 0;
        $this->gain = 0;
        $this->loss = 0;
    }
}
