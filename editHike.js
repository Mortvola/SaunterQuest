"use strict";

var markers = [];
var dayMarkers = [];
var resupplyLocations = [];
var route;
var routeCoords = [];
var routeContextMenu;
var routeContextMenuListener;
var trailConditionMenu;
var trailConditions = [];
var trailConditionMarkers = [];
var temporaryTrailConditionPolyLine;
var editingTrailConditionId = null;
var map;
var data;
var startPosition;
var interfaceMode = "normal";
var markerContextMenu = {};
var resupplyLocationCM = {};
var infoWindow = {};

const routeStrokeWeight = 6;
const trailConditionStrokePadding = 4;

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

function attachInfoWindowMessage (poi, message)
{
	poi.message = message;
	
	return poi.marker.addListener ("click", function ()
	{
		infoWindow.setContent (poi.message);
		infoWindow.open(map, poi.marker);
	});
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
	interfaceMode = "routeMeasurement";
}

function routeClick (position)
{
	if (interfaceMode == "routeMeasurement")
	{
		measureRouteDistance (startPosition, position);
	}

	interfaceMode = "normal";
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
		
		// Compute the distance between the start point and the start segment (the
		// start point might be int he middle of a segment)
		let startDistance = google.maps.geometry.spherical.computeDistanceBetween(
				startPosition,
				new google.maps.LatLng(routeCoords[startSegment + 1].lat, routeCoords[startSegment + 1].lng));		

		for (let r = startSegment + 1; r < endSegment; r++)
		{
			distance += google.maps.geometry.spherical.computeDistanceBetween(
				new google.maps.LatLng(routeCoords[r].lat, routeCoords[r].lng),
				new google.maps.LatLng(routeCoords[r + 1].lat, routeCoords[r + 1].lng));		
		}

		// Compute the distance between the end segment and the end point (the
		// start point might be int he middle of a segment)
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


function trailConditionPolylineCreate (startPosition, endPosition, color)
{
	let startSegment = findNearestSegment(startPosition);
	let endSegment = findNearestSegment(endPosition);

	let polyline = [];
	
	if (startSegment != endSegment)
	{
		//
		// Swap the values if needed.
		//
		if (startSegment > endSegment)
		{
			endSegment = [startSegment, startSegment=endSegment][0];
			endPosition = [startPosition, startPosition=endPosition][0];
		}
		
		// Compute the distance between the start point and the start segment (the
		// start point might be int he middle of a segment)
		polyline.push({lat: startPosition.lat(), lng: startPosition.lng()});
		
		for (let r = startSegment + 1; r <= endSegment; r++)
		{
			polyline.push({lat: routeCoords[r].lat, lng: routeCoords[r].lng});
		}

		// Compute the distance between the end segment and the end point (the
		// start point might be int he middle of a segment)
		polyline.push({lat: endPosition.lat(), lng: endPosition.lng()});
	}
	
	var polyLine = new google.maps.Polyline({
		path: polyline,
		geodesic: true,
		strokeColor: color,
		strokeOpacity: 1.0,
		strokeWeight: routeStrokeWeight + 2 * trailConditionStrokePadding,
		zIndex: 10});

	polyLine.setMap(map);

	return polyLine;
}

function sqr(x)
{
	return x * x;
}

function distSquared(v, w)
{
	return sqr(v.x - w.x) + sqr(v.y - w.y)
}

function nearestPointOnSegment (p, v, w)
{
	// Check to see if the line segment is really just a point. If so, return the distance between
	// the point and one of the points of the line segment.
	var l2 = distSquared(v, w);
	if (l2 == 0)
	{
		return v;
	}

	var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	t = Math.max(0, Math.min(1, t));

	return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
}


function distToSegmentSquared(p, v, w)
{
	// Check to see if the line segment is really just a point. If so, return the distance between
	// the point and one of the points of the line segment.
//	var l2 = distSquared(v, w);
//	if (l2 == 0)
//	{
//		return distSquared(p, v);
//	}
//
//	var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
//	t = Math.max(0, Math.min(1, t));
//
//	return distSquared(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
	
	let l = nearestPointOnSegment (p, v, w);
	
	return distSquared(p, l);
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
	positionMapToBounds ({lat: data[d].lat, lng: data[d].lng}, {lat: data[d+1].lat, lng: data[d+1].lng});
}


function positionMapToBounds (p1, p2)
{
	var bounds = {};

	if (p1.lng < p2.lng)
	{
		bounds.east = p2.lng;
		bounds.west = p1.lng;
	}
	else
	{
		bounds.east = p1.lng;
		bounds.west = p2.lng;
	}

	if (p1.lat < p2.lat)
	{
		bounds.north = p2.lat;
		bounds.south = p1.lat;
	}
	else
	{
		bounds.north = p1.lat;
		bounds.south = p2.lat;
	}

	map.fitBounds(bounds);
}


function setRouteContextMenu (contextMenu)
{
	if (routeContextMenuListener)
	{
		google.maps.event.removeListener (routeContextMenuListener);
	}
	
	routeContextMenuListener = route.addListener ("rightclick", function (event) {contextMenu.open (map, event); });
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
		
		route = new google.maps.Polyline({
			path: routeCoords,
			geodesic: true,
			strokeColor: '#0000FF',
			strokeOpacity: 1.0,
			strokeWeight: routeStrokeWeight,
			zIndex: 20});

		route.setMap(map);

		route.addListener ("click", function (event) { routeClick (event.latLng); });

		routeContextMenu = new ContextMenu ([
			{title:"Add Point of Interest", func:addPointOfInterest},
			{title:"Measure route distance", func:startRouteMeasurement},
			{title:"Add Note"}]);

		trailConditionMenu = new ContextMenu ([
			{title:"Set start marker", func:setStartMarker},
			{title:"Set end marker", func:setEndMarker}]);

		setRouteContextMenu (routeContextMenu);
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
	
	infoWindow = new google.maps.InfoWindow({content: "This is a test"});

	retrieveRoute ();
	retrieveResupplyLocations ();
	retrieveHikerProfiles (); //todo: only do this when visiting the tab of hiker profiles
	retrieveTrailConditions ();
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
						}
						else
						{
							markers[m].poiId = data[d].events[e].poiId;
							markers[m].lat = parseFloat(data[d].events[e].lat);
							markers[m].lng = parseFloat(data[d].events[e].lng);
							
							markers[m].marker.setPosition(markers[m]);

							google.maps.event.removeListener (markers[m].listener);
						}

						markers[m].listener = attachInfoWindowMessage(markers[m], "Resupply");
						
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
				}
				else
				{
					dayMarkers[day].lat = parseFloat(data[d].lat);
					dayMarkers[day].lng = parseFloat(data[d].lng);
					dayMarkers[day].day = day;
					
					dayMarkers[day].marker.setPosition(dayMarkers[day]);

					google.maps.event.removeListener (dayMarkers[day].listener);
				}
				
				dayMarkers[day].listener = attachInfoWindowMessage(dayMarkers[day],
					"<div>Day " + dayMarkers[day].day
					+ "</div><div>Mile: " + metersToMiles(data[d].meters)
					+ "</div><div>Elevation: " + metersToFeet(data[d].ele) + "\'</div>");
				
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

					if (resupplyLocations[r].address2 == null)
					{
						resupplyLocations[r].address2 = "";
					}
					
					resupplyLocations[r].listener = attachInfoWindowMessage(resupplyLocations[r],
						"<div>" + resupplyLocations[r].name + "</div>"
						+ "<div>" + resupplyLocations[r].address1 + "</div>"
						+ "<div>" + resupplyLocations[r].address2 + "</div>"
						+ "<div>" + resupplyLocations[r].city + ", " + resupplyLocations[r].state + " " + resupplyLocations[r].zip + "</div>");
				}
			}
		}
	}
	
	xmlhttp.open("GET", "resupplyLocation.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


function resupplyFromLocation (shippingLocationId)
{
	let resupplyEvent = {userHikeId: userHikeId, shippingLocationId: shippingLocationId}

	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
		}
	}
	
	xmlhttp.open("POST", "/resupplyEvent.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(resupplyEvent));
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


function insertTrailCondition ()
{
	var trailCondition = objectifyForm($("#trailConditionForm").serializeArray());
	
	trailCondition.userHikeId = userHikeId;
	
	// Both markers must be placed on the map.
	if (trailConditionMarkers[0] && trailConditionMarkers[0].map
	 && trailConditionMarkers[1] && trailConditionMarkers[1].map)
	{
		trailCondition.startLat = trailConditionMarkers[0].position.lat ();
		trailCondition.startLng = trailConditionMarkers[0].position.lng ();
		trailCondition.endLat = trailConditionMarkers[1].position.lat ();
		trailCondition.endLng = trailConditionMarkers[1].position.lng ();
	
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{
					trailCondition = JSON.parse(this.responseText);
	
					trailCondition.polyLine = trailConditionPolylineCreate (
						new google.maps.LatLng({lat: parseFloat(trailCondition.startLat), lng: parseFloat(trailCondition.startLng)}),
						new google.maps.LatLng({lat: parseFloat(trailCondition.endLat), lng: parseFloat(trailCondition.endLng)}),
						'#FF0000');
					
					trailConditions.push(trailCondition);
	
					$("#conditionsLastRow").before(trailConditionRowGet (trailCondition));
					
					calculate ();
				}

				closeEditTrailConditions ();
			}
		}
		
		xmlhttp.open("POST", "/trailCondition.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/json");
		xmlhttp.send(JSON.stringify(trailCondition));
	}
}


function trailConditionTypeGet (type)
{
	if (type == 0)
	{
		return "No Camping";
	}
	else if (type == 1)
	{
		return "No Stealth Camping";
	}
	else if (type == 2)
	{
		return "Other";
	}
}


function trailConditionRowGet (trailCondition)
{
	let txt = "";
	
	txt += "<tr id='trailCondition_" + trailCondition.trailConditionId + "'>";

	txt += "<td style='display:flex;justify-content:flex-start;'>";
	txt += "<span style='padding-right:15px'>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='viewTrailCondition(" + trailCondition.trailConditionId + ")'><span class='glyphicon glyphicon-eye-open'></span></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='editTrailCondition(" + trailCondition.trailConditionId + ")'><span class='glyphicon glyphicon-pencil'></span></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeTrailCondition(" + trailCondition.trailConditionId + ")'><span class='glyphicon glyphicon-trash'></span></a>";
	txt += "</span>"
	txt += trailConditionTypeGet(trailCondition.type) + "</td>";
	txt += "<td align='left'>" + nvl(trailCondition.description, "") + "</td>";
	txt += "<td align='right'>" + nvl(trailCondition.percentage, 100) + "</td>";

	txt += "</tr>";

	return txt;
}


function getTrailConditionColor (type)
{
	if (type == 0)
	{
		return '#FF0000';
	}
	else if (type == 1)
	{
		return '#FFA500'; //'#FFFF00'; //'#FFD700'
	}
	else
	{
		return '#FF00FF'; //'#C0C0C0'; //'#708090'
	}
}


function retrieveTrailConditions ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			trailConditions = JSON.parse(this.responseText);
			
			let txt = "";

			for (let t in trailConditions)
			{
				trailConditions[t].polyLine = trailConditionPolylineCreate (
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)}),
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)}),
					getTrailConditionColor(trailConditions[t].type));

				txt += trailConditionRowGet (trailConditions[t]);
			}
			
			$("#conditionsLastRow").before(txt);
		}
	}
	
	xmlhttp.open("GET", "/trailCondition.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


function findTrailConditionIndex (trailConditionId)
{
	for (let t in trailConditions)
	{
		if (trailConditions[t].trailConditionId == trailConditionId)
		{
			return t;
		}
	}
	
	return -1;
}


function moveMarkerToTrail (marker, otherMarker)
{
	let segment = findNearestSegment(trailConditionMarkers[marker].position);
	
	let p = nearestPointOnSegment (
		{x: trailConditionMarkers[marker].position.lat(), y: trailConditionMarkers[marker].position.lng()},
		{x: routeCoords[segment].lat, y: routeCoords[segment].lng},
		{x: routeCoords[segment + 1].lat, y: routeCoords[segment + 1].lng});

	trailConditionMarkers[marker].setPosition ({lat: p.x, lng: p.y});

	if (temporaryTrailConditionPolyLine)
	{
		temporaryTrailConditionPolyLine.setMap(null);
	}
	
	// If both markers are on the map then draw a poly line between them on the trail.
	if (trailConditionMarkers[marker] && trailConditionMarkers[marker].map
	 && trailConditionMarkers[otherMarker] && trailConditionMarkers[otherMarker].map)
	{
		temporaryTrailConditionPolyLine = trailConditionPolylineCreate (
			trailConditionMarkers[marker].position, trailConditionMarkers[otherMarker].position,
			'#FF0000');
	}
}


function markerSetup (marker, position, otherMarker)
{
	if (trailConditionMarkers[marker] == undefined)
	{
		trailConditionMarkers[marker] = new google.maps.Marker({
			position: position,
			map: map,
			draggable: true
		});

		trailConditionMarkers[marker].addListener ("dragend", function (event)
		{
			moveMarkerToTrail (marker, otherMarker);
		});
	}
	else
	{
		trailConditionMarkers[marker].setPosition(position);
		trailConditionMarkers[marker].setMap(map);
	}
}


function setStartMarker (position)
{
	markerSetup (0, position, 1);
	
	moveMarkerToTrail (0, 1);
}


function setEndMarker (position)
{
	markerSetup (1, position, 0);

	moveMarkerToTrail (1, 0);
}


function addTrailCondition ()
{
	setRouteContextMenu (trailConditionMenu);

	$("#trailConditionSaveButton").off('click');
	$("#trailConditionSaveButton").click(function () { insertTrailCondition()});

	$("#editTrailConditions").show (250);
}


function viewTrailCondition (trailConditionId)
{
	let t = findTrailConditionIndex(trailConditionId);
	
	if (t > -1)
	{
		let startPosition = {lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)};
		let endPosition = {lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)};

		positionMapToBounds (startPosition, endPosition);
	}
}


function editTrailCondition (trailConditionId)
{
	let t = findTrailConditionIndex(trailConditionId);
	
	if (t > -1)
	{
		let startPosition = {lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)};
		let endPosition = {lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)};
		
		markerSetup (0, startPosition, 1);
		markerSetup (1, endPosition, 0);
		
		positionMapToBounds (startPosition, endPosition);

		temporaryTrailConditionPolyLine = trailConditionPolylineCreate (
			trailConditionMarkers[0].position, trailConditionMarkers[1].position,
			'#FF0000');

		//
		// If we were editing another trail condition polyline then restore it
		//
		if (editingTrailConditionId != null && trailConditionId != editingTrailConditionId)
		{
			let previous = findTrailConditionIndex(editingTrailConditionId);
			
			trailConditions[previous].polyLine.setMap(map);
		}
		
		editingTrailConditionId = trailConditionId;
		
		trailConditions[t].polyLine.setMap(null);
		
		setRouteContextMenu (trailConditionMenu);

		$("#trailConditionForm select[name='type']").val(trailConditions[t].type);
		$("#trailConditionForm input[name='description']").val(trailConditions[t].description);
		$("#trailConditionForm input[name='percentage']").val(nvl(trailConditions[t].percentage, 100));

		$("#trailConditionSaveButton").off('click');
		$("#trailConditionSaveButton").click(function () { updateTrailCondition(trailConditionId)});

		$("#editTrailConditions").show (250);

	}
}


function cancelEditTrailConditions ()
{
	// If we were editing a trail condition then restore its polyline.
	if (editingTrailConditionId != null)
	{
		let t = findTrailConditionIndex (editingTrailConditionId);
		
		if (t > -1)
		{
			trailConditions[t].polyLine.setMap(map);
		}
	
		editingTrailConditionId = null;
	}

	closeEditTrailConditions ();
}


function closeEditTrailConditions ()
{
	$("#editTrailConditions").hide(250);

	trailConditionMarkers[0].setMap(null);
	trailConditionMarkers[1].setMap(null);
	temporaryTrailConditionPolyLine.setMap(null);
	
	setRouteContextMenu (routeContextMenu);
}


function updateTrailCondition (trailConditionId)
{
	var trailCondition = objectifyForm($("#trailConditionForm").serializeArray());
	trailCondition.trailConditionId = trailConditionId;
	
	let t = findTrailConditionIndex (trailConditionId);

	trailCondition.startLat = trailConditionMarkers[0].position.lat ();
	trailCondition.startLng = trailConditionMarkers[0].position.lng ();
	trailCondition.endLat = trailConditionMarkers[1].position.lat ();
	trailCondition.endLng = trailConditionMarkers[1].position.lng ();
	
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4)
		{
			if (this.status == 200)
			{
				let t = findTrailConditionIndex (trailConditionId);
	
				// If there is an existing polyline then remove it from the map.
				if (trailConditions[t].polyLine)
				{
					trailConditions[t].polyLine.setMap(null);
				}
				
				trailConditions[t] = trailCondition;
				
				trailConditions[t].polyLine = trailConditionPolylineCreate (
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)}),
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)}),
					'#FF0000');
	
				$("#trailCondition_" + trailConditionId).replaceWith (trailConditionRowGet(trailCondition));
	
				calculate ();
			}

			closeEditTrailConditions ();
		}
	}
	
	xmlhttp.open("PUT", "/trailCondition.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(trailCondition));
}


function removeTrailCondition (trailConditionId)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let t = findTrailConditionIndex (trailConditionId);
			
			// If there is an existing polyline then remove it from the map.
			if (trailConditions[t].polyLine)
			{
				trailConditions[t].polyLine.setMap(null);
			}

			trailConditions.splice(t, 1);
			
			$("#trailCondition_" + trailConditionId).remove();
			calculate ();
		}
	}
	
	xmlhttp.open("DELETE", "/trailCondition.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(trailConditionId));
}
