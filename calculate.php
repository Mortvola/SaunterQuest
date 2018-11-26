<?php 

require_once "checkLogin.php";

$userId = $_SESSION["userId"];
$userHikeId = $_GET["id"];
//	$userId = 1;
//	$userHikeId = 100027;
	
	// Include config file
	require_once "config.php";
	require_once "coordinates.php";
	
	class Event
	{
		function __construct ($type, $poiId, $lat, $lng, $meters, $time, $notes)
		{
			$this->type = $type;
			$this->poiId = $poiId;
			$this->lat = $lat;
			$this->lng = $lng;
			$this->meters = $meters;
			$this->time = $time;
			$this->notes = $notes;
		}
		
		public $type;
		public $meters;
		public $lat;
		public $lng;
		public $time;
		public $notes;
	}
	
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
		public $notes;
		public $segment = 0;
		public $segmentMeters = 0;
		public $cantMoveStartMeters = false;
		public $events = [];
		
		//
		// Initialize the day
		//
		function dayInitialize ($d, $lat, $lng, $ele, &$dayMeters, $k, $segmentMeters)
		{
			global $food, $hikerProfile, $debug, $day;
			
			if ($d > 0)
			{
				$this->meters = $day[$d - 1]->meters + $dayMeters;
			}
			else
			{
				$this->meters = $dayMeters;
			}
			
			$this->foodPlanId = $food[0]["dayTemplateId"];
			$this->foodWeight = $food[0]["weight"]; //todo: randomly select meal plan
			
			if ($this->notes == null)
			{
				$this->notes = "";
			}
			
			if ($this->startTime == null)
			{
				$this->startTime = $hikerProfile["startTime"];
			}
			
			if ($this->endTime == null)
			{
				$this->endTime = $hikerProfile["endTime"];
			}
			
			$this->lat = $lat;
			$this->lng = $lng;
			$this->ele = $ele;
			
			$this->segment = $k;
			$this->segmentMeters = $segmentMeters;
			
			//unset($this->events);
			$this->events = [];
			
			if (isset($debug))
			{
				echo "Initializing Day $d, meters: $this->meters, segment: $k, segment meters: $segmentMeters\n";
			}
		}
	}
	
	function newDayStart (&$d, &$dayMeters, &$dayHours, $lat, $lng, $ele, &$dayGain, &$dayLoss, $k, $segmentMeters)
	{
		global $segments;
		
		DayGet ($d)->gain = $dayGain;
		DayGet ($d)->loss = $dayLoss;
		DayGet ($d)->distance = $dayMeters;
		
		$d++;
		DayGet ($d)->dayInitialize ($d, $lat, $lng, $ele, $dayMeters, $k, $segmentMeters);
		
		$dayMeters = 0;
		$dayHours = 0;
		$dayGain = 0;
		$dayLoss = 0;
		
		activeHikerProfileGet ($d);
	}
	
	
	//
	// Compute the weight of food over a period of days
	//
	function computeFoodWeight (&$day, $d, &$foodStart)
	{
//		echo "d = $d, foodStart = $foodStart\n";
		$accum = 0;
		for ($i = $d; $i >= $foodStart; $i--)
		{
//			echo $i, ": ";
			$accum += $day[$i]->foodWeight;
//			echo $day[$i]->foodWeight, ", ";
			$day[$i]->accumWeight = $accum;
//			echo $day[$i]->accumWeight, "\n";
		}
		
		$foodStart = $d + 1;
	}
	
	function StrategyEndLater ($timeShift, &$day, $d, &$hoursNeeded)
	{
		global $hikerProfile;
		
		$earliestChangedDay = -1;
		
		// Try extending the end hours for the past days
		for (; $d > 0; $d--)
		{
			$amountToShift = $hikerProfile["endTime"] + $timeShift - $day[$d]->endTime;
			
			if ($amountToShift > 0)
			{
				$day[$d]->endTime += $amountToShift;
				$hoursNeeded -= $amountToShift;
				
				$day[$d]->notes = "changed end time to " . $day[$d]->endTime . ";";
				//echo "Day $d, end time ", $day[$d]->endTime, "\n";
				
				$earliestChangedDay = $d;
				
				if ($hoursNeeded <= 0)
				{
					break;
				}
			}
			else
			{
				//echo "Day $d, could not move end time\n";
			}

			//
			// If the start of this day can't be moved then look no earlier
			//
			if ($day[$d]->cantMoveStartMeters)
			{
				break;
			}
		}
		
		return $earliestChangedDay;
	}
	
	
	function StrategyStartEarlier ($timeShift, &$day, $d, &$hoursNeeded)
	{
		global $hikerProfile;
		
		$earliestChangedDay = -1;
		
		//
		// Try starting earlier for the past days
		//
		for (; $d > 0; $d--)
		{
			$amountToShift = $day[$d]->startTime - ($hikerProfile["startTime"] - $timeShift);
			
			if ($amountToShift > 0)
			{
				$day[$d]->startTime -= $amountToShift;
				$hoursNeeded -= $amountToShift;
				
				$day[$d]->notes = "changed start time to " . $day[$d]->startTime . ";";
				//echo "Day $d, start time ", $day[$d]->startTime, "\n";
				
				$earliestChangedDay = $d;
				
				if ($hoursNeeded <= 0)
				{
					break;
				}
			}
			else
			{
				//echo "Day $d, could not move start time\n";
			}
			
			//
			// If the start of this day can't be moved then look no earlier
			//
			if ($day[$d]->cantMoveStartMeters)
			{
				break;
			}
		}
		
		return $earliestChangedDay;
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
	
	function DayGet ($d)
	{
		global $day, $debug;
		
		if (!isset($day[$d]))
		{
			if (isset($debug))
			{
				echo "Creating day $d\n";
			}
			
			$day[$d] = new Day();
		}
		
		return $day[$d];
	}

	function pointsOfInterestGet ($userId, $userHikeId)
	{
		global $pdo, $segments;
		
		$sql = "select poi.pointOfInterestId, poi.lat, poi.lng, poic.type, poic.time
				from pointOfInterest poi
				join pointOfInterestConstraint poic on poic.pointOfInterestId = poi.pointOfInterestId
				join userHike uh on uh.userHikeId = poi.userHikeId and uh.userId = :userId and uh.userHikeId = :userHikeId
				order by poi.lat, poi.lng asc";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			
			$paramUserId = $userId;
			$paramUserHikeId = $userHikeId;
			
			$stmt->execute ();
			
			$output = $stmt->fetchAll (PDO::FETCH_ASSOC);

			$s = -1;

			//
			// Find the segment that is nearest to this POI.
			//
			foreach ($output as $poi)
			{
				//var_dump ($poi);
				
				if ($s == -1 || ($segments[$s]->lat != $poi["lat"] && $segments[$s]->lng != $poi["lng"]))
				{
					$s = nearestSegmentFind ($poi["lat"], $poi["lng"], $segments);
				}

				if ($s != -1)
				{
//					echo "Found segment $s\n";
					$segments[$s]->events[] = (object)["poiId" => $poi["pointOfInterestId"], "type" => $poi["type"], "lat" => $poi["lat"], "lng" => $poi["lng"], "time" => $poi["time"], "enabled" => true];
				}
			}

			//var_dump ($segments);
			
			unset($stmt);
		}
	}
	
	function hikerProfilesGet ($userId, $userHikeId)
	{
		global $pdo, $hikerProfiles;
		
		$sql = "select percentage,
					startDay, endDay,
					startTime, endTime, breakDuration
				from hikerProfile
				where userId = :userId
				and userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			
			$paramUserId = $userId;
			$paramUserHikeId = $userHikeId;
			
			$stmt->execute ();
			
			$hikerProfiles = $stmt->fetchAll (PDO::FETCH_ASSOC);
			
			unset ($stmt);
		}
	}
	
	function activeHikerProfileGet ($d)
	{
		global $hikerProfile, $hikerProfiles;
		
		$hikerProfile["percentage"] = 100;
		$hikerProfile["startTime"] = 8;
		$hikerProfile["endTime"] = 19;
		$hikerProfile["breakDuration"] = 1;
		
		foreach ($hikerProfiles as $profile)
		{
			if ((!isset($profile["startDay"]) || $d >= $profile["startDay"])
			 && (!isset($profile["endDay"]) || $d <= $profile["endDay"]))
			{
				if (isset($profile["percentage"]))
				{
					$hikerProfile["percentage"] = $profile["percentage"];
				}
				
				if (isset($profile["startTime"]))
				{
					$hikerProfile["startTime"] = $profile["startTime"];
				}
				
				if (isset($profile["endTime"]))
				{
					$hikerProfile["endTime"] = $profile["endTime"];
				}
				
				if (isset($profile["breakDuration"]))
				{
					$hikerProfile["breakDuration"] = $profile["breakDuration"];
				}
			}
		}
		
		//echo "hikerProfile['percentage'] = ", $hikerProfile['percentage'], "\n";
	}
	
	function foodPlansGet ($userId)
	{
		global $pdo, $food;
		
		$sql = "select dt.dayTemplateId, dt.name, sum(fiss.grams * dtfi.numberOfServings) as weight
				from dayTemplateFoodItem dtfi
				join foodItemServingSize fiss on fiss.foodItemId = dtfi.foodItemId
				join dayTemplate dt on dt.dayTemplateId = dtfi.dayTemplateId and userId = :userId
				group by dtfi.dayTemplateId, dt.name";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$paramUserId = $userId;
			
			$stmt->execute ();
			
			$food = $stmt->fetchAll (PDO::FETCH_ASSOC);
			
			unset($stmt);
		}
	}
	
	function metersPerHourGet ($dh, $dx)
	{
		return 6 * pow(2.71828, -3.5 * abs($dh / $dx + 0.05)) * 1000;
	}
	
	
//	$noCamping = array(
//					array (18.1, 28.9));
	
	$segments = [];
	$segments = json_decode(file_get_contents("CDT.json"));
		
	try
	{
		hikerProfilesGet ($userId, $userHikeId);
		
		foodPlansGet ($userId);
		
		pointsOfInterestGet ($userId, $userHikeId);
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
	
//	$debug = true;
//	$maxZ = 2000;
	$meters = 0;
	$d = 0;
	$foodStart = $d;
	$lingerHours = 0;
	$dayMeters = 0;
	$dayHours = 0;
	$dayGain = 0;
	$dayLoss = 0;
	$restart = false;
	
	$day = [];
	
	activeHikerProfileGet ($d);
	
	DayGet ($d)->dayInitialize ($d, $segments[0]->lat, $segments[0]->lng, $segments[0]->ele, $dayMeters, $dayHours, 0, 0);
	
	$z = 0;
	
	for ($k = 0; $k < count($segments) - 1; $k++)
	{
		if ($restart)
		{
			if (isset($debug))
			{
				echo "Restarting at day $d\n";
			}
			
			$segmentMeters = DayGet ($d)->segmentMeters;
			$lastEle = DayGet ($d)->ele;
			$dayMeters = 0;
			$dayHours = 0;
			$restart = false;
		}
		else
		{
			if ($k == 0)
			{
				DayGet ($d)->segment = $k;
				DayGet ($d)->segmentMeters = $segments[$k]->dist;
			}
			
			$segmentMeters = $segments[$k]->dist;
			$lastEle = $segments[$k]->ele;
		}
		
		$metersPerHour = metersPerHourGet ($segments[$k + 1]->ele - $segments[$k]->ele, $segments[$k + 1]->dist - $segments[$k]->dist);
		
		for (;;)
		{
			$z++;
			
			if (isset($maxZ) && $z > $maxZ)
			{
				if (isset($debug))
				{
					echo "exited inner loop after $z iterations\n";
				}
				break;
			}
			
			//echo "linger hours: $lingerHours\n";
			
			//echo "Day $d, segment meters: " . $segmentMeters . "\n";
			//echo "Day $d, segment meters: " . DayGet ($d)->segmentMeters . "\n";
			
			$hoursPerDay = ((DayGet ($d)->endTime - DayGet ($d)->startTime) - $hikerProfile["breakDuration"]);
			$hoursPerDay -= $lingerHours;
			$lingerHours = 0;
			
			$hoursRemaining = $hoursPerDay - $dayHours;
			$dayMetersRemaining = $hoursRemaining * ($metersPerHour * ($hikerProfile["percentage"] / 100.0));
			
// 			echo "Hours/Day = $hoursPerDay\n";
// 			echo "Day Hours = $dayHours\n";
// 			echo "Meters/hour = $metersPerHour\n";
// 			echo "Adjusted Meters/hour = ", ($metersPerHour * $hikerProfile["percentage"]), "\n";
// 			echo "Meters/day = $dayMetersRemaining\n";
			
			if ($segmentMeters + $dayMetersRemaining >= $segments[$k + 1]->dist)
			{
				if (isset($debug))
				{
					echo "Day $d, segment meters: $segmentMeters, hours remaining: $hoursRemaining, meters remaining: $dayMetersRemaining, meters/hour = $metersPerHour\n";
				}
				
				$remainingSegmentMeters = $segments[$k + 1]->dist - $segmentMeters;
				$segmentMeters = $segments[$k + 1]->dist;
				
				$dayMeters += $remainingSegmentMeters;
				$hoursHiked = $remainingSegmentMeters / ($metersPerHour * ($hikerProfile["percentage"] / 100.0));
				$dayHours += $hoursHiked;
				$currentTime = DayGet ($d)->startTime + $dayHours;
				
				$eleDelta = $segments[$k + 1]->ele - $lastEle;
				
				if ($eleDelta > 0)
				{
					$dayGain += $eleDelta;
				}
				else
				{
					$dayLoss += -$eleDelta;
				}
				
				if (isset($segments[$k + 1]->events) && count($segments[$k + 1]->events) > 0)
				{
//					echo "events available at segment ", $k + 1, "\n";
//					var_dump($segments[$k + 1]->events);
					
					$event = findEvent("arriveBefore", $segments[$k + 1]->events);
					
					if ($event)
					{
						$arriveBeforeTime = $event->time;
						
						if ($event->enabled)
						{
							//echo "arrival restriction on day $d, currentTime = $currentTime, requiredTime = $arriveBeforeTime\n";
							
							if ($currentTime > $arriveBeforeTime)
							{
								$hoursNeeded = $currentTime - $arriveBeforeTime;
								
								// extend the end time of each prior day an hour until the needed time is found and recompute distance.
								// todo: this needs to be a preference. The algorithm could add an hour to each
								// prior day until the extra time needed is found or it could evenly divide the needed time
								// across all days since the start, or a mix of the two.
								
								$startDay1 = StrategyEndLater (1, $day, $d - 1, $hoursNeeded);
								
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
		
								if ($hoursNeeded > 0)
								{
									$event->enabled = false;
								}
								
								$d = $startDay1;
								
								$k = DayGet ($d)->segment - 1; // decrease by one since the for loop will increase it by one
								//echo "segment meters: $segmentMeters\n";
								$restart = true;
								
								break;
							}
						}
						
						DayGet ($d)->events[] = new Event("arriveBefore", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "Arrive Before: " . $arriveBeforeTime . ", arrived at " . $currentTime . ";");
					}
					
					$event = findEvent("resupply", $segments[$k + 1]->events);

					if ($k == count($segments) - 2 || $event)
					{
						computeFoodWeight ($day, $d, $foodStart);
						
						if ($event)
						{
							DayGet ($d)->events[] = new Event("resupply", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "");
						}
					}
					
					$event = findEvent("stop", $segments[$k + 1]->events);
					
					if ($event && $event->enabled)
					{
						// todo: error out if a mustStop is in a noCamping area?
						
						DayGet ($d)->events[] = new Event("stop", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "");
						
						if ($k < count($segments) - 2)
						{
							newDayStart ($d, $dayMeters, $dayHours, $segments[$k + 1]->lat, $segments[$k + 1]->lng, $segments[$k + 1]->ele, $dayGain, $dayLoss, $k + 1, $segmentMeters);
							
							DayGet ($d)->cantMoveStartMeters = true;
						}
					}
						
					$event = findEvent("linger", $segments[$k + 1]->events);
					
					if ($event && $event->enabled)
					{
						// todo: determine what it means to linger when already stopped.
						
						$lingerHours = $event->time;
						
						$remainingHours = ($hoursPerDay - $hoursHiked) - $lingerHours;
						
	//					echo "linger: hours hiked: $hoursHiked\n";
	//					echo "linger: delta meters: $remainingSegmentMeters\n";
	//					echo "linger: meters: $meters\n";
	//					echo "linger: segment meters: $segmentMeters\n";
	//					echo "linger: next segment meters: ", $segments[$k + 1]->dist, "\n";
	//					echo "linger: remaining hours: $remainingHours\n";
						
						if ($remainingHours > 0)
						{
							DayGet ($d)->events[] = new Event("linger", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "linger for " . $lingerHours . " hour(s);");
						}
						else
						{
							DayGet ($d)->events[] = new Event("linger", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "linger for " . round ($lingerHours + $remainingHours, 1) . " hour(s);");
							
							if ($k < count($segments) - 2)
							{
								newDayStart ($d, $dayMeters, $dayHours, $segments[$k + 1]->lat, $segments[$k + 1]->lng, $segments[$k + 1]->ele, $dayGain, $dayLoss, $k + 1, $segmentMeters);
								
								$lingerHours = -$remainingHours;
								
								if ($lingerHours)
								{
									DayGet ($d)->events[] = new Event("linger", $event->poiId, $event->lat, $event->lng, $segmentMeters, $currentTime, "linger for " . round($lingerHours, 1) . " hour(s);");
								}
							}
						}
					}
				}
			
				break;
			}
			else 
			{
				//$found = false;
				
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
						$hoursNeeded = $remainingMeters / ($metersPerHour * ($hikerProfile["percentage"] / 100.0));
						
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
						
						$k = DayGet ($d)->segment - 1; // decrease by one since the for loop will increase it by one
						//echo "segment meters: $segmentMeters\n";
						$restart = true;
						
						break;
						
//						$dayMeters += $remainingMeters;
//						$segmentMeters += $remainingMeters;
//						DayGet ($d)->endTime += $remainingHours;
						
//						echo "Changed end time for $d to ", DayGet ($d)->endTime, "\n";
						
//						echo "Changed to $dayMeters, $segmentMeters\n";
						
//						$found = true;
						
//						break;
					}
				}

				if (isset($maxZ) && $z > $maxZ)
				{
					if (isset($debug))
					{
						echo "exited inner loop after $z iterations\n";
					}
					break;
				}
				
				if ($restart)
				{
					break;
				}

// 				echo "day meters remaining = $dayMetersRemaining\n";
				$dayMeters += $dayMetersRemaining;
				$segmentMeters += $dayMetersRemaining;
				
				// We ended the day between the start and end of the current segment.
				// Determine where in the segment we ended and compute current elevation and
				// lat/lng.
				
				$segmentPercent = ($segmentMeters - $segments[$k]->dist) / ($segments[$k + 1]->dist - $segments[$k]->dist);
				
// 				echo "segmentPercent = $segmentPercent\n";
// 				echo "segmentMeters = $segmentMeters\n";
// 				echo "segment start = ", $segments[$k]->dist, "\n";
// 				echo "segment end = ", $segments[$k + 1]->dist, "\n";
// 				echo "numerator = ", ($segmentMeters - $segments[$k]->dist), "\n";
// 				echo "denominator = ", ($segments[$k + 1]->dist - $segments[$k]->dist), "\n";
				
				$currentEle = ($segments[$k + 1]->ele - $segments[$k]->ele) * $segmentPercent + $segments[$k]->ele;

				$eleDelta = $currentEle - $lastEle;
				
				if ($eleDelta > 0)
				{
					$dayGain += $eleDelta;
				}
				else
				{
					$dayLoss += -$eleDelta;
				}
				
				//todo: This is just a linear computation of lat/lng given the distance. Change this to
				// use a geodesic computation.
				$lat = ($segments[$k + 1]->lat - $segments[$k]->lat) * $segmentPercent + $segments[$k]->lat;
				$lng = ($segments[$k + 1]->lng - $segments[$k]->lng) * $segmentPercent + $segments[$k]->lng;
				
				newDayStart ($d, $dayMeters, $dayHours, $lat, $lng, $currentEle, $dayGain, $dayLoss, $k, $segmentMeters);
				
				$lastEle = $currentEle;
				
				//echo "Day $d, segment meters: " . DayGet ($d)->segmentMeters . "\n";
				//				echo "day $d start meters = " . DayGet ($d)->meters . "\n";
			}
			
			//echo "Meters = $meters\n";
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
	
	computeFoodWeight ($day, $d, $foodStart);
	
	$jsonHikeData = json_encode($day);
	
	try
	{
		$sql = "update userHike set data = :data where userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			$stmt->bindParam(":data", $paramData, PDO::PARAM_STR);
			
			$paramUserHikeId = $userHikeId;
			$paramData = $jsonHikeData;
			
			$stmt->execute ();
			
			unset($stmt);
		}
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
	
	echo $jsonHikeData;

?>