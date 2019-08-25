<?php
namespace bpp;

//$debug = true;
//  $maxZ = 2000;

// Include config file
//use const Day\$events as false;

require_once "coordinates.php";
require_once "routeFile.php";
require_once "utilities.php";
require_once "pointOfInterestUtils.php";
require_once "day.php";
require_once "segmentIterator.php";


class Event
{
    public function __construct($type, $poiId, $lat, $lng, $shippingLocationId, $meters, $time, $notes)
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



function dayStart(&$d, &$dayMeters, &$dayHours, $lat, $lng, $ele, &$dayGain, &$dayLoss, $segmentIndex, $segmentMeters)
{
    global $currentTime;

    $d++;

    activeHikerProfileGet($d);

    DayGet($d)->dayInitialize($d, $lat, $lng, $ele, $dayMeters, $segmentIndex, $segmentMeters);

    $dayMeters = 0;
    $dayHours = 0;
    $dayGain = 0;
    $dayLoss = 0;
    $currentTime = DayGet($d)->startTime;
}


function dayEnd($d, $dayMeters, $dayGain, $dayLoss, $endTime)
{
    DayGet($d)->gain = $dayGain;
    DayGet($d)->loss = $dayLoss;
    DayGet($d)->distance = $dayMeters;
    DayGet($d)->endTime = $endTime;
}


//
// Compute the weight of food over a period of days
//
function computeFoodWeight(&$day, $d, &$foodStart)
{
//  echo "d = $d, foodStart = $foodStart\n";
    $accum = 0;
    for ($i = $d; $i >= $foodStart; $i--) {
//      echo $i, ": ";
        $accum += $day[$i]->foodWeight;
//      echo $day[$i]->foodWeight, ", ";
        $day[$i]->accumWeight = $accum;
//      echo $day[$i]->accumWeight, "\n";
    }

    $foodStart = $d + 1;
}


function StrategyEndLater($timeShift, &$day, $d, &$hoursNeeded)
{
    global $hikerProfile;

    $earliestChangedDay = -1;

    // Try extending the end hours for the past days
    for (; $d > 0; $d--) {
        $amountToShift = $hikerProfile->endTime + $timeShift - $day[$d]->endTime;

        if ($amountToShift > 0) {
            $day[$d]->endTime += $amountToShift;
            $hoursNeeded -= $amountToShift;

            $day[$d]->notes = "changed end time to " . $day[$d]->endTime . ";";
            //echo "Day $d, end time ", $day[$d]->endTime, "\n";

            $earliestChangedDay = $d;

            if ($hoursNeeded <= 0) {
                break;
            }
        } else {
            //echo "Day $d, could not move end time\n";
        }

        //
        // If the start of this day can't be moved then look no earlier
        //
        if ($day[$d]->cantMoveStartMeters) {
            break;
        }
    }

    return $earliestChangedDay;
}


function StrategyStartEarlier($timeShift, &$day, $d, &$hoursNeeded)
{
    global $hikerProfile;

    $earliestChangedDay = -1;

    //
    // Try starting earlier for the past days
    //
    for (; $d > 0; $d--) {
        $amountToShift = $day[$d]->startTime - ($hikerProfile->startTime - $timeShift);

        if ($amountToShift > 0) {
            $day[$d]->startTime -= $amountToShift;
            $hoursNeeded -= $amountToShift;

            $day[$d]->notes = "changed start time to " . $day[$d]->startTime . ";";
            //echo "Day $d, start time ", $day[$d]->startTime, "\n";

            $earliestChangedDay = $d;

            if ($hoursNeeded <= 0) {
                break;
            }
        } else {
            //echo "Day $d, could not move start time\n";
        }

        //
        // If the start of this day can't be moved then look no earlier
        //
        if ($day[$d]->cantMoveStartMeters) {
            break;
        }
    }

    return $earliestChangedDay;
}


function findEvent($eventType, $events)
{
    $foundEvent = null;

    for ($i = 0; $i < count($events); $i++) {
        if ($events[$i]->type == $eventType) {
            $foundEvent = $events[$i];

            break;
        }
    }

    return $foundEvent;
}


function DayGet($d)
{
    global $day, $debug;

    if (!isset($day[$d])) {
        if (isset($debug)) {
            echo "Creating day $d\n";
        }

        $day[$d] = new Day();
    }

    return $day[$d];
}


function pointsOfInterestGet($userId, $userHikeId, &$points)
{
    $output = \DB::select(\DB::raw(
        "select poi.pointOfInterestId, lat, lng, type, time
		from pointOfInterest poi
		join pointOfInterestConstraint poic on poic.pointOfInterestId = poi.pointOfInterestId
		where poi.userHikeId = :userHikeId"),
        array("userHikeId" => $userHikeId));

    $s = -1;

    //
    // Find the segment that is nearest to this POI.
    //
    foreach ($output as $poi) {
        //var_dump ($poi);

        if ($s == -1 || ($points[$s]->lat != $poi->lat && $points[$s]->lng != $poi->lng)) {
            $s = nearestSegmentFind($poi->lat, $poi->lng, $points);
        }

        if ($s != -1) {
            $distance = haversineGreatCircleDistance($points[$s]->lat, $points[$s]->lng, $poi->lat, $poi->lng);

            $segmentPercentage = percentageOfPointOnSegment(
                (object)["x" => $poi->lat, "y" => $poi->lng],
                (object)["x" => $points[$s]->lat, "y" => $points[$s]->lng],
                (object)["x" => $points[$s + 1]->lat, "y" => $points[$s + 1]->lng]
            );

            //echo "Found segment $s\n";

            $points[$s]->subsegments[strval($segmentPercentage)]->events[] = (object)[
                    "poiId" => $poi->pointOfInterestId,
                    "type" => $poi->type,
                    "lat" => $poi->lat,
                    "lng" => $poi->lng,
                    //"shippingLocationId" => $poi->shippingLocationId,
                    "time" => $poi->time,
                    "enabled" => true,
                    "segmentPercentage" => $segmentPercentage,
                    "segments" => [
                            (object)["lat" => $points[$s]->lat, "lng" => $points[$s]->lng, "ele" => $points[$s]->ele, "dist" => 0],
                            (object)["lat" => $poi->lat, "lng" => $poi->lng, "ele" => $points[$s]->ele, "dist" => $distance],
                    ]
            ];
        }
    }

    //var_dump ($points);
}


function trailConditionsGet($userHikeId, &$points)
{
    $trailConditions = \DB::select (\DB::raw (
            "select tc.trailConditionId, startLat, startLng, endLat, endLng, type, IFNULL(speedFactor, 100) AS speedFactor
			from trailCondition tc
			join userHike uh on (uh.userHikeId = tc.userHikeId OR uh.hikeId = tc.hikeId)
			and uh.userHikeId = :userHikeId"),
            array ("userHikeId" => $userHikeId));

    $s = -1;

    //
    // Find the segment that is nearest to this POI.
    //
    for ($t = 0; $t < count($trailConditions); $t++) {
        $s = nearestSegmentFind($trailConditions[$t]->startLat, $trailConditions[$t]->startLng, $points);

        if ($s != -1) {
            $e = nearestSegmentFind($trailConditions[$t]->endLat, $trailConditions[$t]->endLng, $points);

            if ($e != -1) {
                if ($s > $e) {
                    $tmp  = $s;
                    $s = $e;
                    $e = $tmp;
                }

                $startSegmentPercentage = percentageOfPointOnSegment(
                    (object)["x" => $trailConditions[$t]->startLat, "y" => $trailConditions[$t]->startLng],
                    (object)["x" => $points[$s]->lat, "y" => $points[$s]->lng],
                    (object)["x" => $points[$s + 1]->lat, "y" => $points[$s + 1]->lng]
                );

                $points[$s]->subsegments[strval($startSegmentPercentage)]->events[] = (object)["type" => "trailCondition", "index" => $t];
                $trailConditions[$t]->startSegment = (object)["segment" => $s, "percentage" => $startSegmentPercentage];

                $endSegmentPercentage = percentageOfPointOnSegment(
                    (object)["x" => $trailConditions[$t]->endLat, "y" => $trailConditions[$t]->endLng],
                    (object)["x" => $points[$e]->lat, "y" => $points[$e]->lng],
                    (object)["x" => $points[$e + 1]->lat, "y" => $points[$e + 1]->lng]
                );

                $points[$e]->subsegments[strval($endSegmentPercentage)]->events[] = (object)["type" => "trailCondition", "index" => $t];
                $trailConditions[$t]->endSegment = (object)["segment" => $e, "percentage" => $endSegmentPercentage];
            }
        }
    }
    
    return $trailConditions;
}


function hikerProfilesGet($userId, $userHikeId)
{
    $hikerProfiles = \DB::select(\DB::raw(
            "select speedFactor,
				startDay, endDay,
				startTime, endTime, breakDuration
			from hikerProfile
			where userId = :userId
			and userHikeId = :userHikeId"),
            array ("userId" => $userId, "userHikeId" => $userHikeId));
    
    return $hikerProfiles;
}

function activeHikerProfileGet($d)
{
    global $hikerProfile, $hikerProfiles;

    if (!isset($hikerProfile)) {
        $hikerProfile = (object)[];
    }

    $hikerProfile->speedFactor = 100;
    $hikerProfile->startTime = 8;
    $hikerProfile->endTime = 19;
    $hikerProfile->breakDuration = 1;

    foreach ($hikerProfiles as $profile) {
        if ((!isset($profile->startDay) || $d >= $profile->startDay)
         && (!isset($profile->endDay) || $d <= $profile->endDay)) {
            if (isset($profile->speedFactor)) {
                $hikerProfile->speedFactor = $profile->speedFactor;
            }

            if (isset($profile->startTime)) {
                $hikerProfile->startTime = $profile->startTime;
            }

            if (isset($profile->endTime)) {
                $hikerProfile->endTime = $profile->endTime;
            }

            if (isset($profile->breakDuration)) {
                $hikerProfile->breakDuration = $profile->breakDuration;
            }
        }
    }
}


function getFoodPlan(&$foodPlanId, &$foodPlanWeight)
{
    global $food, $foodPlanIndex;

    if (!isset($foodPlanIndex)) {
        $foodPlanIndex = array_rand($food);
    } else {
        $foodPlanIndex++;

        if ($foodPlanIndex >= count($food)) {
            $foodPlanIndex = 0;
        }
    }

    $foodPlanId = $food[$foodPlanIndex]->dayTemplateId;
    $foodPlanWeight = $food[$foodPlanIndex]->weight;
}


function foodPlansGet($userId)
{
    $food = \DB::select(\DB::raw (
        "select dt.dayTemplateId, dt.name, sum(IFNULL(fiss.grams, fi.gramsServingSize) * dtfi.numberOfServings) as weight
		from dayTemplateFoodItem dtfi
		join foodItem fi on fi.foodItemId = dtfi.foodItemId
		left join foodItemServingSize fiss on fiss.foodItemId = dtfi.foodItemId
		join dayTemplate dt on dt.dayTemplateId = dtfi.dayTemplateId and userId = :userId
		group by dtfi.dayTemplateId, dt.name"),
		array ("userId" => $userId));

    return $food;
}


function activeTrailConditionsGet($segmentIndex, $segmentPercentage, &$speedFactor, &$type)
{
    global $trailConditions;

    $speedFactor = 1.0;
    $type = 2; // 'other'

    foreach ($trailConditions as $tc) {
        if (($tc->startSegment->segment < $segmentIndex
         || ($tc->startSegment->segment == $segmentIndex && $tc->startSegment->percentage <= $segmentPercentage))
         && ($tc->endSegment->segment > $segmentIndex
         || ($tc->endSegment->segment == $segmentIndex && $tc->endSegment->percentage > $segmentPercentage))) {
//          echo "Active trail condition: start segment: ", $tc->startSegment->segment, ", end segment: ", $tc->endSegment->segment, "\n";
            $speedFactor *= $tc->speedFactor / 100.0;

            // If the type of the trail condition is a lower number (more signficant) then
            // change to it instead of the current type.
            // Current defined types are: 0=no camping, 1=no stealth camping, 2= other
            if ($tc->type < $type) {
                $type = $tc->type;
            }
        }
    }
}


$lingerHours = 0;
$currentTime = 0;

function traverseSegment($it, &$z, $segmentMeters, $lastEle, &$restart)
{
    global $hikerProfile, $d, $day, $dayHours, $dayMeters, $dayGain, $dayLoss;
    global $foodStart, $maxZ, $debug, $trailConditions, $lingerHours;
    global $currentTime;

    $metersPerHour = metersPerHourGet($it->elevationChange(), $it->segmentLength());

    // todo: do we need to call this per segment or should the results just be global and only call this
    // when reaching a new trail condition point or if starting the segment mid-segment?
    activeTrailConditionsGet($it->key(), $segmentMeters / $it->segmentLength(), $trailConditionsSpeedFactor, $trailConditionType);

    if (isset($it->current()->subsegments)) {
        reset($it->current()->subsegments);
    }

    // Loop until we reach the end of the current segment, no matter how many days that takes
    for (;;) {
        $z++;

        if (isset($maxZ) && $z > $maxZ) {
            if (isset($debug)) {
                echo "exited inner loop after $z iterations\n";
            }
            break;
        }

        //echo "Day $d, segment meters: " . $segmentMeters . "\n";
        //echo "Day $d, segment meters: " . DayGet ($d)->segmentMeters . "\n";

        $currentMetersPerHour = $metersPerHour * $trailConditionsSpeedFactor * ($hikerProfile->speedFactor / 100.0);

        //          echo "Meters/hour = $metersPerHour\n";
        //          echo "Adjusted Meters/hour = ", ($metersPerHour * $hikerProfile->speedFactor), "\n";
        //          echo "Meters/day = $dayMetersRemaining\n";

        // Determine how far away the next event (either an actual event or the end of the current segment.
        if (isset($it->current()->subsegments) && key($it->current()->subsegments) !== null) {
            $metersToNextEvent = floatval(key($it->current()->subsegments)) * $it->segmentLength() - $segmentMeters;

            $events = current($it->current()->subsegments)->events;

            next($it->current()->subsegments);
        } else {
            $metersToNextEvent = $it->segmentLength() - $segmentMeters;

            unset($events);
        }

        $hoursToNextEvent = $metersToNextEvent / $currentMetersPerHour;

        if (isset($debug)) {
            echo "Segment Meters: ", $segmentMeters, " current time: ", $currentTime, ", hours remaining: ", DayGet($d)->endTime - $currentTime, ", Hours to next event: ", $hoursToNextEvent, "\n";
        }

        // If we hike until the next event, will we hike through our afternoon break?
        // If so, hike until it is time, take the break and continue.
        if ($currentTime < 12 && $currentTime + $hoursToNextEvent > 12) {
            // Hike until the afternoon rest time, make adjustments to currentTime
            // and remaining distance for this segment.

            $hoursHiked = 12 - $currentTime;
            $metersHiked = $hoursHiked * $currentMetersPerHour;

            $segmentMeters += $metersHiked;

            DayGet($d)->hoursHiked += $hoursHiked;

            $dayHours += $hoursHiked + $hikerProfile->breakDuration;
            $dayMeters += $metersHiked;
            $currentTime = DayGet($d)->startTime + $dayHours;

            $metersToNextEvent -= $metersHiked;
            $hoursToNextEvent -= $hoursHiked;
        } elseif ($currentTime >= 12 && $currentTime < 12 + $hikerProfile->breakDuration) {
            $dayHours += 12 + $hikerProfile->breakDuration - $currentTime;
            $currentTime = DayGet($d)->startTime + $dayHours;
        }

        // Is there enough time remaining to hike to the next event. If so, process the events
        // at that point. If not, then camp.

        if ($currentTime + $hoursToNextEvent < DayGet($d)->endTime) {
            // There is enough time remaining to hike to the next event...

            $segmentMeters += $metersToNextEvent;
            $remainingSegmentMeters = max($it->segmentLength() - $segmentMeters, 0);

            DayGet($d)->hoursHiked += $hoursToNextEvent;

            $dayHours += $hoursToNextEvent;
            $dayMeters += $metersToNextEvent;
            $currentTime = DayGet($d)->startTime + $dayHours;

//          echo "$currentTime\n";

            // Process any events at this point

//          if (isset($it->nextSegment()->events) && count($it->nextSegment()->events) > 0)
            if (isset($events) && count($events) > 0) {
//              echo "events[0] = ", var_dump($events[0]), "\n";

                //                  echo "events available at segment ", $k + 1, "\n";
                //                  var_dump($nextSegment->events);

                //todo: sort the events
                foreach ($events as $event) {
//                  echo "key = ", $it->key (), " event type = ", $event->type, " segment meters = ", $segmentMeters, " remaining meters = ", $remainingSegmentMeters, "\n";

    //              $event = findEvent("arriveBefore", $events);

                    if ($event->type == "trailCondition") {
    //                  echo "before: $trailConditionsSpeedFactor\n";

                        activeTrailConditionsGet($it->key(), $segmentMeters / $it->segmentLength(), $trailConditionsSpeedFactor, $trailConditionType);

    //                  echo "after: $trailConditionsSpeedFactor\n";
                    } elseif ($event->type == "arriveBefore" && $event->enabled) {
                        $arriveBeforeTime = $event->time;

                        //echo "arrival restriction on day $d, currentTime = $currentTime, requiredTime = $arriveBeforeTime\n";

                        if ($currentTime > $arriveBeforeTime) {
                            $hoursNeeded = $currentTime - $arriveBeforeTime;

                            // extend the end time of each prior day an hour until the needed time is found and recompute distance.
                            // todo: this needs to be a preference. The algorithm could add an hour to each
                            // prior day until the extra time needed is found or it could evenly divide the needed time
                            // across all days since the start, or a mix of the two.

                            $startDay1 = StrategyEndLater(1, $day, $d - 1, $hoursNeeded);

                            if ($startDay1 == -1) {
                                $startDay1 = $d;
                            }

                            if ($hoursNeeded > 0) {
                                $startDay2 = StrategyStartEarlier(1, $day, $d, $hoursNeeded);

                                if ($startDay2 == -1) {
                                    $startDay2 = $d;
                                }

                                $startDay1 = min($startDay1, $startDay2);
                            }

                            if ($hoursNeeded > 0) {
                                $event->enabled = false;
                            }

                            $d = $startDay1;

                            $restart = true;

                            return;
                        }

                        DayGet($d)->events[] = new Event("arriveBefore", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "Arrive Before: " . $arriveBeforeTime . ", arrived at " . $currentTime . ";");
                    } elseif ($event->type == "resupply" && $event->enabled) {
                        if (isset($event->segments) && count($event->segments) > 0) {
    //                      echo "Following segments to resupply. dayMeters = $dayMeters\n";
                            $pathIt = new SegmentIterator($event->segments, 1);
                            traverseSegments($pathIt);
    //                      echo "Reversing direction. dayMeters = $dayMeters\n";
                            $pathIt = new SegmentIterator($event->segments, -1);
                            traverseSegments($pathIt);
    //                      echo "Returned from following segments to resupply. dayMeters = $dayMeters\n";
                        }

                        computeFoodWeight($day, $d, $foodStart);

                        if ($event) {
                            DayGet($d)->events[] = new Event("resupply", $event->poiId, $event->lat, $event->lng, $event->shippingLocationId, $segmentMeters, $currentTime, "");
                        }
                    } elseif ($event->type == "stop" && $event->enabled) {
                        // todo: error out if a mustStop is in a noCamping area?

                        DayGet($d)->events[] = new Event("stop", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "");

                        // todo: Determine what to do here. If we are mid-segment then it seems we should just initialize the new day. Otherwise, return back to the caller?

    //                  if ($nextSegmentIndex < count($segments) - 1)
    //                  {
    //                      dayEnd ($d, $dayMeters, $dayGain, $dayLoss);
    //                      dayStart ($d, $dayMeters, $dayHours, $nextSegment->lat, $nextSegment->lng, $nextSegment->ele, $dayGain, $dayLoss, $nextSegmentIndex, $segmentMeters);

    //                      DayGet ($d)->cantMoveStartMeters = true;
    //                  }
                    } elseif ($event->type == "linger" && $event->enabled) {
                        // todo: determine what it means to linger when already stopped.

//                      echo "linger time = ", $event->time, "\n";

                        $lingerHours = $event->time / 60;
                        $dayHours += $lingerHours;
                        $currentTime = DayGet($d)->startTime + $dayHours;
//                      echo "Current Time = ", $currentTime, "\n";

                        /*
                        $remainingHours = max(($hoursPerDay - $hoursHiked) - $lingerHours, 0);

                        //                  echo "linger: hours hiked: $hoursHiked\n";
                        //                  echo "linger: delta meters: $remainingSegmentMeters\n";
                        //                  echo "linger: meters: $meters\n";
                        //                  echo "linger: segment meters: $segmentMeters\n";
                        //                  echo "linger: next segment meters: ", $nextSegment->dist, "\n";
                        //                  echo "linger: remaining hours: $remainingHours\n";

                        if ($remainingHours > 0)
                        {
                            DayGet ($d)->events[] = new Event("linger", $event->poiId, $event->lat, $event->lng, null, $segmentMeters, $currentTime, "linger for " . $lingerHours . " hour(s);");
                        }
                        else
                        {
                            DayGet ($d)->events[] = new Event("linger", $event->poiId, $event->lat, $event->lng, null, $segmentMeters, $currentTime, "linger for " . round ($lingerHours + $remainingHours, 1) . " hour(s);");

                            // todo: Determine what to do here. If we are mid-segment then we should record the day. Otherwise, return back to the caller?
    //                      if ($nextSegmentIndex < count($segments) - 1)
    //                      {
    //                          dayEnd ($d, $dayMeters, $dayGain, $dayLoss);
    //                          dayStart ($d, $dayMeters, $dayHours, $nextSegment->lat, $nextSegment->lng, $nextSegment->ele, $dayGain, $dayLoss, $nextSegmentIndex, $segmentMeters);

    //                          $lingerHours = -$remainingHours;

    //                          if ($lingerHours)
    //                          {
    //                              DayGet ($d)->events[] = new Event("linger", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "linger for " . round($lingerHours, 1) . " hour(s);");
    //                          }
    //                      }
                        }
                        */
                    }
                }
            }

            if ($remainingSegmentMeters <= 0) {
                $eleDelta = $it->nextSegment()->ele - $lastEle;

                if ($eleDelta > 0) {
                    $dayGain += $eleDelta;
                } else {
                    $dayLoss += -$eleDelta;
                }

                if (isset($debug)) {
                    echo "Ended segment. Segment Meters = ", $segmentMeters, "\n\n";
                }

                break;
            } else {
                if (isset($debug)) {
                    echo "Continuing segment. Segment Meters = ", $segmentMeters, " Meters Remaining = ", $remainingSegmentMeters, "\n\n";
                }
            }
        } else {
            //$found = false;

//          if ($trailConditionType != 2)
//          {
//              echo "trailConditionType = $trailConditionType\n";
//          }
            /*
            for ($i = 0; isset($noCamping) && $i < count($noCamping); $i++)
            {
                //echo "no camping start " . $noCamping[i][0] . " stop ". $noCamping
                if (($segmentMeters + $dayMetersRemaining) > $noCamping[$i][0] && ($segmentMeters + $dayMetersRemaining) < $noCamping[$i][1])
                {
                    //echo "Day $d inside no camping area: " . ($segmentMeters + $dayMetersRemaining) . ": " . $noCamping[$i][0] . ", " . $noCamping[$i][1] . "\n";

                    //
                    // We are in a no camping area... need to move.
                    //
                    $remainingMeters = $noCamping[$i][1] - ($segmentMeters + $dayMetersRemaining);
                    $hoursNeeded = $remainingMeters / $currentMetersPerHour;

                    //echo "needed hours: $hoursNeeded\n";

                    $startDay1 = StrategyEndLater (1, $day, $d, $hoursNeeded);

                    if ($startDay1 == -1)
                    {
                        $startDay1 = $d;
                    }

                    if ($hoursNeeded > 0)
                    {
                        $startDay2 = StrategyStartEarlier (1, $day, $d, $hoursNeeded);

                        if ($startDay2 == -1)
                        {
                            $startDay2 = $d;
                        }

                        $startDay1 = min($startDay1, $startDay2);
                    }

                    $d = $startDay1;

                    $restart = true;

                    return;

                    //                      $dayMeters += $remainingMeters;
                    //                      $segmentMeters += $remainingMeters;
                    //                      DayGet ($d)->endTime += $remainingHours;

                    //                      echo "Changed end time for $d to ", DayGet ($d)->endTime, "\n";

                    //                      echo "Changed to $dayMeters, $segmentMeters\n";

                    //                      $found = true;

                    //                      break;
                }
            }
            */

            $hoursHiked = DayGet($d)->endTime - $currentTime;
            $metersHiked = $hoursHiked * $currentMetersPerHour;

            $segmentMeters += $metersHiked;

            DayGet($d)->hoursHiked += $hoursHiked;

            $dayHours += $hoursHiked;
            $dayMeters += $metersHiked;
            $currentTime = DayGet($d)->startTime + $dayHours;

            // We ended the day between the start and end of the current segment.
            // Determine where in the segment we ended and compute current elevation and
            // lat/lng.

            $segmentPercent = $segmentMeters / $it->segmentLength();

            //              echo "segmentPercent = $segmentPercent\n";
            //              echo "segmentMeters = $segmentMeters\n";
            //              echo "segment start = ", $segment->dist, "\n";
            //              echo "segment end = ", $nextSegment->dist, "\n";
            //              echo "numerator = ", ($segmentMeters - $segment->dist), "\n";
            //              echo "denominator = ", ($nextSegment->dist - $segment->dist), "\n";

            $currentEle = $it->elevationChange() * $segmentPercent + $it->current()->ele;

            $eleDelta = $currentEle - $lastEle;

            if ($eleDelta > 0) {
                $dayGain += $eleDelta;
            } else {
                $dayLoss += -$eleDelta;
            }

            $lastEle = $currentEle;

            //todo: This is just a linear computation of lat/lng given the distance. Change this to
            // use a geodesic computation.
            $lat = ($it->nextSegment()->lat - $it->current()->lat) * $segmentPercent + $it->current()->lat;
            $lng = ($it->nextSegment()->lng - $it->current()->lng) * $segmentPercent + $it->current()->lng;

            dayEnd($d, $dayMeters, $dayGain, $dayLoss, $currentTime);
            dayStart($d, $dayMeters, $dayHours, $lat, $lng, $currentEle, $dayGain, $dayLoss, $it->key(), $segmentMeters);

//          echo "Day $d, segment meters: " . DayGet ($d)->segmentMeters . "\n";
            //              echo "day $d start meters = " . DayGet ($d)->meters . "\n";
        }

        //echo "Meters = $meters\n";
    }
}


function traverseSegments($it)
{
    global $d, $day, $dayHours, $dayMeters, $dayLoss, $dayGain;
    global $foodStart, $maxZ, $debug;
    global $currentTime;

    $restart = false;

    $z = 0;

    foreach ($it as $segment) {
        if (!$it->nextValid()) {
            break;
        }

        if (isset($debug)) {
            echo "Segment Length = ", $it->segmentLength(), "\n";
        }

        // If the segment has some length to it then traverse. If it is zero (or less)
        // then just skip it.
        if ($it->segmentLength() > 0) {
            if ($restart) {
                if (isset($debug)) {
                    echo "Restarting at day $d\n";
                }

                $segmentMeters = DayGet($d)->segmentMeters;
                $lastEle = DayGet($d)->ele;
                $dayMeters = 0;
                $dayHours = 0;
                $restart = false;
            } else {
                $segmentMeters = 0;
                $lastEle = $segment->ele;
            }

            traverseSegment($it, $z, $segmentMeters, $lastEle, $restart);

            if ($restart) {
                $it->position(DayGet($d)->segment - 1); // decrease by one since the for loop will increase it by one
            }

            if (isset($maxZ) && $z > $maxZ) {
                if (isset($debug)) {
                    echo "exited outer loop after $z iterations\n";
                }

                break;
            }
        }
    }

    dayEnd($d, $dayMeters, $dayGain, $dayLoss, $currentTime);

    $day[$d]->endLat = $segment->lat;
    $day[$d]->endLng = $segment->lng;
    $day[$d]->endEle = $segment->ele;
    $day[$d]->endMeters = $day[$d]->meters + $dayMeters;
}

function storeSchedule($schedule)
{
    global $userHikeId;

    $fileName = getHikeFolder($userHikeId) . "schedule.json";

    file_put_contents($fileName, json_encode($schedule));
}


function getSchedule($userId, &$points)
{
    global $userHikeId;
    global $d, $day;
    global $dayMeters, $dayHours, $dayGain, $dayLoss;
    global $foodStart;
    global $debug;
    global $hikerProfiles;
    global $trailConditions;
    global $food;
    
    $hikerProfiles = hikerProfilesGet($userId, $userHikeId);
    $food = foodPlansGet($userId);
    pointsOfInterestGet($userId, $userHikeId, $points);
    $trailConditions = trailConditionsGet($userHikeId, $points);

    $d = -1;
    $day = [];

    $dayMeters = 0;
    $dayHours = 0;
    $dayGain = 0;
    $dayLoss = 0;

    dayStart($d, $dayMeters, $dayHours, $points[0]->lat, $points[0]->lng, $points[0]->ele, $dayGain, $dayLoss, 0, 0);

    $foodStart = $d;

    if (isset($debug)) {
        echo "Total Segments: ", count($points), "\n";
    }

    $it = new SegmentIterator($points, 1);

    traverseSegments($it);

    computeFoodWeight($day, $d, $foodStart);

    storeSchedule($day);

    return $day;
}