<?php
namespace bpp;
use App\Schedule;
use App\PointOfInterest;

// $debug = true;
// $maxZ = 2000;

// Include config file
// use const Day\$events as false;
require_once "coordinates.php";
require_once "routeFile.php";
require_once "utilities.php";
require_once "day.php";
require_once "segmentIterator.php";

class Event
{

    public function __construct ($type, $poiId, $lat, $lng, $shippingLocationId, $meters, $time, $notes)
    {
        $this->type = $type;
        $this->poiId = $poiId;
        $this->lat = $lat;
        $this->lng = $lng;
        $this->shippingLocationId = $shippingLocationId;
        $this->meters = $meters;
        $this->time = $time;
        $this->notes = $notes;
    }

    public $type;

    public $meters;

    public $lat;

    public $lng;

    public $shippingLocationId;

    public $time;

    public $notes;
}

function dayStart ($schedule, $point, $segmentIndex, $segmentMeters)
{
    global $activeHikerProfile;

    $schedule->nextDay();

    $activeHikerProfile = $schedule->activeHikerProfileGet();

    $schedule->currentDayGet()->initialize($activeHikerProfile, $point, $schedule->previousDayTotalMetersGet(), $segmentIndex, $segmentMeters);
}

//
// Compute the weight of food over a period of days
//
function computeFoodWeight ($schedule, $foodStart)
{
    $d = $schedule->currentDayIndexGet();

    $accum = 0;
    for ($i = $d; $i >= $foodStart; $i--)
    {
        $day = $schedule->dayGet($i);

        $accum += $day->foodWeight;
        $day->accumWeight = $accum;
    }

    return $d + 1;
}

function StrategyEndLater ($timeShift, $schedule, $hoursNeeded)
{
    global $activeHikerProfile;

    $earliestChangedDay = -1;
    $d = $schedule->currentDayIndexGet() - 1;

    // Try extending the end hours for the past days
    for (; $d > 0; $d--)
    {
        $amountToShift = $activeHikerProfile->endTime + $timeShift - $schedule->dayGet($d)->endTime;

        if ($amountToShift > 0)
        {
            $schedule->dayGet($d)->endTime += $amountToShift;
            $hoursNeeded -= $amountToShift;

            $schedule->dayGet($d)->notes = "changed end time to " . $schedule->dayGet($d)->endTime . ";";
            // echo "Day $d, end time ", $schedule->dayGet ($d)->endTime, "\n";

            $earliestChangedDay = $d;

            if ($hoursNeeded <= 0)
            {
                break;
            }
        }
        else
        {
            // echo "Day $d, could not move end time\n";
        }

        //
        // If the start of this day can't be moved then look no earlier
        //
        if ($schedule->dayGet($d)->cantMoveStartMeters)
        {
            break;
        }
    }

    return [
        $earliestChangedDay,
        $hoursNeeded
    ];
}

function StrategyStartEarlier ($timeShift, $schedule, $hoursNeeded)
{
    global $activeHikerProfile;

    $earliestChangedDay = -1;
    $d = $schedule->currentDayIndexGet();

    //
    // Try starting earlier for the past days
    //
    for (; $d > 0; $d--)
    {
        $amountToShift = $schedule->dayGet($d)->startTime - ($activeHikerProfile->startTime - $timeShift);

        if ($amountToShift > 0)
        {
            $schedule->dayGet($d)->startTime -= $amountToShift;
            $hoursNeeded -= $amountToShift;

            $schedule->dayGet($d)->notes = "changed start time to " . $schedule->dayGet($d)->startTime . ";";
            // echo "Day $d, start time ", $schedule->dayGet ($d)->startTime,
            // "\n";

            $earliestChangedDay = $d;

            if ($hoursNeeded <= 0)
            {
                break;
            }
        }
        else
        {
            // echo "Day $d, could not move start time\n";
        }

        //
        // If the start of this day can't be moved then look no earlier
        //
        if ($schedule->dayGet($d)->cantMoveStartMeters)
        {
            break;
        }
    }

    return [
        $earliestChangedDay,
        $hoursNeeded
    ];
}

function findEvent ($eventType, $events)
{
    $foundEvent = null;

    for ($i = 0; $i < count($events); $i++)
    {
        if ($events[$i]->type == $eventType)
        {
            $foundEvent = $events[$i];

            break;
        }
    }

    return $foundEvent;
}

function pointsOfInterestGet ($userId, $userHikeId, $points)
{
    $pointsOfInterest = PointOfInterest::where('hike_id', $userHikeId)->has('constraints')->get();

    $pointsOfInterest->load('constraints');

    //
    // Find the segment that is nearest to this POI.
    //
    foreach ($pointsOfInterest as $poi)
    {
        list($s, $distance) = nearestSegmentFind($poi->lat, $poi->lng, $points);

        if ($s != -1)
        {
            $distance = haversineGreatCircleDistance($points[$s]->point->lat, $points[$s]->point->lng, $poi->lat, $poi->lng);

            $segmentPercentage = percentageOfPointOnSegment((object)[
                "x" => $poi->lat,
                "y" => $poi->lng
            ], (object)[
                "x" => $points[$s]->point->lat,
                "y" => $points[$s]->point->lng
            ], (object)[
                "x" => $points[$s + 1]->point->lat,
                "y" => $points[$s + 1]->point->lng
            ]);

            // echo "Found segment $s\n";

            foreach ($poi->constraints as $constraint)
            {
                $points[$s]->subsegments[strval($segmentPercentage)]->events[] = (object)[
                    "poiId" => $poi->id,
                    "type" => $constraint->type,
                    "lat" => $poi->lat,
                    "lng" => $poi->lng,
                    // "shippingLocationId" => $poi->shippingLocationId,
                    "time" => $constraint->time,
                    "enabled" => true,
                    "segmentPercentage" => $segmentPercentage,
                    "segments" => [
                        (object)[
                            "lat" => $points[$s]->point->lat,
                            "lng" => $points[$s]->point->lng,
                            "ele" => $points[$s]->point->ele,
                            "dist" => 0
                        ],
                        (object)[
                            "lat" => $poi->lat,
                            "lng" => $poi->lng,
                            "ele" => $points[$s]->point->ele,
                            "dist" => $distance
                        ]
                    ]
                ];
            }
        }
    }

    // var_dump ($points);
}

function trailConditionsGet ($userHikeId, $points)
{
    $trailConditions = \App\TrailCondition::where('hike_id', $userHikeId)->get();

    $s = -1;

    //
    // Find the segment that is nearest to this POI.
    //
    for ($t = 0; $t < count($trailConditions); $t++)
    {

        if ($trailConditions[$t]->speedFactor == null)
        {
            $trailConditions[$t]->speedFactor = 100;
        }

        list($s, $distance) = nearestSegmentFind($trailConditions[$t]->startLat, $trailConditions[$t]->startLng, $points);

        if ($s != -1)
        {
            list($e, $distance) = nearestSegmentFind($trailConditions[$t]->endLat, $trailConditions[$t]->endLng, $points);

            if ($e != -1)
            {
                if ($s > $e)
                {
                    $tmp = $s;
                    $s = $e;
                    $e = $tmp;
                }

                $startSegmentPercentage = percentageOfPointOnSegment((object)[
                    "x" => $trailConditions[$t]->startLat,
                    "y" => $trailConditions[$t]->startLng
                ], (object)[
                    "x" => $points[$s]->point->lat,
                    "y" => $points[$s]->point->lng
                ], (object)[
                    "x" => $points[$s + 1]->point->lat,
                    "y" => $points[$s + 1]->point->lng
                ]);

                $points[$s]->subsegments[strval($startSegmentPercentage)]->events[] = (object)[
                    "type" => "trailCondition",
                    "index" => $t
                ];
                $trailConditions[$t]->startSegment = (object)[
                    "segment" => $s,
                    "percentage" => $startSegmentPercentage
                ];

                $endSegmentPercentage = percentageOfPointOnSegment((object)[
                    "x" => $trailConditions[$t]->endLat,
                    "y" => $trailConditions[$t]->endLng
                ], (object)[
                    "x" => $points[$e]->point->lat,
                    "y" => $points[$e]->point->lng
                ], (object)[
                    "x" => $points[$e + 1]->point->lat,
                    "y" => $points[$e + 1]->point->lng
                ]);

                $points[$e]->subsegments[strval($endSegmentPercentage)]->events[] = (object)[
                    "type" => "trailCondition",
                    "index" => $t
                ];
                $trailConditions[$t]->endSegment = (object)[
                    "segment" => $e,
                    "percentage" => $endSegmentPercentage
                ];
            }
        }
    }

    return $trailConditions;
}

function getFoodPlan ()
{
    global $food, $foodPlanIndex;

    if (count($food) > 0)
    {
        if (!isset($foodPlanIndex))
        {
            $foodPlanIndex = array_rand($food);
        }
        else
        {
            $foodPlanIndex++;

            if ($foodPlanIndex >= count($food))
            {
                $foodPlanIndex = 0;
            }
        }

        $foodPlanId = $food[$foodPlanIndex]->id;
        $foodPlanWeight = $food[$foodPlanIndex]->weight;

        return [
            $foodPlanId,
            $foodPlanWeight
        ];
    }
}

function foodPlansGet ($userId)
{
    $food = \DB::select(
        \DB::raw(
            "select dt.id, dt.name, sum(coalesce(fiss.grams, fi.grams_serving_size) * dtfi.number_of_servings) as weight
		from day_template_food_item dtfi
		join food_item fi on fi.id = dtfi.food_item_id
		left join food_item_serving_size fiss on fiss.food_item_id = dtfi.food_item_id
		join day_template dt on dt.id = dtfi.day_template_id and user_id = :userId
		group by dt.id, dtfi.day_template_id, dt.name"), array (
            "userId" => $userId
        ));

    return $food;
}

function activeTrailConditionsGet ($trailConditions, $segmentIndex, $segmentPercentage)
{
    $speedFactor = 1.0;
    $type = 2; // 'other'

    if (isset ($trailConditions))
    {
        foreach ($trailConditions as $tc)
        {
            if (($tc->startSegment->segment < $segmentIndex || ($tc->startSegment->segment == $segmentIndex && $tc->startSegment->percentage <= $segmentPercentage)) && ($tc->endSegment->segment >
                $segmentIndex || ($tc->endSegment->segment == $segmentIndex && $tc->endSegment->percentage > $segmentPercentage)))
            {
                // echo "Active trail condition: start segment: ",
                // $tc->startSegment->segment, ", end segment: ",
                // $tc->endSegment->segment, "\n";
                $speedFactor *= $tc->speedFactor / 100.0;

                // If the type of the trail condition is a lower number (more
                // signficant) then
                // change to it instead of the current type.
                // Current defined types are: 0=no camping, 1=no stealth camping, 2=
                // other
                if ($tc->type < $type)
                {
                    $type = $tc->type;
                }
            }
        }
    }

    return [
        $speedFactor,
        $type
    ];
}

$lingerHours = 0;

function traverseSegment ($s1, $s2, $schedule, &$z, $segmentMeters, $lastEle)
{
    global $activeHikerProfile;
    global $foodStart, $maxZ, $debug, $trailConditions, $lingerHours;

    $restart = false;
    $metersPerMinute = metersPerHourGet(elevationChange($s1, $s2), segmentLength($s1, $s2)) / 60.0;

    // todo: do we need to call this per segment or should the results just be
    // global and only call this
    // when reaching a new trail condition point or if starting the segment
    // mid-segment?
    list ($trailConditionsSpeedFactor, $trailConditionType) = activeTrailConditionsGet($trailConditions, /*$it->key()*/ 0, $segmentMeters / segmentLength($s1, $s2));

//     if (isset($it->current()->subsegments))
//     {
//         reset($it->current()->subsegments);
//     }


//    for (;;)
    {
//         $z++;

//         if (isset($maxZ) && $z > $maxZ)
//         {
//             if (isset($debug))
//             {
//                 echo "exited inner loop after $z iterations\n";
//             }
//             break;
//         }

        // echo "Day $d, segment meters: " . $segmentMeters . "\n";
        // echo "Day $d, segment meters: " . dayGet ($d)->segmentMeters . "\n";

        $currentMetersPerMinute = $metersPerMinute * $trailConditionsSpeedFactor * ($activeHikerProfile->speedFactor / 100.0);

        // echo "Meters/hour = $metersPerHour\n";
        // echo "Adjusted Meters/hour = ", ($metersPerHour *
        // $activeHikerProfile->speedFactor), "\n";
        // echo "Meters/day = $dayMetersRemaining\n";

        // Determine how far away the next event (either an actual event or the
        // end of the current segment.
//         if (isset($it->current()->subsegments) && key($it->current()->subsegments) !== null)
//         {
//             $metersToEndOfSegment = floatval(key($it->current()->subsegments)) * $it->segmentLength() - $segmentMeters;

//             $events = current($it->current()->subsegments)->events;

//             next($it->current()->subsegments);
//         }
//         else
        {
            $metersToEndOfSegment = segmentLength($s1, $s2) - $segmentMeters;

            unset($events);
        }

        $minutesToEndOfSegment = $metersToEndOfSegment / $currentMetersPerMinute;

        if (isset($s1->timeConstraints) && $s1->timeConstraints()->count () > 0)
        {
            $delays = $s1->timeConstraints()->where('type', 'delay')->get ();

            foreach ($delays as $delay)
            {
                if ($delay->time !== null)
                {
                    error_log ('Delaying for ' . $delay->time . ' minutes');
                    $schedule->currentDayGet()->timeAdd($delay->time);
                }
            }
        }

        $currentTime = $schedule->currentDayGet()->currentTimeGet();

        if (isset($debug))
        {
            echo "Segment Meters: ", $segmentMeters, " current time: ", $currentTime, ", hours remaining: ", $schedule->currentDayGet()->endTime - $currentTime, ", Minutes to end of segmetn: ", $minutesToEndOfSegment, "\n";
        }

        // If we hike until the next event, will we hike through our afternoon
        // break?
        // If so, hike until it is time, take the break and continue.
        if ($currentTime < 12 * 60 && $currentTime + $minutesToEndOfSegment > 12 * 60)
        {
            // Hike until the afternoon rest time, make adjustments to
            // currentTime
            // and remaining distance for this segment.

            $minutesHiked = 12 * 60 - $currentTime;
            $metersHiked = $minutesHiked * $currentMetersPerMinute;

            $segmentMeters += $metersHiked;

            $schedule->currentDayGet()->timeAdd($minutesHiked + $activeHikerProfile->breakDuration);
            $schedule->currentDayGet()->metersAdd($metersHiked);
            $currentTime = $schedule->currentDayGet()->currentTimeGet();

            $metersToEndOfSegment -= $metersHiked;
            $minutesToEndOfSegment -= $minutesHiked;
        }
        elseif ($currentTime >= 12 && $currentTime < 12 + $activeHikerProfile->breakDuration)
        {
            $schedule->currentDayGet()->timeAdd(12 + $activeHikerProfile->breakDuration - $currentTime);
            $currentTime = $schedule->currentDayGet()->currentTimeGet();
        }

        // Is there enough time remaining to hike to the next event? If so,
        // process the events
        // at that point. If not, then camp.

        if ($currentTime + $minutesToEndOfSegment < $schedule->currentDayGet()->endTime)
        {
            // There is enough time remaining to hike to the next event...

            $segmentMeters += $metersToEndOfSegment;
            $remainingSegmentMeters = max(segmentLength($s1, $s2) - $segmentMeters, 0);

            $schedule->currentDayGet()->timeAdd($minutesToEndOfSegment);
            $schedule->currentDayGet()->metersAdd($metersToEndOfSegment);
            $currentTime = $schedule->currentDayGet()->currentTimeGet();

            // echo "$currentTime\n";

            // Process any events at this point

            // if (isset($it->nextSegment()->events) &&
            // count($it->nextSegment()->events) > 0)
            if (isset($events) && count($events) > 0)
            {
                // echo "events[0] = ", var_dump($events[0]), "\n";

                // echo "events available at segment ", $k + 1, "\n";
                // var_dump($nextSegment->events);

                // todo: sort the events
                foreach ($events as $event)
                {
                    // echo "key = ", $it->key (), " event type = ",
                    // $event->type, " segment meters = ", $segmentMeters, "
                    // remaining meters = ", $remainingSegmentMeters, "\n";

                    // $event = findEvent("arriveBefore", $events);

                    if ($event->type == "trailCondition")
                    {
                        // echo "before: $trailConditionsSpeedFactor\n";

                        list ($trailConditionsSpeedFactor, $trailConditionType) = activeTrailConditionsGet($trailConditions, /*$it->key()*/ 0,
                            $segmentMeters / segmentLength($s1, $s2));

                        // echo "after: $trailConditionsSpeedFactor\n";
                    }
                    elseif ($event->type == "arriveBefore" && $event->enabled)
                    {
                        $arriveBeforeTime = $event->time;

                        // echo "arrival restriction on day $d, currentTime =
                        // $currentTime, requiredTime = $arriveBeforeTime\n";

                        if ($currentTime > $arriveBeforeTime)
                        {
                            $hoursNeeded = $currentTime - $arriveBeforeTime;

                            // extend the end time of each prior day an hour
                            // until the needed time is found and recompute
                            // distance.
                            // todo: this needs to be a preference. The
                            // algorithm could add an hour to each
                            // prior day until the extra time needed is found or
                            // it could evenly divide the needed time
                            // across all days since the start, or a mix of the
                            // two.

                            list ($startDay1, $hoursNeeded) = StrategyEndLater(1, $schedule, $hoursNeeded);

                            if ($startDay1 == -1)
                            {
                                $startDay1 = $schedule->currentDayIndexGet();
                            }

                            if ($hoursNeeded > 0)
                            {
                                list ($startDay2, $hoursNeeded) = StrategyStartEarlier(1, $schedule, $hoursNeeded);

                                if ($startDay2 == -1)
                                {
                                    $startDay2 = $schedule->currentDayIndexGet();
                                }

                                $startDay1 = min($startDay1, $startDay2);
                            }

                            if ($hoursNeeded > 0)
                            {
                                $event->enabled = false;
                            }

                            $schedule->currentDaySet($startDay1);

                            $restart = true;

                            return;
                        }

                        $schedule->currentDayGet()->events[] = new Event("arriveBefore", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime,
                            "Arrive Before: " . $arriveBeforeTime . ", arrived at " . $currentTime . ";");
                    }
                    elseif ($event->type == "resupply" && $event->enabled)
                    {
                        if (isset($event->segments) && count($event->segments) > 0)
                        {
                            // echo "Following segments to resupply. dayMeters =
                            // $dayMeters\n";
                            $pathIt = new SegmentIterator($event->segments, 1);
                            traverseSegments($pathIt, $schedule);
                            // echo "Reversing direction. dayMeters =
                            // $dayMeters\n";
                            $pathIt = new SegmentIterator($event->segments, -1);
                            traverseSegments($pathIt, $schedule);
                            // echo "Returned from following segments to
                            // resupply. dayMeters = $dayMeters\n";
                        }

                        $foodStart = computeFoodWeight($schedule, $foodStart);

                        if ($event)
                        {
                            $schedule->currentDayGet()->events[] = new Event("resupply", $event->poiId, $event->lat, $event->lng, $event->shippingLocationId,
                                $segmentMeters, $currentTime, "");
                        }
                    }
                    elseif ($event->type == "stop" && $event->enabled)
                    {
                        // todo: error out if a mustStop is in a noCamping area?

                        $schedule->currentDayGet()->events[] = new Event("stop", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "");

                        // todo: Determine what to do here. If we are
                        // mid-segment then it seems we should just initialize
                        // the new day. Otherwise, return back to the caller?

                        // if ($nextSegmentIndex < count($segments) - 1)
                        // {
                        // $schedule->currentDayGet()->end ($dayMeters,
                        // $dayGain, $dayLoss);
                        // dayStart ($nextSegment, $dayGain, $dayLoss,
                        // $nextSegmentIndex, $segmentMeters);

                        // $schedule->currentDayGet ()->cantMoveStartMeters =
                        // true;
                        // }
                    }
                    elseif ($event->type == "linger" && $event->enabled)
                    {
                        // todo: determine what it means to linger when already
                        // stopped.

                        // echo "linger time = ", $event->time, "\n";

                        $lingerHours = $event->time / 60;
                        $schedule->currentDayGet()->timeAdd($lingerHours);
                        $currentTime = $schedule->currentDayGet()->currentTimeGet();
                        // echo "Current Time = ", $currentTime, "\n";

                        /*
                         * $remainingHours = max(($hoursPerDay - $hoursHiked) -
                         * $lingerHours, 0);
                         *
                         * // echo "linger: hours hiked: $hoursHiked\n";
                         * // echo "linger: delta meters:
                         * $remainingSegmentMeters\n";
                         * // echo "linger: meters: $meters\n";
                         * // echo "linger: segment meters: $segmentMeters\n";
                         * // echo "linger: next segment meters: ",
                         * $nextSegment->dist, "\n";
                         * // echo "linger: remaining hours: $remainingHours\n";
                         *
                         * if ($remainingHours > 0)
                         * {
                         * $schedule->currentDayGet ()->events[] = new
                         * Event("linger", $event->poiId, $event->lat,
                         * $event->lng, null, $segmentMeters, $currentTime,
                         * "linger for " . $lingerHours . " hour(s);");
                         * }
                         * else
                         * {
                         * $schedule->currentDayGet ()->events[] = new
                         * Event("linger", $event->poiId, $event->lat,
                         * $event->lng, null, $segmentMeters, $currentTime,
                         * "linger for " . round ($lingerHours +
                         * $remainingHours, 1) . " hour(s);");
                         *
                         * // todo: Determine what to do here. If we are
                         * mid-segment then we should record the day. Otherwise,
                         * return back to the caller?
                         * // if ($nextSegmentIndex < count($segments) - 1)
                         * // {
                         * // $schedule->currentDayGet()->end ($dayMeters,
                         * $dayGain, $dayLoss);
                         * // dayStart ($nextSegment, $dayGain, $dayLoss,
                         * $nextSegmentIndex, $segmentMeters);
                         *
                         * // $lingerHours = -$remainingHours;
                         *
                         * // if ($lingerHours)
                         * // {
                         * // $schedule->currentDayGet ()->events[] = new
                         * Event("linger", $event->poiId, $event->lat,
                         * $event->lng, $segmentMeters, $currentTime, "linger
                         * for " . round($lingerHours, 1) . " hour(s);");
                         * // }
                         * // }
                         * }
                         */
                    }
                }
            }

            if ($remainingSegmentMeters <= 0)
            {
                $eleDelta = $s2->point->ele - $lastEle;

                $schedule->currentDayGet()->updateGainLoss($eleDelta);

                if (isset($debug))
                {
                    echo "Ended segment. Segment Meters = ", $segmentMeters, "\n\n";
                }

//                break;
            }
            else
            {
                if (isset($debug))
                {
                    echo "Continuing segment. Segment Meters = ", $segmentMeters, " Meters Remaining = ", $remainingSegmentMeters, "\n\n";
                }
            }
        }
        else
        {
            // $found = false;

            // if ($trailConditionType != 2)
            // {
            // echo "trailConditionType = $trailConditionType\n";
            // }
            /*
             * for ($i = 0; isset($noCamping) && $i < count($noCamping); $i++)
             * {
             * //echo "no camping start " . $noCamping[i][0] . " stop ".
             * $noCamping
             * if (($segmentMeters + $dayMetersRemaining) > $noCamping[$i][0] &&
             * ($segmentMeters + $dayMetersRemaining) < $noCamping[$i][1])
             * {
             * //echo "Day $d inside no camping area: " . ($segmentMeters +
             * $dayMetersRemaining) . ": " . $noCamping[$i][0] . ", " .
             * $noCamping[$i][1] . "\n";
             *
             * //
             * // We are in a no camping area... need to move.
             * //
             * $remainingMeters = $noCamping[$i][1] - ($segmentMeters +
             * $dayMetersRemaining);
             * $hoursNeeded = $remainingMeters / $currentMetersPerHour;
             *
             * //echo "needed hours: $hoursNeeded\n";
             *
             * list($startDay1, $hoursNeeded) = StrategyEndLater (1, $schedule,
             * $d, $hoursNeeded);
             *
             * if ($startDay1 == -1)
             * {
             * $startDay1 = $d;
             * }
             *
             * if ($hoursNeeded > 0)
             * {
             * list($startDay2, $hoursNeeded) = StrategyStartEarlier (1,
             * $schedule, $d, $hoursNeeded);
             *
             * if ($startDay2 == -1)
             * {
             * $startDay2 = $d;
             * }
             *
             * $startDay1 = min($startDay1, $startDay2);
             * }
             *
             * $d = $startDay1;
             *
             * $restart = true;
             *
             * return;
             *
             * // $dayMeters += $remainingMeters;
             * // $segmentMeters += $remainingMeters;
             * // $schedule->currentDayGet ()->endTime += $remainingHours;
             *
             * // echo "Changed end time for $d to ", $schedule->currentDayGet
             * ()->endTime, "\n";
             *
             * // echo "Changed to $dayMeters, $segmentMeters\n";
             *
             * // $found = true;
             *
             * // break;
             * }
             * }
             */

            $minutesHiked = $schedule->currentDayGet()->endTime - $currentTime;
            $metersHiked = $minutesHiked * $currentMetersPerMinute;

            $segmentMeters += $metersHiked;

            $schedule->currentDayGet()->timeAdd($minutesHiked);
            $schedule->currentDayGet()->metersAdd($metersHiked);
            $currentTime = $schedule->currentDayGet()->currentTimeGet();

            // We ended the day between the start and end of the current
            // segment.
            // Determine where in the segment we ended and compute current
            // elevation and
            // lat/lng.

            $segmentPercent = $segmentMeters / segmentLength($s1, $s2);

            // echo "segmentPercent = $segmentPercent\n";
            // echo "segmentMeters = $segmentMeters\n";
            // echo "segment start = ", $segment->dist, "\n";
            // echo "segment end = ", $nextSegment->dist, "\n";
            // echo "numerator = ", ($segmentMeters - $segment->dist), "\n";
            // echo "denominator = ", ($nextSegment->dist - $segment->dist),
            // "\n";

            $currentEle = elevationChange($s1, $s2) * $segmentPercent + $s1->point->ele;

            $eleDelta = $currentEle - $lastEle;

            $schedule->currentDayGet()->updateGainLoss($eleDelta);

            $lastEle = $currentEle;

            // todo: This is just a linear computation of lat/lng given the
            // distance. Change this to
            // use a geodesic computation.
            $lat = ($s2->point->lat - $s1->point->lat) * $segmentPercent + $s1->point->lat;
            $lng = ($s2->point->lng - $s1->point->lng) * $segmentPercent + $s1->point->lng;

            $schedule->currentDayGet()->end();
            dayStart($schedule, (object)[
                "lat" => $lat,
                "lng" => $lng,
                "ele" => $currentEle
            ], /*$it->key()*/ 0, $segmentMeters);

            // echo "Day $d, segment meters: " . currentDayGet ()->segmentMeters
            // . "\n";
            // echo "day $d start meters = " . currentDayGet ()->meters . "\n";
        }

        // echo "Meters = $meters\n";
    }
}


function segmentLength ($s1, $s2)
{
    return $s2->dist - $s1->dist;
}

function elevationChange($s1, $s2)
{
    return $s2->point->ele - $s1->point->ele;
}


function traverseRoute ($route, $schedule)
{
    global $maxZ, $debug;

    $restart = false;

    $z = 0;

    $it = new SegmentIterator($route);

    foreach ($it as $segment)
    {
        if (isset ($prevSegment))
        {
            if (isset($debug))
            {
                echo "Segment Length = ", segmentLength($prevSegment, $segment), "\n";
            }

            // If the segment has some length to it then traverse. If it is zero (or
            // less)
            // then just skip it.
            if (segmentLength($prevSegment, $segment) > 0)
            {
                if ($restart)
                {
                    if (isset($debug))
                    {
                        echo "Restarting at day $d\n";
                    }

                    $segmentMeters = $schedule->currentDayGet()->segmentMeters;
                    $lastEle = $schedule->currentDayGet()->point->ele;
                    $schedule->currentDayGet()->reset();
                    $restart = false;
                }
                else
                {
                    $segmentMeters = 0;
                    $lastEle = $prevSegment->point->ele;
                }

                $restart = traverseSegment($prevSegment, $segment, $schedule, $z, $segmentMeters, $lastEle);

                if ($restart)
                {
                    // decrease by one since the for loop will increase it by one
                    $it->position($schedule->currentDayGet()->segment - 1);
                }

                if (isset($maxZ) && $z > $maxZ)
                {
                    if (isset($debug))
                    {
                        echo "exited outer loop after $z iterations\n";
                    }

                    break;
                }
            }
        }

        $prevSegment = $segment;
    }

    $day = $schedule->currentDayGet();

    $day->end();

    $day->endLat = $segment->point->lat;
    $day->endLng = $segment->point->lng;
    $day->endEle = $segment->point->ele;
    $day->endMeters = $day->totalMetersGet();
}

function getSchedule ($schedule, $userId, $userHikeId, $route)
{
    global $foodStart;
    global $debug;
    global $trailConditions;
    global $food;

    $food = foodPlansGet($userId);
//    pointsOfInterestGet($userId, $userHikeId, $points);
//    $trailConditions = trailConditionsGet($userHikeId, $points);

    dayStart($schedule, $route[0]->point, 0, 0);

    $foodStart = $schedule->currentDayIndexGet();

    traverseRoute($route, $schedule);

    computeFoodWeight($schedule, $foodStart);
}
