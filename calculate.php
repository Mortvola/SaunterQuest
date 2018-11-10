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
	
	$milesPerHour = 1; //1.5;
	$startTime = 800;
	$endTime = 1900;
	$midDayBreakDuration = 100;
	
	$totalMiles = 235;
	
	$milesPerDay = (($endTime - $startTime) - $midDayBreakDuration) * $milesPerHour / 100;
	
//	echo "miles/day: ", $milesPerDay, "\n";
	
	$totalDays = $totalMiles / $milesPerDay;
	
	$segments = array(
			array(0, array("start")),
			array(5.0, array("muststop")),
			array(36.6, array("arriveBefore")),
			array(60.8, array("resupply", "muststop")),
			array(110, array("resupply")),
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
	$dayMiles = 0;
	
	for ($k = 0; $k < count($segments) - 1; $k++)
	{
		$segmentMiles = $segments[$k][0];
		
		for ($i = 0;; $i++)
	 	{
	 		//echo "linger hours: $lingerHours\n";
	 		
	 		$hoursPerDay = (($endTime - $startTime) - $midDayBreakDuration) / 100;
	 		$hoursPerDay -= $lingerHours;
	 		$lingerHours = 0;
	 		$milesPerDay = $hoursPerDay * $milesPerHour - $dayMiles;
	 		
//  	 		echo "mile: $mile\n";
//  	 		echo "day miles: $dayMiles\n";
//  	 		echo "Miles/day = $milesPerDay\n";
	 		
 	 		if ($segmentMiles + $milesPerDay >= $segments[$k + 1][0])
	 		{
	 			$deltaMiles = $segments[$k + 1][0] - $segmentMiles;
	 			$dayMiles += $deltaMiles;
	 			
	 			if ($k == count($segments) - 2 || in_array("resupply", $segments[$k + 1][1]))
	 			{
	 				computeFoodWeight ($day, $d, $foodStart);
	 			}
	 			
	 			if (in_array("muststop", $segments[$k + 1][1])
				 || in_array("stop", $segments[$k + 1][1]))
	 			{
	 				$d++;
	 				if ($k < count($segments) - 2)
	 				{
		 				$day[$d]["mile"] = $day[$d - 1]["mile"] + $dayMiles;
			 			$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
			 			//echo "i = $i, d = $d, mile = $mile\n";
			 			$dayMiles = 0;

//			 			echo "*** Start of day $d: mile: ", $day[$d]["mile"], "\n";
	 				}
	 			}
	 			else if (in_array("linger", $segments[$k + 1][1]))
	 			{
	 				$lingerHours = 2; // todo: Linger hours need to come from the linger event.
	 				
	 				$hoursHiked = $deltaMiles / $milesPerHour;
	 				$remainingHours = $hoursPerDay - $hoursHiked - $lingerHours;
	 				
//  	 				echo "linger: hours hiked: $hoursHiked\n";
//  	 				echo "linger: delta miles: $deltaMiles\n";
//  	 				echo "linger: miles: $mile\n";
//  	 				echo "linger: segment miles: $segmentMiles\n";
//  	 				echo "linger: next segment miles: ", $segments[$k + 1][0], "\n";
//  	 				echo "linger: remaining hours: $remainingHours\n";
	 				
	 				if ($remainingHours <= 0)
	 				{
	 					$d++;
	 					if ($k < count($segments) - 2)
	 					{
		 					$day[$d]["mile"] = $day[$d - 1]["mile"] + $dayMiles;
		 					$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
		 					//echo "i = $i, d = $d, mile = $mile\n";
		 					$dayMiles = 0;
//		 					echo "*** Start of day $d: mile: ", $day[$d]["mile"], "\n";
	 					}
	 					
	 					$lingerHours =  -$remainingHours;
	 				}
	 			}
	 		
	 			break;
	 		}
	 		else 
	 		{
	 			$dayMiles += $milesPerDay;
	 			$segmentMiles += $milesPerDay;
	 			
	 			$d++;
	 			$day[$d]["mile"] = $day[$d - 1]["mile"] + $dayMiles;
	 			$day[$d]["foodWeight"] = $output[0]["weight"]; //todo: randomly select meal plan
	 			$dayMiles = 0;
	 			
//	 			echo "*** Start of day $d: mile: ", $day[$d]["mile"], "\n";
	 			
	 			//echo "i = $i, d = $d, mile = $mile\n";
	 		}
	 		
	 		//echo "Miles = $mile\n";
		}
	}
	
	echo json_encode($day);
}

?>