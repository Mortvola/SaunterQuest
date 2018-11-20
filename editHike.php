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
		.grid-container
		{
		  display: grid;
		  grid-template-columns: auto auto auto;
		  justify-content: space-between;
		}
		.context-menu
		{
			position: absolute;
			background: white;
			padding: 3px;
			color: #666;
			font-weight: bold;
			border: 1px solid #999;
			font-family: sans-serif;
			font-size: 12px;
			box-shadow: 1px 3px 3px rgba(0, 0, 0, .3);
			margin-top: -10px;
			margin-left: 10px;
			cursor: pointer;
		}
		.context-menu:hover
		{
			background: #eee;
		}
	</style>
</head>
<body>
	<div class="container-fluid" style="position:absolute;top:0;left:0;bottom:0;right:0;padding:0">
		<div class="col-md-8" style="padding:0;height:100%">
			<div id="googleMap" style="width:100%;height:100%"></div>
		</div>
		<div class="col-md-4" style="height:100%;padding:0px 5px 0px 5px">
			<div style="display:grid;height:100%">
				<nav>
					<ul class="nav nav-tabs" role="tablist">
						<li role="presentation" class="active"><a href="#">Itinerary</a></li>
						<li role="presentation"><a href="#">Hiker Profiles</a></li>
						<li role="presentation"><a href="#">Equipment</a></li>
						<li role="presentation"><a href="#">Trail Conditions</a></li>
					</ul>
				</nav>
				<div id="schedule" style="overflow:scroll;width:100%;height:100%;">
				</div>
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
	
		function attachMessage (marker, message)
		{
			var infoWindow = new google.maps.InfoWindow({content: message});
			
				marker.addListener ("click", function () {infoWindow.open(map, marker);});
		}
		
		function setPointsOfInterest()
		{
			if (map && markers.length > 0)
			{
				for (let poi in markers)
				{
					var marker = new google.maps.Marker({position: markers[poi], map: map, label:markers[poi].label});
	
					if (markers[poi].label == "R")
					{
						attachMessage(marker, "Resupply");
					}
					else if (markers[poi].day)
					{
						attachMessage(marker, "Day " + markers[poi].day);
					}
				}
			}
		}
	
		function addResupply (position)
		{
				var xmlhttp = new XMLHttpRequest ();
				xmlhttp.onreadystatechange = function ()
				{
					if (this.readyState == 4 && this.status == 200)
					{
					}
				}
				
				xmlhttp.open("POST", "addPOI.php", true);
				xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlhttp.send("location=" + JSON.stringify(position.toJSON()));
		}
	
		function initializeContextMenu ()
		{
			ContextMenu.prototype = new google.maps.OverlayView ();
	
			ContextMenu.prototype.open = function (map, event)
			{
				this.set('position', event.latLng);
				
				this.setMap(map);
				this.draw ();
			};
	
			ContextMenu.prototype.draw = function()
			{
					var position = this.get('position');
					var projection = this.getProjection();
	
					if (position && projection)
					{
						var point = projection.fromLatLngToDivPixel(position);
						this.div_.style.top = point.y + 'px';
						this.div_.style.left = point.x + 'px';
					}
				};
	
			ContextMenu.prototype.onAdd = function ()
			{
					var contextMenu = this;
					var map = this.getMap ();
					
					this.getPanes().floatPane.appendChild(this.div_);
					
					// mousedown anywhere on the map except on the menu div will close the
					// menu.
					this.divListener_ = google.maps.event.addDomListener(map.getDiv(), 'mousedown', function(event)
					{
					if (event.target != contextMenu.div_)
					{
						contextMenu.close();
					}
					}, true);
				};
					
			ContextMenu.prototype.onRemove = function ()
			{
					google.maps.event.removeListener(this.divListener_);
					this.div_.parentNode.removeChild(this.div_);
					
					// clean up
					this.set('position');
			};
	
			ContextMenu.prototype.close = function ()
			{
				this.setMap(null);
			};
	
			ContextMenu.prototype.addResupply = function ()
			{
					var position = this.get('position');
	
					addResupply(position);
	
					this.close ();
			};
		}
	
		function ContextMenu ()
		{
			this.div_ = document.createElement ('div');
				this.div_.className = 'context-menu';
			this.div_.innerHTML = 'Add Resupply';
			
				var menu = this;
				google.maps.event.addDomListener(this.div_, 'click', function()
				{
				menu.addResupply ();
				});
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
						
				initializeContextMenu ();
				
					var contextMenu = new ContextMenu ();
					
					route.addListener ("rightclick", function (event) {contextMenu.open (map, event); });
			}
		}
	
		function myMap()
		{
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
	
		function metersToMiles (meters)
		{
			return Math.round(parseFloat(meters) / 1609.34 * 10) / 10;
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
					let day = 1;
					
					for (let d in data)
					{
						let ounces = data[d].accumWeight * 0.035274;
						let pounds = Math.floor (ounces / 16.0);
						ounces = Math.round(ounces % 16.0);

						txt += "<div class='panel panel-default'>";
						txt += "<div class='panel-heading'>";
						txt += "<div class='grid-container'>";
						txt += "<div>" + "Day " + day + "</div>";
						txt += "<div>" + "Gain/Loss: " + Math.round(data[d].gain) + "/" + Math.round(data[d].loss) + "</div>";
						txt += "<div>" + "Food: " + pounds + " lb " + ounces  + " oz" + "</div>";
						txt += "<div>" + "" + "</div>";
						txt += "<div>" + "Miles: " + metersToMiles (data[d].distance) + "</div>";
						txt += "</div>";
						txt += "</div>";
							
						txt += "<div>" + timeFormat(data[d].startTime) + ", " + "mile " + metersToMiles (data[d].mile) + ": start" + "</div>";
						
						if (data[d].events.length > 0)
						{
							for (let e in data[d].events)
							{
								txt += "<div>" + timeFormat(data[d].events[e].time) + ", " + "mile " + metersToMiles (data[d].events[e].mile) + ": " + data[d].events[e].type + "</div>";

								markers.push({lat: parseFloat(data[d].events[e].lat), lng: parseFloat(data[d].events[e].lng), label:"R"});
							}
						}

						if (d < data.length - 1)
						{
							txt += "<div>" + timeFormat(data[d].endTime) + ", " + "mile " + metersToMiles (data[parseInt(d) + 1].mile) + ": stop " + "</div>";
						}

						txt += "</div>";
						
						markers.push({lat: parseFloat(data[d].lat), lng: parseFloat(data[d].lng), label:"C", day:day});
						
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
