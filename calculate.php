<?php 

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	// Include config file
	require_once "config.php";
	
	class Event
	{
		function __construct ($type, $mile, $time, $notes)
		{
			$this->type = $type;
			$this->mile = $mile;
			$this->time = $time;
			$this->notes = $notes;
		}
		
		public $type;
		public $mile;
		public $time;
		public $notes;
	}
	
	class Day
	{
		public $mile = 0;
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
		function dayInitialize ($d, &$dayMiles, &$dayHours, $k, $segmentMiles)
		{
			global $output, $startTime, $endTime, $debug, $day;
			
			if ($d > 0)
			{
				$this->mile = $day[$d - 1]->mile + $dayMiles;
			}
			else
			{
				$this->mile = $dayMiles;
			}
			
			$this->foodWeight = $output[0]["weight"]; //todo: randomly select meal plan
			
			if ($this->notes == null)
			{
				$this->notes = "";
			}
			
			if ($this->startTime == null)
			{
				$this->startTime = $startTime;
			}
			
			if ($this->endTime == null)
			{
				$this->endTime = $endTime;
			}
			
			$this->segment = $k;
			$this->segmentMiles = $segmentMiles;
			
			if ($debug)
			{
				echo "Initializing Day $d, mile: $this->mile, segment: $k, segment miles: $segmentMiles\n";
			}
			
			$dayMiles = 0;
			$dayHours = 0;
		}
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
		global $endTime;
		
		$earliestChangedDay = -1;
		
		// Try extending the end hours for the past days
		for (; $d > 0; $d--)
		{
			$amountToShift = $endTime + $timeShift - $day[$d]->endTime;
			
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
		global $startTime;
		
		$earliestChangedDay = -1;
		
		//
		// Try starting earlier for the past days
		//
		for (; $d > 0; $d--)
		{
			$amountToShift = $day[$d]->startTime - ($startTime - $timeShift);
			
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
		
		if ($day[$d] == null)
		{
			if ($debug)
			{
				echo "Creating day $d\n";
			}
			
			$day[$d] = new Day();
		}
		
		return $day[$d];
	}
	
	// Hiking profile
	$milesPerHour = 1; //1.5;
	$startTime = 8;
	$endTime = 19;
	$midDayBreakDuration = 1;
	
	$totalMiles = 235;
	
	$segments = array(
		(object)[mile => 0, events => array((object)[type => "start", enabled => true])],
		(object)[mile => 5.0, events => array((object)[type => "stop", enabled => true])],
		(object)[mile => 36.6, events => array((object)[type => "arriveBefore", enabled => true])],
		(object)[mile => 60.8, events => array((object)[type => "resupply", enabled => true], (object)[type => "stop", enabled => true])],
		(object)[mile => 110, events => array((object)[type => "resupply", enabled => true])],
		(object)[mile => 178.3, events => array((object)[type => "arriveBefore", enabled => true])],
		(object)[mile => 210, events => array((object)[type => "linger", enabled => true])],
		(object)[mile => $totalMiles, events => array((object)[type => "stop", enabled => true])]
	);
	
	$noCamping = array(
					array (18.1, 28.9));
	
	try
	{
		$sql = "select dt.dayTemplateId, dt.name, sum(fiss.grams * dtfi.numberOfServings) as weight
				from dayTemplateFoodItem dtfi
				join foodItemServingSize fiss on fiss.foodItemId = dtfi.foodItemId
				join dayTemplate dt on dt.dayTemplateId = dtfi.dayTemplateId and userId = :userId
				group by dtfi.dayTemplateId, dt.name";

		if ($stmt = $pdo->prepare($sql))
		{
        	$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
        	$paramUserId = $_SESSION["userId"];

			$stmt->execute ();
				
			$output = $stmt->fetchAll (PDO::FETCH_ASSOC);
		
			unset($stmt);
		}
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}

	$debug = false;
	$mile = 0;
	$d = 0;
	$foodStart = $d;
	$lingerHours = 0;
	$dayMiles = 0;
	$dayHours = 0;
	
	$day = [];
	
	DayGet ($d)->dayInitialize ($d, $dayMiles, $dayHours, 0, 0);
	
	$z = 0;
	
	for ($k = 0; $k < count($segments) - 1; $k++)
	{
		if ($restart)
		{
			if ($debug)
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
			$segmentMiles = $segments[$k]->mile;
			
			if ($k == 0)
			{
				DayGet ($d)->segment = $k;
				DayGet ($d)->segmentMiles = $segmentMiles;
			}
		}
		
		for (;;)
	 	{
//	 		$z++;
	 		
	 		if ($z > 10)
	 		{
	 			echo "exited inner loop after $z iterations\n";
	 			break;
	 		}
	 		
	 		//echo "linger hours: $lingerHours\n";
	 		
	 		//echo "Day $d, segment miles: " . $segmentMiles . "\n";
	 		//echo "Day $d, segment miles: " . DayGet ($d)->segmentMiles . "\n";
	 		
	 		$hoursPerDay = ((DayGet ($d)->endTime - DayGet ($d)->startTime) - $midDayBreakDuration);
	 		$hoursPerDay -= $lingerHours;
	 		$lingerHours = 0;
	 		$dayMilesRemaining = $hoursPerDay * $milesPerHour - $dayMiles;
	 		
	 		//echo "Day $d, hours per day: $hoursPerDay\n";
//  	 		echo "mile: $mile\n";
//  	 		echo "day miles: $dayMiles\n";
//  	 		echo "Miles/day = $dayMilesRemaining\n";
	 		
	 		if ($segmentMiles + $dayMilesRemaining >= $segments[$k + 1]->mile)
	 		{
	 			//echo "Day $d, segment miles: $segmentMiles, next segment: " . $segments[$k + 1]->mile . "\n";
	 			
	 			$deltaMiles = $segments[$k + 1]->mile - $segmentMiles;
	 			$dayMiles += $deltaMiles;
	 			$hoursHiked = $deltaMiles / $milesPerHour;
	 			$dayHours += $hoursHiked;
	 			$currentTime = DayGet ($d)->startTime + $dayHours;
	 			$segmentMiles += $deltaMiles;
	 			
	 			$event = findEvent("arriveBefore", $segments[$k + 1]->events);
	 			
	 			if ($event)
	 			{
	 				$arriveBeforeTime = 12; //todo: this needs to come from the arriveBefore event
	 				
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
	 				
	 				DayGet ($d)->events[] = new Event("arriveBefore", $segmentMiles, $currentTime, "Arrive Before: " . $arriveBeforeTime . ", arrived at " . $currentTime . ";");
	 			}
	 			
	 			$event = findEvent("resupply", $segments[$k + 1]->events);
	 			
	 			if ($k == count($segments) - 2 || $event)
	 			{
	 				computeFoodWeight ($day, $d, $foodStart);
	 				
	 				if ($event)
	 				{
	 					DayGet ($d)->events[] = new Event("resupply", $segmentMiles, $currentTime, "");
	 				}
	 			}
	 			
	 			$event = findEvent("stop", $segments[$k + 1]->events);
	 			
	 			if ($event && $event->enabled)
	 			{
	 				// todo: error out if a mustStop is in a noCamping area?
	 				
	 				DayGet ($d)->events[] = new Event("stop", $segmentMiles, $currentTime, "");
	 				
	 				if ($k < count($segments) - 2)
	 				{
	 					$d++;
	 					DayGet ($d)->dayInitialize ($d, $dayMiles, $dayHours, $k + 1, $segmentMiles);
	 					DayGet ($d)->cantMoveStartMiles = true;
	 				}
	 			}
	 				
	 			$event = findEvent("linger", $segments[$k + 1]->events);
	 			
	 			if ($event && $event->enabled)
	 			{
	 				// todo: determien what it means to linger when already stopped.
	 				
	 				$lingerHours = 2; // todo: Linger hours need to come from the linger event.
	 				
	 				$remainingHours = ($hoursPerDay - $hoursHiked) - $lingerHours;
	 				
//  	 				echo "linger: hours hiked: $hoursHiked\n";
//  	 				echo "linger: delta miles: $deltaMiles\n";
//  	 				echo "linger: miles: $mile\n";
//  	 				echo "linger: segment miles: $segmentMiles\n";
//  	 				echo "linger: next segment miles: ", $segments[$k + 1]->mile, "\n";
//  	 				echo "linger: remaining hours: $remainingHours\n";
	 				
	 				if ($remainingHours > 0)
	 				{
	 					DayGet ($d)->events[] = new Event("linger", $segmentMiles, $currentTime, "linger for " . $lingerHours . " hour(s);");
	 				}
	 				else
	 				{
	 					DayGet ($d)->events[] = new Event("linger", $segmentMiles, $currentTime, "linger for " . round ($lingerHours + $remainingHours, 1) . " hour(s);");
	 					
	 					if ($k < count($segments) - 2)
	 					{
	 						$d++;
	 						DayGet ($d)->dayInitialize ($d, $dayMiles, $dayHours, $k + 1, $segmentMiles);
	 						
		 					$lingerHours =  -$remainingHours;
		 					
		 					if ($lingerHours)
		 					{
		 						DayGet ($d)->events[] = new Event("linger", $segmentMiles, $currentTime, "linger for " . round($lingerHours, 1) . " hour(s);");
		 					}
	 					}
	 				}
	 			}
	 		
	 			break;
	 		}
	 		else 
	 		{
	 			$found = false;
	 			
	 			for ($i = 0; $i < count($noCamping); $i++)
	 			{
	 				//echo "no camping start " . $noCamping[i][0] . " stop ". $noCamping
	 				if (($segmentMiles + $dayMilesRemaining) > $noCamping[$i][0] && ($segmentMiles + $dayMilesRemaining) < $noCamping[$i][1])
	 				{
	 					//echo "Day $d inside no camping area: " . ($segmentMiles + $dayMilesRemaining) . ": " . $noCamping[$i][0] . ", " . $noCamping[$i][1] . "\n";
	 					
	 					//
	 					// We are in a no camping area... need to move.
	 					//
	 					$remainingMiles = $noCamping[$i][1] - ($segmentMiles + $dayMilesRemaining);
	 					$hoursNeeded = $remainingMiles / $milesPerHour;
	 					
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
	 					
//	 					$dayMiles += $remainingMiles;
//	 					$segmentMiles += $remainingMiles;
//	 					DayGet ($d)->endTime += $remainingHours;
	 					
//	 					echo "Changed end time for $d to ", DayGet ($d)->endTime, "\n";
	 					
//	 					echo "Changed to $dayMiles, $segmentMiles\n";
	 					
// 	 					$found = true;
	 					
// 	 					break;
	 				}
	 			}

	 			if ($z > 10)
	 			{
	 				echo "exited inner loop after $z iterations\n";
	 				break;
	 			}
	 			
	 			if ($restart)
	 			{
	 				break;
	 			}

	 			$dayMiles += $dayMilesRemaining;
 				$segmentMiles += $dayMilesRemaining;
 				
 				$d++;
 				DayGet ($d)->dayInitialize ($d, $dayMiles, $dayHours, $k, $segmentMiles);
	 			
 				//echo "Day $d, segment miles: " . DayGet ($d)->segmentMiles . "\n";
 				//	 			echo "day $d start miles = " . DayGet ($d)->mile . "\n";
	 		}
	 		
	 		//echo "Miles = $mile\n";
		}
		
		if ($z > 10)
		{
			echo "exited outer loop after $z iterations\n";
			break;
		}
	}
	
	echo json_encode($day);
}

?>