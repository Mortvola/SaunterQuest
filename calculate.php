<?php 

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	$userId = $_SESSION["userId"];
	$userHikeId = $_GET["id"];
//	$userId = 1;
//	$userHikeId = 100027;
	
	// Include config file
	require_once "config.php";
	require_once "coordinates.php";
	
	class Event
	{
		function __construct ($type, $lat, $lng, $mile, $time, $notes)
		{
			$this->type = $type;
			$this->lat = $lat;
			$this->lng = $lng;
			$this->mile = $mile;
			$this->time = $time;
			$this->notes = $notes;
		}
		
		public $type;
		public $mile;
		public $lat;
		public $lng;
		public $time;
		public $notes;
	}
	
	class Day
	{
		public $mile = 0;
		public $lat;
		public $lng;
		public $gain = 0;
		public $loss = 0;
		public $foodWeight = 0;
		public $accumWeight = 0;
		public $startTime;
		public $endTime;
		public $notes;
		public $segment = 0;
		public $segmentMiles = 0;
		public $cantMoveStartMiles = false;
		public $events = [];
		
		//
		// Initialize the day
		//
		function dayInitialize ($d, $lat, $lng, &$dayMiles, $k, $segmentMiles)
		{
			global $food, $hikerProfile, $debug, $day;
			
			if ($d > 0)
			{
				$this->mile = $day[$d - 1]->mile + $dayMiles;
			}
			else
			{
				$this->mile = $dayMiles;
			}
			
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
			
			$this->segment = $k;
			$this->segmentMiles = $segmentMiles;
			
			//unset($this->events);
			$this->events = [];
			
			if (isset($debug))
			{
				echo "Initializing Day $d, mile: $this->mile, segment: $k, segment miles: $segmentMiles\n";
			}
		}
	}
	
	function newDayStart (&$d, &$dayMiles, &$dayHours, &$dayGain, &$dayLoss, $k, $segmentMiles)
	{
		global $segments;
		
		DayGet ($d)->gain = $dayGain;
		DayGet ($d)->loss = $dayLoss;
		
		$d++;
		DayGet ($d)->dayInitialize ($d, $segments[$k]->lat, $segments[$k]->lng, $dayMiles, $k, $segmentMiles);
		
		$dayMiles = 0;
		$dayHours = 0;
		$dayGain = 0;
		$dayLoss = 0;
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
			if ($day[$d]->cantMoveStartMiles)
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
			if ($day[$d]->cantMoveStartMiles)
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
		
		$sql = "select poi.lat, poi.lng, poic.type, poic.time
				from pointOfInterest poi
				join pointOfInterestConstraint poic on poic.pointOfInterestId = poi.pointOfInterestId
				join userHike uh on uh.hikeId = poi.hikeId and uh.userId = :userId and uh.userHikeId = :userHikeId
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
					$segments[$s]->events[] = (object)["type" => $poi["type"], "lat" => $poi["lat"], "lng" => $poi["lng"], "time" => $poi["time"], "enabled" => true];
				}
			}

			//var_dump ($segments);
			
			unset($stmt);
		}
	}
	
	function hikerProfilesGet ($userId, $userHikeId)
	{
		global $pdo, $hikerProfile;
		
		$sql = "select coalesce(milesPerHour, 1.0) AS milesPerHour,
					   coalesce(startTime, 8) AS startTime,
					   coalesce(endTime, 19) AS endTime,
					   coalesce(midDayBreakDuration, 1) AS midDayBreakDuration
				from userHike
				where userId = :userId
				and userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			
			$paramUserId = $userId;
			$paramUserHikeId = $userHikeId;
			
			$stmt->execute ();
			
			$output = $stmt->fetchAll (PDO::FETCH_ASSOC);
			
			$hikerProfile = $output[0];
			
			unset ($stmt);
		}
		
		// 		echo "milesPerHour = ", $hikerProfile["milesPerHour"], "\n";
		// 		echo "milesPerHour = ", $hikerProfile["startTime"], "\n";
		// 		echo "milesPerHour = ", $hikerProfile["endTime"], "\n";
		// 		echo "milesPerHour = ", $hikerProfile["midDayBreakDuration"], "\n";
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
//	$maxZ = 30000;
	$mile = 0;
	$d = 0;
	$foodStart = $d;
	$lingerHours = 0;
	$dayMiles = 0;
	$dayHours = 0;
	$dayGain = 0;
	$dayLoss = 0;
	$restart = false;
	
	$day = [];
	
	DayGet ($d)->dayInitialize ($d, $segments[0]->lat, $segments[0]->lng, $dayMiles, $dayHours, 0, 0);
	
	$z = 0;
	
	for ($k = 0; $k < count($segments) - 1; $k++)
	{
		if ($restart)
		{
			if (isset($debug))
			{
				echo "Restarting at day $d\n";
			}
			
			$segmentMiles = DayGet ($d)->segmentMiles;
			$dayMiles = 0;
			$dayHours = 0;
			$restart = false;
		}
		else
		{
			$segmentMiles = $segments[$k]->dist;
			
			$metersPerHour = metersPerHourGet ($segments[$k + 1]->ele - $segments[$k]->ele, $segments[$k + 1]->dist - $segments[$k]->dist);
			
			if ($k == 0)
			{
				DayGet ($d)->segment = $k;
				DayGet ($d)->segmentMiles = $segmentMiles;
			}
		}
		
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
			
			//echo "Day $d, segment miles: " . $segmentMiles . "\n";
			//echo "Day $d, segment miles: " . DayGet ($d)->segmentMiles . "\n";
			
			$hoursPerDay = ((DayGet ($d)->endTime - DayGet ($d)->startTime) - $hikerProfile["midDayBreakDuration"]);
			$hoursPerDay -= $lingerHours;
			$lingerHours = 0;
			
			$dayMilesRemaining = $hoursPerDay * $metersPerHour - $dayMiles;
			
			//echo "Day $d, hours per day: $hoursPerDay\n";
//			echo "mile: $mile\n";
//			echo "day miles: $dayMiles\n";
//			echo "Miles/day = $dayMilesRemaining\n";
			
			if ($segmentMiles + $dayMilesRemaining >= $segments[$k + 1]->dist)
			{
				if (isset($debug))
				{
					echo "Day $d, segment miles: $segmentMiles, next segment: " . $segments[$k + 1]->dist . "\n";
				}
				
				$deltaMiles = $segments[$k + 1]->dist - $segmentMiles;
				$dayMiles += $deltaMiles;
				$hoursHiked = $deltaMiles / $metersPerHour;
				$dayHours += $hoursHiked;
				$currentTime = DayGet ($d)->startTime + $dayHours;
				$segmentMiles += $deltaMiles;
				
				$eleDelta = $segments[$k + 1]->ele - $segments[$k]->ele;
				
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
								
								// extend the end time of each prior day an hour until the needed time is found and recompute mileage.
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
								//echo "segment miles: $segmentMiles\n";
								$restart = true;
								
								break;
							}
						}
						
						DayGet ($d)->events[] = new Event("arriveBefore", $event->lat, $event->lng, $segmentMiles, $currentTime, "Arrive Before: " . $arriveBeforeTime . ", arrived at " . $currentTime . ";");
					}
					
					$event = findEvent("resupply", $segments[$k + 1]->events);

					if ($k == count($segments) - 2 || $event)
					{
						computeFoodWeight ($day, $d, $foodStart);
						
						if ($event)
						{
							DayGet ($d)->events[] = new Event("resupply", $event->lat, $event->lng, $segmentMiles, $currentTime, "");
						}
					}
					
					$event = findEvent("stop", $segments[$k + 1]->events);
					
					if ($event && $event->enabled)
					{
						// todo: error out if a mustStop is in a noCamping area?
						
						DayGet ($d)->events[] = new Event("stop", $event->lat, $event->lng, $segmentMiles, $currentTime, "");
						
						if ($k < count($segments) - 2)
						{
							newDayStart ($d, $dayMiles, $dayHours, $dayGain, $dayLoss, $k + 1, $segmentMiles);
							
							DayGet ($d)->cantMoveStartMiles = true;
						}
					}
						
					$event = findEvent("linger", $segments[$k + 1]->events);
					
					if ($event && $event->enabled)
					{
						// todo: determine what it means to linger when already stopped.
						
						$lingerHours = $event->time;
						
						$remainingHours = ($hoursPerDay - $hoursHiked) - $lingerHours;
						
	//					echo "linger: hours hiked: $hoursHiked\n";
	//					echo "linger: delta miles: $deltaMiles\n";
	//					echo "linger: miles: $mile\n";
	//					echo "linger: segment miles: $segmentMiles\n";
	//					echo "linger: next segment miles: ", $segments[$k + 1]->dist, "\n";
	//					echo "linger: remaining hours: $remainingHours\n";
						
						if ($remainingHours > 0)
						{
							DayGet ($d)->events[] = new Event("linger", $event->lat, $event->lng, $segmentMiles, $currentTime, "linger for " . $lingerHours . " hour(s);");
						}
						else
						{
							DayGet ($d)->events[] = new Event("linger", $event->lat, $event->lng, $segmentMiles, $currentTime, "linger for " . round ($lingerHours + $remainingHours, 1) . " hour(s);");
							
							if ($k < count($segments) - 2)
							{
								newDayStart ($d, $dayMiles, $dayHours, $dayGain, $dayLoss, $k + 1, $segmentMiles);
								
								$lingerHours =  -$remainingHours;
								
								if ($lingerHours)
								{
									DayGet ($d)->events[] = new Event("linger", $event->lat, $event->lng, $segmentMiles, $currentTime, "linger for " . round($lingerHours, 1) . " hour(s);");
								}
							}
						}
					}
				}
			
				break;
			}
			else 
			{
				$found = false;
				
				for ($i = 0; isset($noCamping) && $i < count($noCamping); $i++)
				{
					//echo "no camping start " . $noCamping[i][0] . " stop ". $noCamping
					if (($segmentMiles + $dayMilesRemaining) > $noCamping[$i][0] && ($segmentMiles + $dayMilesRemaining) < $noCamping[$i][1])
					{
						//echo "Day $d inside no camping area: " . ($segmentMiles + $dayMilesRemaining) . ": " . $noCamping[$i][0] . ", " . $noCamping[$i][1] . "\n";
						
						//
						// We are in a no camping area... need to move.
						//
						$remainingMiles = $noCamping[$i][1] - ($segmentMiles + $dayMilesRemaining);
						$hoursNeeded = $remainingMiles / $metersPerHour;
						
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
						//echo "segment miles: $segmentMiles\n";
						$restart = true;
						
						break;
						
//						$dayMiles += $remainingMiles;
//						$segmentMiles += $remainingMiles;
//						DayGet ($d)->endTime += $remainingHours;
						
//						echo "Changed end time for $d to ", DayGet ($d)->endTime, "\n";
						
//						echo "Changed to $dayMiles, $segmentMiles\n";
						
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

				$dayMiles += $dayMilesRemaining;
				$segmentMiles += $dayMilesRemaining;
				
				newDayStart ($d, $dayMiles, $dayHours, $dayGain, $dayLoss, $k, $segmentMiles);
				
				//echo "Day $d, segment miles: " . DayGet ($d)->segmentMiles . "\n";
				//				echo "day $d start miles = " . DayGet ($d)->mile . "\n";
			}
			
			//echo "Miles = $mile\n";
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
	
	echo json_encode($day);
}

?>