<?php 

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	// Include config file
	require_once "config.php";
	
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
	
	$dayStartMile = 0;
	$day[$d]["mile"] = $dayStartMile;
	$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
	$day[$d]["notes"] = "";
	$day[$d]["startTime"] = $startTime;
	$day[$d]["endTime"] = $endTime;
	$day[$d]["segment"] = 0;
	$day[$d]["segmentMiles"] = 0;
	$dayMiles = 0;
	
	for ($k = 0; $k < count($segments) - 1; $k++)
	{
		$segmentMiles = $segments[$k][0];
	
		if ($k == 0)
		{
			$day[$d]["segment"] = $k;
			$day[$d]["segmentMiles"] = $segmentMiles;
		}
		
		for ($i = 0;; $i++)
	 	{
	 		//echo "linger hours: $lingerHours\n";
	 		
	 		$hoursPerDay = (($day[$d]["endTime"] - $day[$d]["startTime"]) - $midDayBreakDuration);
	 		$hoursPerDay -= $lingerHours;
	 		$lingerHours = 0;
	 		$dayMilesRemaining = $hoursPerDay * $milesPerHour - $dayMiles;
	 		
//  	 		echo "mile: $mile\n";
//  	 		echo "day miles: $dayMiles\n";
//  	 		echo "Miles/day = $dayMilesRemaining\n";
	 		
	 		if ($segmentMiles + $dayMilesRemaining >= $segments[$k + 1][0])
	 		{
	 			$deltaMiles = $segments[$k + 1][0] - $segmentMiles;
	 			$dayMiles += $deltaMiles;
	 			$hoursHiked = $deltaMiles / $milesPerHour;
	 			$dayHours += $hoursHiked;
	 			
	 			if (in_array("arriveBefore", $segments[$k + 1][1]))
	 			{
	 				$arriveBeforeTime = 12; //todo: this needs to come from the arriveBefore event
	 				$currentTime = $startTime + $dayHours;
	 				
	 				if ($currentTime > $arriveBeforeTime)
	 				{
	 					$hoursNeeded = $currentTime - $arriveBeforeTime;
	 					
// 	 					echo "too late: ", $hoursHiked + $startTime, "\n";
// 	 					echo "hours needed: ", $hoursNeeded, "\n";
	 					
	 					// extend the end time of each prior day an hour until the needed time is found and recompute mileage.
	 					// todo: this needs to be a preference. The algorithm could add an hour to each
	 					// prior day until the extra time needed is found or it could evenly divide the needed time
	 					// across all days since the start, or a mix of the two.
	 					
	 					
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
	 				$d++;
	 				if ($k < count($segments) - 2)
	 				{
		 				$day[$d]["mile"] = $day[$d - 1]["mile"] + $dayMiles;
			 			$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
			 			$day[$d]["notes"] = "";
			 			$day[$d]["startTime"] = $startTime;
			 			$day[$d]["endTime"] = $endTime;
			 			$day[$d]["segment"] = $k;
			 			$day[$d]["segmentMiles"] = $segmentMiles;
			 			
			 			//echo "i = $i, d = $d, mile = $mile\n";
			 			$dayMiles = 0;
			 			$dayHours = 0;

//			 			echo "*** Start of day $d: mile: ", $day[$d]["mile"], "\n";
	 				}
	 			}
	 			else if (in_array("linger", $segments[$k + 1][1]))
	 			{
	 				$lingerHours = 2; // todo: Linger hours need to come from the linger event.
	 				
	 				$remainingHours = $hoursPerDay - $hoursHiked - $lingerHours;
	 				
//  	 				echo "linger: hours hiked: $hoursHiked\n";
//  	 				echo "linger: delta miles: $deltaMiles\n";
//  	 				echo "linger: miles: $mile\n";
//  	 				echo "linger: segment miles: $segmentMiles\n";
//  	 				echo "linger: next segment miles: ", $segments[$k + 1][0], "\n";
//  	 				echo "linger: remaining hours: $remainingHours\n";
	 				$day[$d]["notes"] .= "linger " . round ($lingerHours + $remainingHours, 1) . ";";
	 				
	 				if ($remainingHours <= 0)
	 				{
	 					$d++;
	 					if ($k < count($segments) - 2)
	 					{
		 					$day[$d]["mile"] = $day[$d - 1]["mile"] + $dayMiles;
		 					$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
		 					$day[$d]["notes"] = "";
		 					$day[$d]["startTime"] = $startTime;
		 					$day[$d]["endTime"] = $endTime;
		 					$day[$d]["segment"] = $k;
		 					$day[$d]["segmentMiles"] = $segmentMiles;
		 					//echo "i = $i, d = $d, mile = $mile\n";
		 					$dayMiles = 0;
		 					$dayHours = 0;
//		 					echo "*** Start of day $d: mile: ", $day[$d]["mile"], "\n";
		 				
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
	 			$dayMiles += $dayMilesRemaining;
	 			$segmentMiles += $dayMilesRemaining;
	 			
	 			$d++;
	 			$day[$d]["mile"] = $day[$d - 1]["mile"] + $dayMiles;
	 			$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
	 			$day[$d]["notes"] = "";
	 			$day[$d]["startTime"] = $startTime;
	 			$day[$d]["endTime"] = $endTime;
	 			$day[$d]["segment"] = $k;
	 			$day[$d]["segmentMiles"] = $segmentMiles;
	 			$dayMiles = 0;
	 			$dayHours = 0;
	 			
//	 			echo "*** Start of day $d: mile: ", $day[$d]["mile"], "\n";
	 			
	 			//echo "i = $i, d = $d, mile = $mile\n";
	 		}
	 		
	 		//echo "Miles = $mile\n";
		}
	}
	
	echo json_encode($day);
}

?>