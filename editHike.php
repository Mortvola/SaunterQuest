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

$hikeId = $_GET["orig"];
$userHikeId = $_GET["id"];

if ($hikeId)
{
	$sql = "select name
 			from hike
 			where hikeId = :hikeId";
	
	if ($stmt = $pdo->prepare($sql))
	{
 		$stmt->bindParam(":hikeId", $paramHikeId, PDO::PARAM_INT);
 		
 		$paramHikeId = $hikeId;
 		
 		$stmt->execute ();
		
 		$hike = $stmt->fetchAll (PDO::FETCH_ASSOC);
		
 		unset ($stmt);
		
 		$sql = "insert into userHike (creationDate, modificationDate, hikeId, userId, name)
 				values (now(), now(), :hikeId, :userId, :name)";
		
 		if ($stmt = $pdo->prepare($sql))
 		{
 			$stmt->bindParam(":hikeId", $paramHikeId, PDO::PARAM_INT);
 			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
 			$stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
			
 			$paramHikeId = $hikeId;
 			$paramUserId = $_SESSION["userId"];
 			$paramName = $hike[0]["name"]." Test Hike";
			
 			$stmt->execute ();
			
 			$userHikeId = $pdo->lastInsertId ("userHikeId");
 			
 			unset ($stmt);
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
    <script>
    "use strict";

    	var markers = [];
    	var routeCoords = [];
    	var map;

    	function timeFormat (t)
    	{
        	let h = Math.floor(t);
        	let m = Math.floor(((t * 60) % 60));

        	let formattedTime = "";
        	
        	formattedTime += h;

        	if (m < 10)
        	{
            	formattedTime += ":0" + m;
        	}
        	else
        	{
            	formattedTime += ":" + m;
        	}
        	
        	return formattedTime;
    	}
    	
    	function setPointsOfInterest()
    	{
        	if (map && markers.length > 0)
        	{
	        	for (let poi in markers)
	        	{
			    	var marker = new google.maps.Marker({position: markers[poi], map: map, label:markers[poi].label});
	        	}
        	}
    	}

    	function routeClicked (event)
    	{
			console.log ("routeClicked edge: ", event.edge, " path: ", event.path, " vertex: ", event.vertex, " latLng: ", event.latLng.toString());

			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
				}
			}
			
			xmlhttp.open("POST", "addPOI.php", true);
			xmlhttp.setRequestHeader("Content-type", "application/json");
			xmlhttp.send(JSON.stringify(event.latLng.toJSON()));
    	}
    	
    	function drawRoute ()
    	{
        	if (map && routeCoords.length > 0)
        	{
			    var route = new google.maps.Polyline({
				    path: routeCoords,
				    geodesic: true,
				    strokeColor: '#FF0000',
				    strokeOpacity: 1.0,
				    strokeWeight: 4});
	
			    route.setMap(map);

			    route.addListener ("click", routeClicked);
        	}
    	}
    	
    	function myMap()
    	{
			console.log ("map response");
        	
	    	var mapProp =
		    {
	    	    center:new google.maps.LatLng(31.4971635304391,-108.210319317877),
	    	    zoom:5,
	    	    streetViewControl:false,
	    	    fullscreenControl:false,
	    	};
	    	
	    	map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

		    drawRoute ();
		    
	    	setPointsOfInterest ();
    	} 
	
		function calculate ()
		{
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
					console.log ("data response");
					
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
  	  	  					+ "<td>" + Math.round(parseFloat(data[d].mile) / 1609.34 * 10) / 10 + "</td>"
  	  	  					+ "<td>" + timeFormat(data[d].startTime) + "</td>"
  	  	  					+ "<td>" + timeFormat(data[d].endTime) + "</td>"
  	  	  					+ "<td>" + pounds + " lb " + ounces  + " oz</td>"
  	  	  					+ "<td>" + data[d].notes  + "</td>"
  	  	  					+ "</tr>\n";

  	  	  				if (data[d].events.length > 0)
  	  	  				{
  	  				    	txt += "<thead><th></th><th>Mile</th><th>Time</th><th>Type</th><th></th><th></th></thead>";
	  	  	  				
	   	  	  				for (let e in data[d].events)
	  	  	  				{
	  	  	  	  				txt += "<tr>"
	  	  	  	  	  				+ "<td></td>"
	  	  	  	  	  				+ "<td>" + Math.round(parseFloat(data[d].events[e].mile) / 1609.34 * 10) / 10 + "</td>"
	  	  	  	  	  				+ "<td>" + timeFormat(data[d].events[e].time) + "</td>"
	  	  	  	  	  				+ "<td>" + data[d].events[e].type + "</td>"
	  	  	  	  	  				+ "<td></td>"
	  	  	  	  	  				+ "<td>" + data[d].events[e].notes + "</td>"
	  	  	  	  	  				+ "</tr>\n";

	  	  	  	  	  			markers.push({lat: parseFloat(data[d].events[e].lat), lng: parseFloat(data[d].events[e].lng), label:"R"});
	  	  	  				}
  	  	  				}

  	  	  				markers.push({lat: parseFloat(data[d].lat), lng: parseFloat(data[d].lng), label:"C"});
  	  	  				
  	  					day++;
  					}

					document.getElementById ("schedule").innerHTML = txt;

				    if (map)
				    {
				    	setPointsOfInterest ();
				    }
 				}
			}

			xmlhttp.open("GET", "calculate.php?id=" + <?php echo $userHikeId?>, true);
			//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send();
		}

		function retrieveRoute ()
		{
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
					routeCoords = JSON.parse(this.responseText);
  					
					if (map)
					{
						drawRoute ();
					}
				}
			}
			
			xmlhttp.open("GET", "getRoute.php?id=0", true);
			//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send();
		}

		retrieveRoute ();
		calculate ();
		
	</script>
	<script async defer
	 src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB16_kVJjm2plHSOkrxZDC4etbpp6vW8kU&callback=myMap&libraries=geometry">
	</script>
</body>
</html>
