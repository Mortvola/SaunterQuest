<?php 

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	// Include config file
	require_once "config.php";
	
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
			$accum += $day[$i]["foodWeight"];
//			echo $day[$i]["foodWeight"], ", ";
			$day[$i]["accumWeight"] = $accum;
//			echo $day[$i]["accumWeight"], "\n";
		}
		
		$foodStart = $d + 1;
	}
	
	//
	// Initialize the day
	//
	function dayInitialize (&$day, $d, &$dayMiles, &$dayHours, $k, $segmentMiles)
	{
		global $output, $startTime, $endTime;
		
		$day[$d]["mile"] = $day[$d - 1]["mile"] + $dayMiles;
		$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
		if (!array_key_exists ("notes", $day[$d]))
		{
			$day[$d]["notes"] = "";
		}
		if (!array_key_exists ("startTime", $day[$d]))
		{
			$day[$d]["startTime"] = $startTime;
		}
		if (!array_key_exists ("endTime", $day[$d]))
		{
			$day[$d]["endTime"] = $endTime;
		}
		$day[$d]["segment"] = $k;
		$day[$d]["segmentMiles"] = $segmentMiles;
		
		echo "Setting Day $d, segment miles: $segmentMiles\n";
		
		$dayMiles = 0;
		$dayHours = 0;
	}
	
	// Hiking profile
	$milesPerHour = 1; //1.5;
	$startTime = 8;
	$endTime = 19;
	$midDayBreakDuration = 1;
	
	$totalMiles = 235;
	
	$segments = array(
			array(0, array("start")),
			array(5.0, array("muststop")),
			array(36.6, array("arriveBefore")),
			array(60.8, array("resupply", "muststop")),
			array(110, array("resupply")),
			array(178.3, array("arriveBefore")),
			array(210, array("linger")),
			array($totalMiles, array("stop")));
	
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

	$mile = 0;
	$d = 0;
	$foodStart = $d;
	$lingerHours = 0;
	
	dayInitialize ($day, $d, $dayMiles, $dayHours, 0, 0);
	
	$z = 0;
	
	for ($k = 0; $k < count($segments) - 1; $k++)
	{
		if (!$restart)
		{
			$segmentMiles = $segments[$k][0];

			if ($k == 0)
			{
				$day[$d]["segment"] = $k;
				$day[$d]["segmentMiles"] = $segmentMiles;
			}
		}
		else
		{
			echo "Restarting at day $d\n";
			
			$segmentMiles = $day[$d]["segmentMiles"];
			$dayMiles = 0;
			$restart = false;
		}
		
		for (;;)
	 	{
	 		//echo "linger hours: $lingerHours\n";
	 		
	 		echo "Day $d, segment miles: " . $segmentMiles . "\n";
	 		echo "Day $d, segment miles: " . $day[$d]["segmentMiles"] . "\n";
	 		
	 		$hoursPerDay = (($day[$d]["endTime"] - $day[$d]["startTime"]) - $midDayBreakDuration);
	 		$hoursPerDay -= $lingerHours;
	 		$lingerHours = 0;
	 		$dayMilesRemaining = $hoursPerDay * $milesPerHour - $dayMiles;
	 		
	 		echo "Day $d, hours per day: $hoursPerDay\n";
//  	 		echo "mile: $mile\n";
//  	 		echo "day miles: $dayMiles\n";
//  	 		echo "Miles/day = $dayMilesRemaining\n";
	 		
	 		if ($segmentMiles + $dayMilesRemaining >= $segments[$k + 1][0])
	 		{
	 			echo "Day $d, segment miles: $segmentMiles, next segment: " . $segments[$k + 1][0] . "\n";
	 			
	 			$deltaMiles = $segments[$k + 1][0] - $segmentMiles;
	 			$dayMiles += $deltaMiles;
	 			$hoursHiked = $deltaMiles / $milesPerHour;
	 			$dayHours += $hoursHiked;
	 			
	 			$segmentMiles += $deltaMiles;
	 			
	 			if (in_array("arriveBefore", $segments[$k + 1][1]))
	 			{
	 				$arriveBeforeTime = 12; //todo: this needs to come from the arriveBefore event
	 				$currentTime = $startTime + $dayHours;
	 				
	 				echo "arrival restriction on day $d, currentTime = $currentTime\n";
	 				
	 				if ($currentTime > $arriveBeforeTime)
	 				{
	 					$hoursNeeded = $currentTime - $arriveBeforeTime;
	 					
 	 					echo "too late: ", $hoursHiked + $startTime, "\n";
// 	 					echo "hours needed: ", $hoursNeeded, "\n";
	 					
	 					// extend the end time of each prior day an hour until the needed time is found and recompute mileage.
	 					// todo: this needs to be a preference. The algorithm could add an hour to each
	 					// prior day until the extra time needed is found or it could evenly divide the needed time
	 					// across all days since the start, or a mix of the two.
	 					
	 					for ($d--; $d > 0; $d--)
	 					{
	 						if ($hoursNeeded > 1)
	 						{
		 						$day[$d]["endTime"] += 1;
		 						$day[$d]["notes"] = "increased end time by 1 hour;";
		 						$hoursNeeded -= 1;
		 						
		 						//echo "Day $d, end time ", $day[$d]["endTime"], "\n";
	 						}
	 						else
	 						{
	 							$day[$d]["endTime"] += $hoursNeeded;
	 							$day[$d]["notes"] = "increased end time by " . $hoursNeeded . " hours;";
	 							
	 							break;
	 						}
	 					}
	 					
	 					$k = $day[$d]["segment"] - 1; // decrease by one since the for loop will increase it by one
	 					//echo "segment miles: $segmentMiles\n";
	 					$restart = true;
	 					
	 					break;
	 				}
	 				else
	 				{
	 					$day[$d]["notes"] .= "Arrive Before: " . $arriveBeforeTime . ", arrived at " . $currentTime . ";";
	 				}
	 			}
	 			
	 			if ($k == count($segments) - 2 || in_array("resupply", $segments[$k + 1][1]))
	 			{
	 				computeFoodWeight ($day, $d, $foodStart);
	 				
	 				if (in_array("resupply", $segments[$k + 1][1]))
	 				{
		 				$day[$d]["notes"] .= "resupply;";
	 				}
	 			}
	 			
	 			if (in_array("muststop", $segments[$k + 1][1])
				 || in_array("stop", $segments[$k + 1][1]))
	 			{
	 				// todo: error out if a mustStop is in a noCamping area?
	 				
	 				$d++;
	 				if ($k < count($segments) - 2)
	 				{
	 					dayInitialize ($day, $d, $dayMiles, $dayHours, $k + 1, $segmentMiles);
	 					$day[$d]["cantMoveStartMiles"] = true;
	 				}
	 			}
	 			else if (in_array("linger", $segments[$k + 1][1]))
	 			{
	 				$lingerHours = 2; // todo: Linger hours need to come from the linger event.
	 				
	 				$remainingHours = ($hoursPerDay - $hoursHiked) - $lingerHours;
	 				
//  	 				echo "linger: hours hiked: $hoursHiked\n";
//  	 				echo "linger: delta miles: $deltaMiles\n";
//  	 				echo "linger: miles: $mile\n";
//  	 				echo "linger: segment miles: $segmentMiles\n";
//  	 				echo "linger: next segment miles: ", $segments[$k + 1][0], "\n";
//  	 				echo "linger: remaining hours: $remainingHours\n";
	 				
	 				if ($remainingHours > 0)
	 				{
	 					$day[$d]["notes"] .= "linger " . $lingerHours . ";";
	 				}
	 				else
	 				{
	 					$day[$d]["notes"] .= "linger " . round ($lingerHours + $remainingHours, 1) . ";";
	 					
	 					$d++;
	 					if ($k < count($segments) - 2)
	 					{
	 						dayInitialize ($day, $d, $dayMiles, $dayHours, $k + 1, $segmentMiles);
	 						
		 					$lingerHours =  -$remainingHours;
		 					
		 					if ($lingerHours)
		 					{
		 						$day[$d]["notes"] .= "linger " . round($lingerHours, 1) . ";";
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
	 					echo "Day $d inside no camping area: " . ($segmentMiles + $dayMilesRemaining) . ": " . $noCamping[$i][0] . ", " . $noCamping[$i][1] . "\n";
	 					
	 					//
	 					// We are in a no camping area... need to move.
	 					//
	 					$remainingMiles = $noCamping[$i][1] - ($segmentMiles + $dayMilesRemaining);
	 					$hoursNeeded = $remainingMiles / $milesPerHour;
	 					
	 					echo "needed hours: $hoursNeeded\n";
	 					
	 					// Try extending the end hours for the past days
	 					for ($p = $d; $p > 0; $p--)
	 					{
	 						if ($hoursNeeded > 1)
	 						{
	 							$day[$p]["endTime"] += 1;
	 							$day[$p]["notes"] = "increased end time by 1 hour;";
	 							$hoursNeeded -= 1;
	 							
	 							echo "Day $p, end time ", $day[$p]["endTime"], "\n";
	 							
	 							//
	 							// If the start of this day can't be moved then look no further
	 							//
	 							if (array_key_exists ("cantMoveStartMiles", $day[$p]) && $day[$p]["cantMoveStartMiles"])
	 							{
	 								break;
	 							}
	 						}
	 						else
	 						{
	 							$day[$p]["endTime"] += $hoursNeeded;
	 							$day[$p]["notes"] = "increased end time by " . $hoursNeeded . " hours;";
	 							$hoursNeeded = 0;
	 							
	 							echo "Day $p, end time ", $day[$p]["endTime"], "\n";
	 							
	 							break;
	 						}
	 					}
	 					
	 					$startDay = $p;
	 					
	 					if ($hoursNeeded > 0)
	 					{
	 						//
	 						// Try starting earlier for the past days
	 						//
	 						for ($p = $d; $p > 0; $p--)
	 						{
	 							if ($hoursNeeded > 1)
	 							{
	 								$day[$p]["startTime"] -= 1;
	 								$day[$p]["notes"] = "decreased start time by 1 hour;";
	 								$hoursNeeded -= 1;
	 								
	 								echo "Day $p, start time ", $day[$p]["startTime"], "\n";
	 								
	 								//
	 								// If the start of this day can't be moved then look no further
	 								//
	 								if (array_key_exists ("cantMoveStartMiles", $day[$p]) && $day[$p]["cantMoveStartMiles"])
	 								{
	 									break;
	 								}
	 							}
	 							else
	 							{
	 								$day[$p]["startTime"] -= $hoursNeeded;
	 								$day[$p]["notes"] = "decreased end time by " . $hoursNeeded . " hours;";
	 								$hoursNeeded = 0;
	 								
	 								echo "Day $p, start time ", $day[$p]["startTime"], "\n";
	 								
	 								break;
	 							}
	 						}
	 					}
	 					
	 					if ($startDay > $p)
	 					{
	 						$d = $p;
	 					}
	 					else
	 					{
	 						$d = $startDay;
	 					}
	 					
	 					echo "Hours needed: $hoursNeeded\n";
	 					
	 					$k = $day[$d]["segment"] - 1; // decrease by one since the for loop will increase it by one
	 					//echo "segment miles: $segmentMiles\n";
	 					$restart = true;
	 					
	 					break;
	 					
//	 					$dayMiles += $remainingMiles;
//	 					$segmentMiles += $remainingMiles;
//	 					$day[$d]["endTime"] += $remainingHours;
	 					
//	 					echo "Changed end time for $d to ", $day[$d]["endTime"], "\n";
	 					
//	 					echo "Changed to $dayMiles, $segmentMiles\n";
	 					
// 	 					$found = true;
	 					
// 	 					break;
	 				}
	 			}

	 			$z++;
	 			
	 			if ($z > 10)
	 			{
	 				break;
	 			}
	 			
	 			if ($restart)
	 			{
	 				break;
	 			}

	 			$dayMiles += $dayMilesRemaining;
 				$segmentMiles += $dayMilesRemaining;
 				
 				$d++;
	 			dayInitialize ($day, $d, $dayMiles, $dayHours, $k, $segmentMiles);
	 			
	 			echo "Day $d, segment miles: " . $day[$d]["segmentMiles"] . "\n";
//	 			echo "day $d start miles = " . $day[$d]["mile"] . "\n";
	 		}
	 		
	 		//echo "Miles = $mile\n";
		}
		
		if ($z > 10)
		{
			break;
		}
	}
	
	echo json_encode($day);
}

?>