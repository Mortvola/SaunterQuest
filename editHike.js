"use strict";

var markers = [];
var dayMarkers = [];
var resupplyLocations = [];
var routeCoords = [];
var map;
var data;
var startPosition;
var routeMeasuringEnabled = false;
var markerContextMenu = {};
var resupplyLocationCM = {};


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
	
	return marker.addListener ("click", function () {infoWindow.open(map, marker);});
}

function removePointOfInterest (marker)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			calculate ();
		}
	}
	
	xmlhttp.open("DELETE", "pointOfInterest.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(markers[marker].poiId));
}

function editPointOfInterest (marker)
{
	$("#myModal").modal ('show');
}

function addPointOfInterest (position)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			calculate();
		}
	}

	xmlhttp.open("POST", "pointOfInterest.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("userHikeId=" + userHikeId + "\&location=" + JSON.stringify(position.toJSON()));
}


function startRouteMeasurement (position)
{
	startPosition = position;
	routeMeasuringEnabled = true;
}

function routeRightClick (position)
{
	if (routeMeasuringEnabled)
	{
		routeMeasuringEnabled = false;
		measureRouteDistance (startPosition, position);
	}
}

function measureRouteDistance (startPosition, endPosition)
{
	let startSegment = findNearestSegment(startPosition);
	
	let endSegment = findNearestSegment(endPosition);
	
	let distance = 0;
	
	if (startSegment == endSegment)
	{
		distance = google.maps.geometry.spherical.computeDistanceBetween(startPosition, endPosition);
	}
	else
	{
		//
		// Swap the values if needed.
		//
		if (startSegment > endSegment)
		{
			endSegment = [startSegment, startSegment=endSegment][0];
		}
		
		let startDistance = google.maps.geometry.spherical.computeDistanceBetween(
				startPosition,
				new google.maps.LatLng(routeCoords[startSegment + 1].lat, routeCoords[startSegment + 1].lng));		

		for (let r = startSegment + 1; r < endSegment; r++)
		{
			distance += google.maps.geometry.spherical.computeDistanceBetween(
				new google.maps.LatLng(routeCoords[r].lat, routeCoords[r].lng),
				new google.maps.LatLng(routeCoords[r + 1].lat, routeCoords[r + 1].lng));		
		}

		let endDistance = google.maps.geometry.spherical.computeDistanceBetween(
				new google.maps.LatLng(routeCoords[endSegment].lat, routeCoords[endSegment].lng),
				endPosition);
		
		distance += startDistance + endDistance;
	}
	
	let miles = metersToMiles(distance);
	if (miles > 0)
	{
		$("#modalBody").html("Distance: " + miles + " miles");
	}
	else
	{
		let feet = metersToFeet(distance);
		$("#modalBody").html("Distance: " + feet + " feet");
	}
	$("#modalTitle").html("Distance");
	$("#modalDialog").modal ('show');
}

function sqr(x)
{
	return x * x;
}

function distSquared(v, w)
{
	return sqr(v.x - w.x) + sqr(v.y - w.y)
}

function distToSegmentSquared(p, v, w)
{
	// Check to see if the line segment is really just a point. If so, return the distance between
	// the point and one of the points of the line segment.
	var l2 = distSquared(v, w);
	if (l2 == 0)
	{
		return distSquared(p, v);
	}

	var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	t = Math.max(0, Math.min(1, t));

	return distSquared(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

function distToSegment(p, v, w)
{
	return Math.sqrt(distToSegmentSquared(p, v, w));
}


function findNearestSegment (position)
{
	let closestEdge = -1;

	//
	// There has to be at least two points in the array. Otherwise, we wouldn't have any edges.
	//
	if (routeCoords.length > 1)
	{
		let shortestDistance;
		
		for (let r = 0; r < routeCoords.length - 1; r++)
		{
			if (r == 0)
			{
				shortestDistance = distToSegmentSquared(
					{x: position.lng(), y: position.lat()},
					{x: routeCoords[r].lng, y: routeCoords[r].lat},
					{x: routeCoords[r + 1].lng, y: routeCoords[r + 1].lat})
				closestEdge = r;
			}
			else
			{
				let distance = distToSegmentSquared(
						{x: position.lng(), y: position.lat()},
						{x: routeCoords[r].lng, y: routeCoords[r].lat},
						{x: routeCoords[r + 1].lng, y: routeCoords[r + 1].lat})

				if (distance < shortestDistance)
				{
					shortestDistance = distance;
					closestEdge = r;
				}
			}
		}
	}
	
	return closestEdge;
}


function displayLocation (position)
{
	$("#modalTitle").html("Distance");
	$("#modalBody").html("Lat: " + position.lat() + " Lng: " + position.lng());
	$("#modalDialog").modal ('show');
}


function addResupplyLocation (position)
{
	$("#resupplyLocationSaveButton").off('click');
	$("#resupplyLocationSaveButton").click(function () { insertResupplyLocation(position); });

	$("#addResupplyLocation").modal ('show');
}

function insertResupplyLocation (position)
{
	var resupplyLocation = objectifyForm($("#resupplyLocationForm").serializeArray());
	
	resupplyLocation.lat = position.lat ();
	resupplyLocation.lng = position.lng ();
	
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			resupplyLocation.shippingLocationId = JSON.parse(this.responseText);

			resupplyLocation.marker = new google.maps.Marker({
				position: {lat: parseFloat(resupplyLocation.lat), lng: parseFloat(resupplyLocation.lng)},
				map: map,
				icon: {
					url: "http://maps.google.com/mapfiles/ms/micons/postoffice-us.png"
				}
			});
			
			let markerIndex = 0; //todo: fix this, it shouldn't be zero.
			resupplyLocation.marker.addListener ("rightclick", function (event) { resupplyLocationCM.open (map, event, markerIndex); });
			
			resupplyLocations.push(resupplyLocation);
		}
	}
	
	xmlhttp.open("POST", "/resupplyLocation.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("userHikeId=" + userHikeId + "\&resupplyLocation=" + JSON.stringify(resupplyLocation));
}


//
// Position the map so that the two endpoints (today's and tomorrow's) are visible.
// todo: take into account the area the whole path uses. Some paths go out of window 
// even though the two endpoints are within the window.
//
function positionMapToDay (d)
{
	var bounds = {};

	if (data[d].lng < data[d + 1].lng)
	{
		bounds.east = data[d + 1].lng;
		bounds.west = data[d].lng;
	}
	else
	{
		bounds.east = data[d].lng;
		bounds.west = data[d + 1].lng;
	}

	if (data[d].lat < data[d + 1].lat)
	{
		bounds.north = data[d + 1].lat;
		bounds.south = data[d].lat;
	}
	else
	{
		bounds.north = data[d].lat;
		bounds.south = data[d + 1].lat;
	}

	map.fitBounds(bounds);
}

function drawRoute ()
{
	if (map && routeCoords.length > 1)
	{
		var bounds = {};
		
		//
		// Traverse route coords and find the bounds
		// todo: this should be part of the file retrieved
		for (let r in routeCoords)
		{
			if (r == 0)
			{
				bounds.east = routeCoords[r].lng;
				bounds.west = routeCoords[r].lng;
				bounds.north = routeCoords[r].lat;
				bounds.south = routeCoords[r].lat;
			}
			else
			{
				if (routeCoords[r].lng > bounds.east)
				{
					bounds.east = routeCoords[r].lng;
				}

				if (routeCoords[r].lng < bounds.west)
				{
					bounds.west = routeCoords[r].lng;
				}
				
				if (routeCoords[r].lat > bounds.north)
				{
					bounds.north = routeCoords[r].lat;
				}

				if (routeCoords[r].lat < bounds.south)
				{
					bounds.south = routeCoords[r].lat;
				}
			}
		}

		map.fitBounds(bounds);
		
		var route = new google.maps.Polyline({
			path: routeCoords,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 4});

		route.setMap(map);

		var routeContextMenu = new ContextMenu ([
			{title:"Add Point of Interest", func:addPointOfInterest},
			{title:"Measure route distance", func:startRouteMeasurement},
			{title:"Add Note"}]);
		
		route.addListener ("click", function (event) { routeRightClick (event.latLng); });
		route.addListener ("rightclick", function (event) {routeContextMenu.open (map, event); });
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
		mapTypeId:"terrain",
	};
	
	map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

	initializeContextMenu ();

	var mapContextMenu = new ContextMenu ([{title:"Create Resupply Location", func:addResupplyLocation},{title:"Display Location", func:displayLocation}]);

	markerContextMenu = new ContextMenu ([
		{title:"Remove Point of Interest", func:removePointOfInterest},
		{title:"Edit Point of Interest", func:editPointOfInterest},
	]);

	resupplyLocationCM = new ContextMenu ([
		{title:"Resupply from this location", func:resupplyFromLocation},
		{title:"Edit Resupply Location", func:editResupplyLocation},
		{title:"Delete Resupply Location", func:deleteResupplyLocation}]);

	map.addListener ("rightclick", function(event) {mapContextMenu.open (map, event);});
	
	retrieveRoute ();
	retrieveResupplyLocations ();
	retrieveHikerProfiles (); //todo: only do this when visiting the tab of hiker profiles
	calculate ();
} 

function metersToMiles (meters)
{
	return Math.round(parseFloat(meters) / 1609.34 * 10) / 10;
}

function metersToFeet (meters)
{
	return Math.round(parseFloat(meters) * 3.281);
}

function gramsToOunces (grams)
{
	return grams * 0.035274;
}

function calculate ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			data = JSON.parse(this.responseText);

			let txt = "";
			let m = 0;
			let d = 0;
			let day = 0;
			
			for (d in data)
			{
				let ounces = gramsToOunces (data[d].accumWeight);
				let pounds = Math.floor (ounces / 16.0);
				ounces = Math.round(ounces % 16.0);

				txt += "<div class='panel panel-default'>";
				txt += "<div class='panel-heading' style='padding:5px 5px 5px 5px' onclick='positionMapToDay(" + d + ")'>";
				txt += "<div class='grid-container'>";
				txt += "<div>" + "Day " + (parseInt(d) + 1) + "</div>";
				txt += "<div>" + "Gain/Loss (feet): " + metersToFeet(data[d].gain) + "/" + metersToFeet(data[d].loss) + "</div>";
				txt += "<div>" + "Food: " + pounds + " lb " + ounces  + " oz" + "</div>";
				txt += "<div>" + "" + "</div>";
				txt += "<div>" + "Miles: " + metersToMiles (data[d].distance) + "</div>";
				txt += "</div>";
				txt += "</div>";
					
				txt += "<div style='padding:2px 2px 2px 2px'>" + timeFormat(data[d].startTime) + ", " + "mile " + metersToMiles (data[d].meters) + ": start" + "</div>";
				
				if (data[d].events.length > 0)
				{
					for (let e in data[d].events)
					{
						txt += "<div style='padding:2px 2px 2px 2px'>" + timeFormat(data[d].events[e].time) + ", " + "mile " + metersToMiles (data[d].events[e].meters) + ": " + data[d].events[e].type + "</div>";

						if (m >= markers.length)
						{
							// todo: should the marker just have the index to this day and event instead of the POI ID?
							markers.push({poiId: data[d].events[e].poiId, lat: parseFloat(data[d].events[e].lat), lng: parseFloat(data[d].events[e].lng)});
							
							markers[m].marker = new google.maps.Marker({
								position: markers[m],
								map: map,
								icon: {
									url: "http://maps.google.com/mapfiles/ms/micons/blue.png"
								},
							});
							
							let markerIndex = m;
							markers[m].marker.addListener ("rightclick", function (event) { markerContextMenu.open (map, event, markerIndex); });
							markers[m].listener = attachMessage(markers[m].marker, "Resupply");
						}
						else
						{
							markers[m].poiId = data[d].events[e].poiId;
							markers[m].lat = parseFloat(data[d].events[e].lat);
							markers[m].lng = parseFloat(data[d].events[e].lng);
							
							markers[m].marker.setPosition(markers[m]);
							
							//attachMessage(markers[m].marker, "Resupply");
						}

						m++;
					}
				}

				if (d < data.length - 1)
				{
					txt += "<div style='padding:2px 2px 2px 2px'>" + timeFormat(data[d].endTime) + ", " + "mile " + metersToMiles (data[parseInt(d) + 1].meters) + ": stop " + "</div>";
				}

				txt += "</div>";
				
				if (day >= dayMarkers.length)
				{
					dayMarkers.push({lat: parseFloat(data[d].lat), lng: parseFloat(data[d].lng), day:parseInt(d)});

					dayMarkers[day].marker = new google.maps.Marker({
						position: dayMarkers[day],
						map: map,
						icon: {
							url: "http://maps.google.com/mapfiles/ms/micons/campground.png"
						},
					});
					
					dayMarkers[day].listener = attachMessage(dayMarkers[day].marker, "<div>Day " + dayMarkers[day].day
							+ "</div><div>Mile: " + metersToMiles(data[d].meters)
							+ "</div><div>Elevation: " + metersToFeet(data[d].ele) + "\'</div>");
				}
				else
				{
					dayMarkers[day].lat = parseFloat(data[d].lat);
					dayMarkers[day].lng = parseFloat(data[d].lng);
					dayMarkers[day].day = day;
					
					dayMarkers[day].marker.setPosition(dayMarkers[day]);

					google.maps.event.removeListener (dayMarkers[day].listener);
					dayMarkers[day].listener = attachMessage(dayMarkers[day].marker, "<div>Day " + dayMarkers[day].day
							+ "</div><div>Mile: " + metersToMiles(data[d].meters)
							+ "</div><div>Elevation: " + metersToFeet(data[d].ele) + "\'</div>");
				}
				
				day++;
			}

			document.getElementById ("schedule").innerHTML = txt;

			//
			// Remove any remaining markers at the end of the array that are in
			// excess.
			//
			if (m < markers.length)
			{
				for (let i = m; i < markers.length; i++)
				{
					markers[i].marker.setMap(null);
					markers[i].marker = null;
					google.maps.event.removeListener (markers[i].listener);
				}
				
				markers.splice(m, markers.length - m);
			}
			
			if (day < dayMarkers.length)
			{
				for (let i = day; i < dayMarkers.length; i++)
				{
					dayMarkers[i].marker.setMap(null);
					dayMarkers[i].marker = null;
					google.maps.event.removeListener (dayMarkers[i].listener);
				}
				
				dayMarkers.splice(day, dayMarkers.length - day);
			}
		}
	}

	xmlhttp.open("GET", "calculate.php?id=" + userHikeId, true);
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
	
	// todo: the parameter needs to be dynamic to retrieve the correct route.
	xmlhttp.open("GET", "getRoute.php?id=0", true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}

function retrieveResupplyLocations ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			resupplyLocations = JSON.parse(this.responseText);
			
			if (map)
			{
				for (let r in resupplyLocations)
				{
					resupplyLocations[r].marker = new google.maps.Marker({
						position: {lat: parseFloat(resupplyLocations[r].lat), lng: parseFloat(resupplyLocations[r].lng)},
						map: map,
						icon: {
							url: "http://maps.google.com/mapfiles/ms/micons/postoffice-us.png"
						}
					});
					
					let shippingLocationId = resupplyLocations[r].shippingLocationId;
					resupplyLocations[r].marker.addListener ("rightclick", function (event) { resupplyLocationCM.open (map, event, shippingLocationId); });
					//resupplyLocations[r].listener = attachMessage(markers[m].marker, "Resupply");
				}
			}
		}
	}
	
	xmlhttp.open("GET", "resupplyLocation.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


function resupplyFromLocation ()
{
}


function findResupplyLocationIndex (shippingLocationId)
{
	for (let h in resupplyLocations)
	{
		if (resupplyLocations[h].shippingLocationId == shippingLocationId)
		{
			return h;
		}
	}
	
	return -1;
}


function editResupplyLocation (shippingLocationId)
{
	//
	// Find the resupply location using the shippingLocationId.
	//
	let h = findResupplyLocationIndex (shippingLocationId);
	
	if (h > -1)
	{
		$("input[name='name']").val(resupplyLocations[h].name);
		$("input[name='inCareOf']").val(resupplyLocations[h].inCareOf);
		$("input[name='address1']").val(resupplyLocations[h].address1);
		$("input[name='address2']").val(resupplyLocations[h].address2);
		$("input[name='city']").val(resupplyLocations[h].city);
		$("input[name='state']").val(resupplyLocations[h].state);
		$("input[name='zip']").val(resupplyLocations[h].zip);
		
		$("#resupplyLocationSaveButton").off('click');
		$("#resupplyLocationSaveButton").click(function () { updateResupplyLocation(shippingLocationId)});
		
		$("#addResupplyLocation").modal ('show');
	}
}

function updateResupplyLocation (shippingLocationId)
{
	var resupplyLocation = objectifyForm($("#resupplyLocationForm").serializeArray());
	resupplyLocation.shippingLocationId = shippingLocationId;
	
	let h = findResupplyLocationIndex (shippingLocationId);

	resupplyLocation.lat = resupplyLocations[h].lat;
	resupplyLocation.lng = resupplyLocations[h].lng;
	
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let h = findResupplyLocationIndex (shippingLocationId);
			resupplyLocations[h] = resupplyLocation;
		}
	}
	
	xmlhttp.open("PUT", "/resupplyLocation.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(resupplyLocation));
}


function deleteResupplyLocation ()
{
}
