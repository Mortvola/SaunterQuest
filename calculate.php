<?php 

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	// Include config file
	require_once "config.php";
	
	$milesPerHour = 1; //1.5;
	$startTime = 800;
	$endTime = 1900;
	$midDayBreakDuration = 100;
	
	$totalMiles = 235;
	
	$milesPerDay = (($endTime - $startTime) - $midDayBreakDuration) * $milesPerHour / 100;
	
//	echo "miles/day: ", $milesPerDay, "\n";
	
	$totalDays = $totalMiles / $milesPerDay;
	
	$segments = array(
			array("start", 0),
			array("muststop", 5.0),
			array("resupply", 60.8),
			array("resupply", 110),
			array("stop", $totalMiles));
	
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
	
	for ($k = 0; $k < count($segments) - 1; $k++)
	{
// 		$segmentMiles = $segments[$k + 1][1] - $segments[$k][1];
// 		$segmentDays = $segmentMiles / $milesPerDay;
		
// 		echo "segment miles: ", $segmentMiles, "\n";
// 		echo "segment days: ", $segmentDays, "\n";
		
		$segmentDays = 0;
		$segmentMiles = $segments[$k][1];
		
		for ($i = 0; /*$i < $segmentDays*/; $i++)
	 	{
	 		$segmentDays++;
	 		$day[$d]["foodWeight"] = $output[0]["weight"];
	 		
	 		if ($segmentMiles + $milesPerDay > $segments[$k + 1][1])
	 		{
	 			$delta = $segments[$k + 1][1] - $segmentMiles;
	 			
	 			//echo "Short day: $delta\n";
	 			
	 			$mile += $delta;
	 			$day[$d]["mile"] = $mile;
	 			//echo "i = $i, d = $d, mile = $mile\n";
	 			$d++;
	 			break;
	 		}
	 		else 
	 		{
	 			$mile += $milesPerDay;
	 			$segmentMiles += $milesPerDay;
	 			$day[$d]["mile"] = $mile;
	 			//echo "i = $i, d = $d, mile = $mile\n";
	 			$d++;
	 		}
	 		
		}
		
		//echo "type at $k + 1:", $segment[$k + 1][0], "\n";
		
		// If this is the last segment or if this is a resupply point then
		// compute the weight of the food for each day since the last resupply.
		if ($k == count($segments) - 2 || $segments[$k + 1][0] == "resupply")
		{
			$accum = 0;
			for ($i = $d - 1; $i >= $foodStart; $i--)
			{
	//			echo $dayFoodWeight[$k][$i], ": ";
				$accum += $day[$i]["foodWeight"];
	//			echo $accum, ", ";
				$day[$i]["accumWeight"] = $accum;
	//			echo $dayPackWeight[$k][$i], "\n";
			}
			
	//		ksort($day[$k]);
	
			$foodStart = $d;
		}
	}
	
	echo json_encode($day);
}

?>