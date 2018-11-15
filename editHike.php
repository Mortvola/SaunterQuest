<?php
// Initialize the session
session_start();
 
// Check if the user is logged in, if not then redirect him to login page
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    header("location: login.php");
    exit;
}

// Include config file
require_once "config.php";

 $origId = $_GET["orig"];

 if  ($origId)
 {
 	$sql = "select name
 			from hike
 			where hikeId = :hikeId";
	
 	if ($stmt = $pdo->prepare($sql))
 	{
 		$stmt->bindParam(":hikeId", $paramHikeId, PDO::PARAM_INT);
 		
 		$paramHikeId = $origId;
 		
 		$stmt->execute ();
		
 		$hike = $stmt->fetchAll (PDO::FETCH_ASSOC);
		
 		unset ($stmt);
		
 		$sql = "insert into userHike (creationDate, modificationDate, userId, name)
 				values (now(), now(), :userId, :name)";
		
 		if ($stmt = $pdo->prepare($sql))
 		{
 			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
 			$stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
			
 			$paramUserId = $_SESSION["userId"];
 			$paramName = $hike[0]["name"]." Test Hike";
			
 			$stmt->execute ();
			
 			$userHikeId = $pdo->lastInsertId ("userHikeId");
 			
 			unset ($stmt);
 			
			$sql = "select poi.pointOfInterestId, poi.mile, poi.name, poi.description
					from pointOfInterest poi
					where poi.hikeId = :hikeId";
 			
 			if ($stmt = $pdo->prepare($sql))
 			{
 				$stmt->bindParam(":hikeId", $paramHikeId, PDO::PARAM_INT);
 				$paramHikeId = $origId;
 				
 				$stmt->execute ();

 				$pointsOfInterest = $stmt->fetchAll (PDO::FETCH_ASSOC);
 				
  				$sql = "insert into pointOfInterest (creationDate, modificationDate, mile, name, description, hikeId)
						values (now(), now(), :mile, :name, :description, :userHikeId)";
 			
  				if ($stmt = $pdo->prepare($sql))
  				{
  					$stmt->bindParam(":mile", $paramMile, PDO::PARAM_INT);
  					$stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
  					$stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
  					$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
 					
 					foreach ($pointsOfInterest as $poi)
	 				{
	 					$paramMile = $poi["mile"];
	 					$paramName = $poi["name"];
	 					$paramDescription = $poi["description"];
	 					$paramUserHikeId = $userHikeId;
	 					
	 					$stmt->execute ();
	 					
	 					$pointOfInterestId = $pdo->lastInsertId ("pointOfInterestId");

	 					$sql = "insert into pointOfInterestConstraint (creationDate, modificationDate, pointOfInterestId, type, time)
								select now(), now(), :newPointOfInterestId, type, time
								from pointOfInterestConstraint
								where pointOfInterestId = :oldPointOfInterestId";
	 					
	 					if ($stmt2 = $pdo->prepare($sql))
	 					{
	 						$stmt2->bindParam(":newPointOfInterestId", $paramNewPointOfInterestId, PDO::PARAM_INT);
	 						$stmt2->bindParam(":oldPointOfInterestId", $paramOldPointOfInterestId, PDO::PARAM_INT);

	 						$paramNewPointOfInterestId = $pointOfInterestId;
	 						$paramOldPointOfInterestId = $poi["pointOfInterestId"];
	 						
	 						$stmt2->execute ();
	 						
	 						unset ($stmt2);
	 					}
	 				}
 				}
 				
 				unset ($stmt);
 			}
 		}
 	}
}
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
	<script src="/bootstrap.min.js"></script>
    <style type="text/css">
        body{ font: 14px sans-serif; }
    </style>
</head>
<body>
    <div class="page-header" style=" text-align: center;">
        <h1>Backpacker's Planner</h1>
    </div>
    <p  style="text-align: center;">
        <a href="reset-password.php" class="btn btn-warning">Reset Your Password</a>
        <a href="logout.php" class="btn btn-danger">Sign Out of Your Account</a>
    </p>
    <nav class="navbar navbar-default">
        <div class="container-fluid">
            <ul class="nav navbar-nav">
                <li class="nav-item active"><a class="nav-link">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Daily View</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Segment View</a></li>
                <li class="nav-item"><a class="nav-link" href="/CreateFoodItem.php">Create Food Item</a></li>
                <li class="nav-item"><a class="nav-link" href="/DayTemplates.php">Daily Meal Plans</a></li>
            </ul>
        </div>
    </nav>
    <div>
	    <div class="container-fluid">
	        <div class="col-md-4">
				<div id="googleMap" style="width:100%;height:600px"></div>
	        </div>
	        <div class="col-md-8">
	        	<nav>
					<ul class="nav nav-tabs" role="tablist">
						<li role="presentation" class="active"><a href="#">Itinerary</a></li>
						<li role="presentation"><a href="#">Hiker Profiles</a></li>
					</ul>
				</nav>
			    <table class="table table-condensed">
				    <thead><th>Day</th><th>Mile</th><th>Start Time</th><th>End Time</th><th>Food Weight</th><th>Notes</th></thead>
				    <tbody id="schedule"></tbody>
			    </table>
		    </div>
	    </div>
    </div>
	<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB16_kVJjm2plHSOkrxZDC4etbpp6vW8kU&callback=myMap"></script>
    <script>
    "use strict";

    	function myMap()
    	{
	    	var mapProp =
		    {
	    	    center:new google.maps.LatLng(51.508742,-0.120850),
	    	    zoom:5,
	    	    streetViewControl:false,
	    	    fullscreenControl:false,
	    	};
	    	
	    	var map=new google.maps.Map(document.getElementById("googleMap"), mapProp);
    	} 
	
		function calculate ()
		{
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
  					let data = JSON.parse(this.responseText);

  					let txt = "";
  					let day = 0;
  					
  					for (let d in data)
  					{
  	  					let ounces = data[d].accumWeight * 0.035274;
  	  					let pounds = Math.floor (ounces / 16.0);
  	  					ounces = Math.round(ounces % 16.0);
  	  	  					
  	  					txt += "<tr>"
  	  	  					+ "<td>" + day + "</td>"
  	  	  					+ "<td>" + data[d].mile + "</td>"
  	  	  					+ "<td>" + data[d].startTime + "</td>"
  	  	  					+ "<td>" + data[d].endTime + "</td>"
  	  	  					+ "<td>" + pounds + " lb " + ounces  + "oz</td>"
  	  	  					+ "<td>" + data[d].notes  + "</td>"
  	  	  					+ "</tr>\n";

  	  	  				if (data[d].events.length > 0)
  	  	  				{
  	  				    	txt += "<thead><th></th><th>Mile</th><th>Time</th><th>Type</th><th></th><th></th></thead>";
	  	  	  				
	   	  	  				for (let e in data[d].events)
	  	  	  				{
	  	  	  	  				txt += "<tr>"
	  	  	  	  	  				+ "<td></td>"
	  	  	  	  	  				+ "<td>" + data[d].events[e].mile + "</td>"
	  	  	  	  	  				+ "<td>" + data[d].events[e].time + "</td>"
	  	  	  	  	  				+ "<td>" + data[d].events[e].type + "</td>"
	  	  	  	  	  				+ "<td></td>"
	  	  	  	  	  				+ "<td>" + data[d].events[e].notes + "</td>"
	  	  	  	  	  				+ "</tr>\n";
	  	  	  				}
  	  	  				}
  	  	  				
  	  					day++;
  					}

					document.getElementById ("schedule").innerHTML = txt;
 				}
			}

			xmlhttp.open("GET", "calculate.php?id=" + <?php echo $_SESSION["userId"]?>, true);
			//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send();
		}

		myMap ();
		calculate ();
		
	</script>
</body>
</html>
