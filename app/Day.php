<?php
namespace bpp;

class Day implements \JsonSerializable
{

    private $startMeters = 0;

    private $meters = 0;

    private $point;

    private $gain = 0;

    private $loss = 0;

    public $foodPlanId;

    public $foodWeight = 0;

    public $accumWeight = 0;

    private $elapsedTime = 0;

    // in minutes from midnight
    private $startTime;
    private $endTime;

    public static function load ($startTime, $elapsedTime, $startMeters, $meters, $point, $gain, $loss)
    {
        $self = new self ();
        $self->startTime = $startTime;
        $self->elapsedTime = $elapsedTime;
        $self->startMeters = $startMeters;
        $self->meters = $meters;
        $self->point = $point;
        $self->gain = $gain;
        $self->loss = $loss;

        return $self;
    }

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

        if (isset($this->camp))
        {
            $array["camp"] = $this->camp;
        }

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
    public function initialize ($hikerProfile, $point, $startMeters, $camp, $startTime)
    {
        $this->startMeters = $startMeters;

        list ($this->foodPlanId, $this->foodWeight) = getFoodPlan();

        if ($this->startTime === null)
        {
            if ($startTime === null)
            {
                $this->startTime = $hikerProfile->startTime;
            }
            else
            {
                $this->startTime = $startTime;
            }
        }

        if ($this->endTime == null)
        {
            $this->endTime = $hikerProfile->endTime;
        }

        $this->point = (object)[ ];
        $this->point->lat = $point->lat;
        $this->point->lng = $point->lng;
        $this->point->ele = $point->ele;

        $this->camp = $camp;

        $this->events = [ ];
    }

    public function startTimeGet ()
    {
        return $this->startTime;
    }

    public function endTimeSet ($endTime)
    {
        $this->endTime = $endTime;
    }

    public function endTimeGet ()
    {
        return $this->endTime;
    }

    public function end ()
    {
        $this->endTime = $this->startTime + $this->elapsedTime;
    }

    public function startMetersGet ()
    {
        return $this->startMeters;
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

    public function elapsedTimeGet ()
    {
        return $this->elapsedTime;
    }

    public function timeAdd ($minutes)
    {
        $this->elapsedTime += $minutes;
    }

    public function gainGet ()
    {
        return $this->gain;
    }

    public function lossGet ()
    {
        return $this->loss;
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
