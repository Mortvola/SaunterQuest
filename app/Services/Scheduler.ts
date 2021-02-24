import RoutePoint from 'App/Models/RoutePoint';
import User from 'App/Models/User';
import Day from 'App/Models/Day';
import HikerProfile from 'App/Models/HikerProfile';
import Point from 'App/Types/Point';
import RouteIterator from 'App/Types/RouteIterator';

class Scheduler {
  currentDay = -1;

  activeHikerProfile: any = null;

  days: Day[] = [];

  user: User | null = null;

  trailConditions: any = null;

  hikerProfiles: any = null;

  public createSchedule(routePoints: RoutePoint[], user: User, profiles: HikerProfile[]) : void {
    this.hikerProfiles = profiles;
    this.user = user;
    if (routePoints && routePoints.length > 0 && routePoints[0].trail !== null) {
      this.dayStart(routePoints[0].trail[0]);
      this.traverseRoute(routePoints);
    }
  }

  private dayStart(point: Point, camp: any | null = null, startTime: number | null = null) {
    this.nextDay();

    this.activeHikerProfile = this.activeHikerProfileGet();

    this.currentDayGet().initialize(
      this.activeHikerProfile, point,
      this.previousDayTotalMetersGet(), camp, startTime,
    );
  }

  private nextDay() {
    this.currentDay += 1;
  }

  private activeHikerProfileGet() {
    if (this.user === null) {
      throw (new Error('User is null'));
    }

    const hikerProfile = {
      speedFactor: this.user.paceFactor,
      startTime: this.user.startTime * 60,
      endTime: this.user.endTime * 60,
      breakDuration: this.user.breakDuration,
    };

    if (this.hikerProfiles !== undefined) {
      this.hikerProfiles.forEach((profile) => {
        if (
          (profile.startDay === undefined || this.currentDay >= profile.startDay)
          && (!profile.endDay === undefined || this.currentDay <= profile.endDay)
        ) {
          if (profile.speedFactor !== undefined) {
            hikerProfile.speedFactor = profile.speedFactor;
          }

          if (profile.startTime !== undefined) {
            hikerProfile.startTime = profile.startTime * 60;
          }

          if (profile.endTime !== undefined) {
            hikerProfile.endTime = profile.endTime * 60;
          }

          if (profile.breakDuration !== undefined) {
            hikerProfile.breakDuration = profile.breakDuration;
          }
        }
      });
    }

    return hikerProfile;
  }

  private currentDayGet() {
    return this.dayGet(this.currentDay);
  }

  public dayGet(d: number) : Day {
    if (this.days[d] === undefined) {
      this.days[d] = new Day();
    }

    return this.days[d];
  }

  public previousDayTotalMetersGet() : number {
    if (this.days[this.currentDay - 1] !== undefined) {
      return this.days[this.currentDay - 1].totalMetersGet();
    }

    return 0;
  }

  private static segmentLength(point1: Point, point2: Point) {
    return point2.dist - point1.dist;
  }

  private currentDayIndexGet() {
    return this.currentDay;
  }

  private currentDaySet(day: number) {
    if (day < this.currentDay) {
      this.days.splice(day + 1);
    }

    this.currentDay = day;
  }

  private currentDayDelete() {
    this.currentDaySet(this.currentDayIndexGet() - 1);
  }

  private traverseRoute(route: RoutePoint[]) {
    if (this.user === null) {
      throw (new Error('User is null'));
    }

    let restart = false;
    let prevPoint: Point | null = null;
    let point: Point | null = null;
    const routeIterator = RouteIterator(route);

    // eslint-disable-next-line no-restricted-syntax
    for (point of routeIterator) {
      if (prevPoint !== null) {
        const segmentLength = Scheduler.segmentLength(prevPoint, point);
        // if (isset($debug))
        // {
        //     echo "Segment Length = ", segmentLength($prevSegment, $segment), "\n";
        // }

        // If the segment has some length to it then traverse. If it is zero (or
        // less)
        // then just skip it.
        if (segmentLength > 0) {
          // if ($restart) {
          //   if (isset($debug)) {
          //       echo "Restarting at day $d\n";
          //   }

          //   $segmentMeters = this.currentDayGet()->segmentMeters;
          //   $lastEle = this.currentDayGet()->point->ele;
          //   this.currentDayGet()->reset();
          //   $restart = false;
          // }
          // else {
          let segmentMeters = 0;
          const lastEle = prevPoint.ele;
          // }

          [restart, segmentMeters] = this.traverseSegment(
            prevPoint, point, segmentMeters, lastEle, null,
          );

          if (restart) {
            // decrease by one since the for loop will increase it by one
            // $it->position(this.currentDayGet()->segment - 1);
          }

          // if (isset($maxZ) && $z > $maxZ) {
          //   if (isset($debug)) {
          //     echo "exited outer loop after $z iterations\n";
          //   }

          //   break;
          // }
        }
      }

      prevPoint = point;
    }

    let day = this.currentDayGet();

    const elapsedTime = day.elapsedTimeGet();

    // If the day didn't start with an explicit camp and
    // we are within the max time limit to extend the day to
    // reach the end then delete today and
    // add today's elapsed time to the previous day.
    // TODO: This does't take into account any change in hiker profiles
    const dayExtension = this.user.endHikeDayExtension;

    if (
      dayExtension !== undefined
      && dayExtension !== null
      && elapsedTime <= dayExtension
      && (day.camp === undefined || day.camp === null)
      && this.currentDay > 0
    ) {
      this.currentDayDelete();
      day = this.currentDayGet();
      day.timeAdd(elapsedTime);
    }

    day.end();

    if (point !== null) {
      day.endLat = point.lat;
      day.endLng = point.lng;
      day.endEle = point.ele;
    }

    day.endMeters = day.totalMetersGet();
  }

  private static elevationChange(point1: Point, point2: Point) {
    if (point1.ele === undefined || point2.ele === undefined) {
      return 0;
    }

    return point2.ele - point1.ele;
  }

  private static metersPerHourGet(dh: number, dx: number) {
    // This formula was defined by Tobler
    // On flat ground the formula works out to about 5 km/h.
    let metersPerHour = 6 * 2.71828 ** (-3.5 * Math.abs(dh / dx + 0.05)) * 1000;

    // Make sure the minimum speede is 1/2 kilometer per hour.
    // Sometimes elevation data is wrong and it may look like one is
    // climbing up an extremely steep cliff.
    if (metersPerHour < 500) {
      metersPerHour = 500;
    }

    return metersPerHour;
  }

  private activeTrailConditionsGet(segmentIndex, segmentPercentage) {
    let speedFactor = 1.0;
    let type = 2; // 'other'

    if (this.trailConditions !== null && this.trailConditions !== undefined) {
      this.trailConditions.forEach((tc) => {
        if ((tc.startSegment.segment < segmentIndex
          || (tc.startSegment.segment === segmentIndex
            && tc.startSegment.percentage <= segmentPercentage))
            && (tc.endSegment.segment > segmentIndex
            || (tc.endSegment.segment === segmentIndex
              && tc.endSegment.percentage > segmentPercentage))) {
          // echo "Active trail condition: start segment: ",
          // tc.startSegment->segment, ", end segment: ",
          // tc.endSegment->segment, "\n";
          speedFactor *= tc.speedFactor / 100.0;

          // If the type of the trail condition is a lower number (more
          // signficant) then
          // change to it instead of the current type.
          // Current defined types are: 0=no camping, 1=no stealth camping, 2=
          // other
          if (tc.type < type) {
            type = tc.type;
          }
        }
      });
    }

    return [
      speedFactor,
      type,
    ];
  }

  private static processEvents() {
    // if (isset($it->nextSegment()->events) &&
    // count($it->nextSegment()->events) > 0)
    // if (isset(events) && count(events) > 0) {
    //     // echo "events[0] = ", var_dump($events[0]), "\n";

    //     // echo "events available at segment ", $k + 1, "\n";
    //     // var_dump($nextSegment->events);

    //     // todo: sort the events
    //     foreach ($events as $event) {
    //         // echo "key = ", $it->key (), " event type = ",
    //         // $event->type, " segment meters = ", $segmentMeters, "
    //         // remaining meters = ", $remainingSegmentMeters, "\n";

    //         // $event = findEvent("arriveBefore", $events);

    //         if ($event->type == "trailCondition")
    //         {
    //             // echo "before: $trailConditionsSpeedFactor\n";

    //             [trailConditionsSpeedFactor, trailConditionType] = this.activeTrailConditionsGet(
    //               /*$it->key()*/ 0, segmentMeters / Scheduler.segmentLength(point1, point2));

    //             // echo "after: $trailConditionsSpeedFactor\n";
    //         }
    //         elseif ($event->type == "arriveBefore" && $event->enabled)
    //         {
    //             $arriveBeforeTime = $event->time;

    //             // echo "arrival restriction on day $d, currentTime =
    //             // $currentTime, requiredTime = $arriveBeforeTime\n";

    //             if ($currentTime > $arriveBeforeTime)
    //             {
    //                 $hoursNeeded = $currentTime - $arriveBeforeTime;

    //                 // extend the end time of each prior day an hour
    //                 // until the needed time is found and recompute
    //                 // distance.
    //                 // todo: this needs to be a preference. The
    //                 // algorithm could add an hour to each
    //                 // prior day until the extra time needed is found or
    //                 // it could evenly divide the needed time
    //                 // across all days since the start, or a mix of the
    //                 // two.

    //                 list ($startDay1, $hoursNeeded)
    //                    = StrategyEndLater(1, $schedule, $hoursNeeded);

    //                 if ($startDay1 == -1)
    //                 {
    //                     $startDay1 = this.currentDayIndexGet();
    //                 }

    //                 if ($hoursNeeded > 0)
    //                 {
    //                     list ($startDay2, $hoursNeeded)
    //                        = StrategyStartEarlier(1, $schedule, $hoursNeeded);

    //                     if ($startDay2 == -1)
    //                     {
    //                         $startDay2 = this.currentDayIndexGet();
    //                     }

    //                     $startDay1 = min($startDay1, $startDay2);
    //                 }

    //                 if ($hoursNeeded > 0)
    //                 {
    //                     $event->enabled = false;
    //                 }

    //                 this.currentDaySet($startDay1);

    //                 $restart = true;

    //                 return;
    //             }

    //             this.currentDayGet()->events[]
    //                = new Event("arriveBefore", $event->poiId, $event->lat,
    //                    $event->lng, $segmentMeters, $currentTime,
    //                    "Arrive Before: " . $arriveBeforeTime .
    //                    ", arrived at " . $currentTime . ";");
    //         }
    //         elseif ($event->type == "resupply" && $event->enabled)
    //         {
    //             if (isset($event->segments) && count($event->segments) > 0)
    //             {
    //                 // echo "Following segments to resupply. dayMeters =
    //                 // $dayMeters\n";
    //                 $pathIt = new SegmentIterator($event->segments, 1);
    //                 traverseSegments($pathIt, $schedule);
    //                 // echo "Reversing direction. dayMeters =
    //                 // $dayMeters\n";
    //                 $pathIt = new SegmentIterator($event->segments, -1);
    //                 traverseSegments($pathIt, $schedule);
    //                 // echo "Returned from following segments to
    //                 // resupply. dayMeters = $dayMeters\n";
    //             }

    //             $foodStart = computeFoodWeight($schedule, $foodStart);

    //             if ($event)
    //             {
    //                 this.currentDayGet()->events[]
    //                    = new Event("resupply", $event->poiId,
    //                     $event->lat, $event->lng, $event->shippingLocationId,
    //                     $segmentMeters, $currentTime, "");
    //             }
    //         }
    //         elseif ($event->type == "stop" && $event->enabled)
    //         {
    //             // todo: error out if a mustStop is in a noCamping area?

    //             this.currentDayGet()->events[]
    //                = new Event("stop", $event->poiId, $event->lat,
    //                  $event->lng, $segmentMeters, $currentTime, "");

    //             // todo: Determine what to do here. If we are
    //             // mid-segment then it seems we should just initialize
    //             // the new day. Otherwise, return back to the caller?

    //             // if ($nextSegmentIndex < count($segments) - 1)
    //             // {
    //             // this.currentDayGet()->end ($dayMeters,
    //             // $dayGain, $dayLoss);
    //             // dayStart ($nextSegment, $dayGain, $dayLoss,
    //             // $nextSegmentIndex, $segmentMeters);

    //             // this.currentDayGet ()->cantMoveStartMeters =
    //             // true;
    //             // }
    //         }
    //         elseif ($event->type == "linger" && $event->enabled)
    //         {
    //             // todo: determine what it means to linger when already
    //             // stopped.

    //             // echo "linger time = ", $event->time, "\n";

    //             $lingerHours = $event->time / 60;
    //             this.currentDayGet()->timeAdd($lingerHours);
    //             $currentTime = this.currentDayGet().currentTimeGet();
    //             // echo "Current Time = ", $currentTime, "\n";

    //             /*
    //               * $remainingHours = max(($hoursPerDay - $hoursHiked) -
    //               * $lingerHours, 0);
    //               *
    //               * // echo "linger: hours hiked: $hoursHiked\n";
    //               * // echo "linger: delta meters:
    //               * $remainingSegmentMeters\n";
    //               * // echo "linger: meters: $meters\n";
    //               * // echo "linger: segment meters: $segmentMeters\n";
    //               * // echo "linger: next segment meters: ",
    //               * $nextSegment->dist, "\n";
    //               * // echo "linger: remaining hours: $remainingHours\n";
    //               *
    //               * if ($remainingHours > 0)
    //               * {
    //               * this.currentDayGet ()->events[] = new
    //               * Event("linger", $event->poiId, $event->lat,
    //               * $event->lng, null, $segmentMeters, $currentTime,
    //               * "linger for " . $lingerHours . " hour(s);");
    //               * }
    //               * else
    //               * {
    //               * this.currentDayGet ()->events[] = new
    //               * Event("linger", $event->poiId, $event->lat,
    //               * $event->lng, null, $segmentMeters, $currentTime,
    //               * "linger for " . round ($lingerHours +
    //               * $remainingHours, 1) . " hour(s);");
    //               *
    //               * // todo: Determine what to do here. If we are
    //               * mid-segment then we should record the day. Otherwise,
    //               * return back to the caller?
    //               * // if ($nextSegmentIndex < count($segments) - 1)
    //               * // {
    //               * // this.currentDayGet()->end ($dayMeters,
    //               * $dayGain, $dayLoss);
    //               * // dayStart ($nextSegment, $dayGain, $dayLoss,
    //               * $nextSegmentIndex, $segmentMeters);
    //               *
    //               * // $lingerHours = -$remainingHours;
    //               *
    //               * // if ($lingerHours)
    //               * // {
    //               * // this.currentDayGet ()->events[] = new
    //               * Event("linger", $event->poiId, $event->lat,
    //               * $event->lng, $segmentMeters, $currentTime, "linger
    //               * for " . round($lingerHours, 1) . " hour(s);");
    //               * // }
    //               * // }
    //               * }
    //               */
    //         }
    //     }
    // }
  }

  private applyTimeConstraints(point1: Point, timeConstraints: any) {
    if (timeConstraints !== null && timeConstraints !== undefined && timeConstraints.length > 0) {
      const camps = timeConstraints.where('type', 'camp').get();

      camps.some((camp: any) => {
        if (camp.time !== 0) {
          let startTime = null;
          const startTimes = timeConstraints().where('type', 'startTime').get();

          if (startTimes && startTimes.length > 0) {
            startTime = startTimes[0].time;
          }

          this.currentDayGet().end();
          this.dayStart({
            lat: point1.lat,
            lng: point1.lng,
            ele: point1.ele,
            dist: 0,
          }, camp.waypoint, startTime);

          return true;
        }

        return false;
      });

      const delays = timeConstraints.where('type', 'delay').get();

      delays.forEach((delay: any) => {
        if (delay.time !== null) {
          this.currentDayGet().timeAdd(delay.time);
        }
      });
    }
  }

  private traverseSegment(
    point1: Point,
    point2: Point,
    initialSegmentMeters: number,
    initialEle: number,
    timeConstraints: any | null,
  ): [boolean, number] {
    let segmentMeters = initialSegmentMeters;
    let lastEle = initialEle;
    const restart = false;
    const metersPerMinute = Scheduler.metersPerHourGet(
      Scheduler.elevationChange(point1, point2),
      Scheduler.segmentLength(point1, point2),
    ) / 60.0;

    // todo: do we need to call this per segment or should the results just be
    // global and only call this
    // when reaching a new trail condition point or if starting the segment
    // mid-segment?
    const [trailConditionsSpeedFactor] = this.activeTrailConditionsGet(
      /* it.key() */ 0, segmentMeters / Scheduler.segmentLength(point1, point2),
    );

    const currentMetersPerMinute = metersPerMinute * trailConditionsSpeedFactor
      * (this.activeHikerProfile.speedFactor / 100.0);
    let metersToEndOfSegment = Scheduler.segmentLength(point1, point2) - segmentMeters;
    let minutesToEndOfSegment = metersToEndOfSegment / currentMetersPerMinute;

    this.applyTimeConstraints(point1, timeConstraints);

    for (;;) {
      let currentTime = this.currentDayGet().currentTimeGet();

      // if (isset($debug))
      // {
      //     echo "Segment Meters: ", $segmentMeters, " current time: ", $currentTime,
      //      ", minutes remaining: ", this.currentDayGet()->endTime - $currentTime,
      //      ", Minutes to end of segmetn: ", $minutesToEndOfSegment, "\n";
      // }

      // If we hike until the next event, will we hike through our afternoon
      // break?
      // If so, hike until it is time, take the break and continue.
      if (currentTime < 12 * 60 && currentTime + minutesToEndOfSegment > 12 * 60) {
        // Hike until the afternoon rest time, make adjustments to
        // currentTime
        // and remaining distance for this segment.

        const minutesHiked = 12 * 60 - currentTime;
        const metersHiked = minutesHiked * currentMetersPerMinute;

        segmentMeters += metersHiked;

        this.currentDayGet().timeAdd(minutesHiked + this.activeHikerProfile.breakDuration);
        this.currentDayGet().metersAdd(metersHiked);
        currentTime = this.currentDayGet().currentTimeGet();

        metersToEndOfSegment -= metersHiked;
        minutesToEndOfSegment -= minutesHiked;
      }
      else if (
        currentTime >= 12 * 60 && currentTime
        < 12 * 60 + this.activeHikerProfile.breakDuration
      ) {
        // It is after noon but before 1pm
        this.currentDayGet().timeAdd(12 * 60 + this.activeHikerProfile.breakDuration - currentTime);
        currentTime = this.currentDayGet().currentTimeGet();
      }

      // Is there enough time remaining to hike to the end of the segment? If so,
      // process the events
      // at that point. If not, then camp.

      const { endTime } = this.currentDayGet();
      if (endTime === null) {
        throw (new Error('endTime is null'));
      }

      if (currentTime + minutesToEndOfSegment < endTime) {
        // There is enough time remaining to hike to the next event...

        segmentMeters += metersToEndOfSegment;
        const remainingSegmentMeters = Math.max(
          Scheduler.segmentLength(point1, point2) - segmentMeters, 0,
        );

        this.currentDayGet().timeAdd(minutesToEndOfSegment);
        this.currentDayGet().metersAdd(metersToEndOfSegment);
        currentTime = this.currentDayGet().currentTimeGet();

        // Process any events at this point
        Scheduler.processEvents();

        if (remainingSegmentMeters <= 0) {
          const eleDelta = point2.ele - lastEle;

          this.currentDayGet().updateGainLoss(eleDelta);

          // if (isset($debug))
          // {
          //     echo "Ended segment. Segment Meters = ", $segmentMeters, "\n\n";
          // }

          break;
        }

        // if (isset($debug))
        // {
        //     echo "Continuing segment. Segment Meters = ", $segmentMeters,
        //        " Meters Remaining = ", $remainingSegmentMeters, "\n\n";
        // }
      }
      else {
        // Hike the remaining time of the day, if any.
        if (currentTime < endTime) {
          const minutesHiked = endTime - currentTime;
          const metersHiked = minutesHiked * currentMetersPerMinute;

          segmentMeters += metersHiked;

          this.currentDayGet().timeAdd(minutesHiked);
          this.currentDayGet().metersAdd(metersHiked);
          currentTime = this.currentDayGet().currentTimeGet();
        }

        // We ended the day between the start and end of the current
        // segment.
        // Determine where in the segment we ended and compute current
        // elevation and
        // lat/lng.

        const segmentPercent = segmentMeters / Scheduler.segmentLength(point1, point2);

        // echo "segmentPercent = $segmentPercent\n";
        // echo "segmentMeters = $segmentMeters\n";
        // echo "segment start = ", $segment->dist, "\n";
        // echo "segment end = ", $nextSegment->dist, "\n";
        // echo "numerator = ", ($segmentMeters - $segment->dist), "\n";
        // echo "denominator = ", ($nextSegment->dist - $segment->dist),
        // "\n";

        const currentEle = Scheduler.elevationChange(point1, point2) * segmentPercent + point1.ele;

        const eleDelta = currentEle - lastEle;

        this.currentDayGet().updateGainLoss(eleDelta);

        lastEle = currentEle;

        // todo: This is just a linear computation of lat/lng given the
        // distance. Change this to
        // use a geodesic computation.
        const lat = (point2.lat - point1.lat) * segmentPercent + point1.lat;
        const lng = (point2.lng - point1.lng) * segmentPercent + point1.lng;

        this.currentDayGet().end();

        this.dayStart({
          lat,
          lng,
          ele: currentEle,
          dist: 0,
        });

        // echo "Day $d, segment meters: " . currentDayGet ()->segmentMeters
        // . "\n";
        // echo "day $d start meters = " . currentDayGet ()->meters . "\n";
      }
      // echo "Meters = $meters\n";
    }

    return [restart, segmentMeters];
  }
}

export default Scheduler;
