"use strict";

var markers = [];
var dayMarkers = [];
var endOfTrailMarker = {};
var resupplyLocations = [];
var route;
var routeCoords = [];
var trail;
var trailCoords = [];
var editedRoute = [];
var routeContextMenu;
var vertexContextMenu;
var routeContextMenuListener;
var vertexContextMenuListener;
var map;
var bounds = {};
var data;
var startPosition;
var startSegment;
var endPosition;
var endSegment;
var markerContextMenu = {};
var resupplyLocationCM = {};
var infoWindow = {};
var editPolyLine = {};

var startPointUrl = "http://maps.google.com/mapfiles/ms/micons/green-dot.png";
var campUrl = "http://maps.google.com/mapfiles/ms/micons/campground.png";
var endPointUrl = "http://maps.google.com/mapfiles/ms/micons/red-dot.png";

const routeStrokeWeight = 6;
const routeHighlightStrokePadding = 4;

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


function addNote (position)
{
}


function editSelection ()
{
	if (startPosition != undefined && endPosition != undefined)
	{
		updateEditedRoute (startPosition, startSegment, endPosition, endSegment);
		
		endRouteHighlighting ();
		
		$("#editRoute").show (250);
		$("#measureRoute").hide (250);
	}
}


//function startRouteEdit (position)
//{
//	setRouteHighlightStartMarker (position, editStartMarkerSet);
//	setRouteHighlightEndMarker (position, editEndMarkerSet);
//	
//	startPosition = position;
//	endPosition = position;
//	
//	startSegment = findNearestSegment(startPosition);
//	endSegment = Math.min(startSegment + 1, routeCoords.length - 1);
//	
//	$("#editRoute").show (250);
//}


function sendPoint (index, vertex)
{
	var xmlhttp = new XMLHttpRequest ();

	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let updatedVertex = JSON.parse(this.responseText);
			
			editedRoute[index].lat = updatedVertex.point.lat;
			editedRoute[index].lng = updatedVertex.point.lng;
			
			var path = editPolyLine.getPath ();
			vertex = new google.maps.LatLng({lat: editedRoute[index].lat, lng: editedRoute[index].lng});
			vertex.moved = true;
			var vertex = path.setAt(index, vertex);
//			editPolyLine.setPath(path);

			updateEditedVertex (index);
			
			if (editedRoute[index - 1].trail != undefined)
			{
				editedRoute[index - 1].trail.setMap(null);
				editedRoute[index - 1].trail = null;
			}
			
			if (updatedVertex.previousTrail != undefined)
			{
				editedRoute[index - 1].trail = new google.maps.Polyline({
					path: updatedVertex.previousTrail,
					editable: false,
					geodesic: true,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: routeStrokeWeight,
					zIndex: 40});
		
				editedRoute[index - 1].trail.setMap(map);
			}

			if (editedRoute[index].trail != undefined)
			{
				editedRoute[index].trail.setMap(null);
				editedRoute[index].trail = null;
			}
			
			if (updatedVertex.nextTrail != undefined)
			{
				editedRoute[index].trail = new google.maps.Polyline({
					path: updatedVertex.nextTrail,
					editable: false,
					geodesic: true,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: routeStrokeWeight,
					zIndex: 40});
		
				editedRoute[index].trail.setMap(map);
			}
		}
	}

	var routeUpdate = {userHikeId: userHikeId, mode: "update", index: startSegment + index, point: {lat: vertex.lat (), lng: vertex.lng ()}};
	
	xmlhttp.open("PUT", "route.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(routeUpdate));
}

function deletePoints (index, length)
{
	var xmlhttp = new XMLHttpRequest ();

	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let trail = JSON.parse(this.responseText);

			if (editedRoute[index - 1].trail != undefined)
			{
				editedRoute[index - 1].trail.setMap(null);
				editedRoute[index - 1].trail = null;
			}
			
			if (trail.length > 0)
			{
				editedRoute[index - 1].trail = new google.maps.Polyline({
					path: trail,
					editable: false,
					geodesic: true,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: routeStrokeWeight,
					zIndex: 40});
		
				editedRoute[index - 1].trail.setMap(map);
			}
		}
	}

	var routeUpdate = {userHikeId: userHikeId, mode: "delete", index: startSegment + index, length: length};
	
	xmlhttp.open("PUT", "route.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(routeUpdate));
}

function sendRouteEdits ()
{
	var xmlhttp = new XMLHttpRequest ();

	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
//			editedRoute[i].ele = JSON.parse(this.responseText);
//			
//			getAndLoadElevationData (0, editedRoute.length, editedRoute);
		}
	}
	
	var routeUpdate = {userHikeId: userHikeId, start: startSegment, end: endSegment, points: editedRoute};
	
	xmlhttp.open("PUT", "route.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(routeUpdate));
}

function stopRouteEdit ()
{
	//endRouteHighlighting ();
	
	if (editPolyLine != undefined && editPolyLine.setMap != undefined)
	{
		editPolyLine.setMap(null);
		editPolyLine = null;
	}

	routeCoords.splice (startSegment + 1, endSegment - startSegment, ...editedRoute);
	
	sendRouteEdits ();
	
	startPosition = undefined;
	endPosition = undefined;
	
	startSegment = undefined;
	endSegment = undefined;
	
	$("#editRoute").hide(250);

	drawRoute ();
	getAndLoadElevationData (0, routeCoords.length, routeCoords);
}


//function editStartMarkerSet (position, segment)
//{
//	startPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
//	startSegment = segment;
//	
//	if (startPosition != undefined && endPosition != undefined)
//	{
//		updateEditedRoute (startPosition, startSegment, endPosition, endSegment);
//	}
//}

//function editEndMarkerSet (position, segment)
//{
//	endPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
//	endSegment = Math.min(segment + 1, routeCoords.length - 1);
//
//	if (startPosition != undefined && endPosition != undefined)
//	{
//		updateEditedRoute (startPosition, startSegment, endPosition, endSegment);
//	}
//}

function updateEditedRoute (startPosition, startSegment, endPosition, endSegment)
{
	//
	// Swap the values if needed.
	//
	if (startSegment > endSegment)
	{
		endSegment = [startSegment, startSegment=endSegment][0];
		endPosition = [startPosition, startPosition=endPosition][0];
	}
	
	editedRoute = [];

	let delta = google.maps.geometry.spherical.computeDistanceBetween(
		startPosition,
		new google.maps.LatLng(routeCoords[startSegment]));		

	editedRoute.push({
		lat: startPosition.lat (),
		lng: startPosition.lng (),
		dist: routeCoords[startSegment].dist + delta,
		ele: (routeCoords[startSegment + 1].ele - routeCoords[startSegment].ele) / 2 + routeCoords[startSegment].ele
	});
	
	if (startSegment != endSegment)
	{
		for (let r = startSegment + 1; r <= endSegment; r++)
		{
			editedRoute.push(routeCoords[r]);
		}
	}

	delta = google.maps.geometry.spherical.computeDistanceBetween(
		endPosition,
		new google.maps.LatLng(routeCoords[endSegment]));		

	editedRoute.push({
		lat: endPosition.lat (),
		lng: endPosition.lng (),
		dist: routeCoords[endSegment].dist + delta,
		ele: (routeCoords[endSegment + 1].ele - routeCoords[endSegment].ele) / 2 + routeCoords[endSegment].ele
	});

	createEditablePolyline ();
}

function vertexInserted (index)
{
	var path = editPolyLine.getPath ();
	
	var vertex = path.getAt(index);

	editedRoute.splice (index, 0, {lat: vertex.lat (), lng: vertex.lng ()});
	
	updateEditedVertex (index);
}


function vertexUpdated (index)
{
	var path = editPolyLine.getPath ();
	
	var vertex = path.getAt(index);

	if (vertex.moved != undefined && vertex.moved)
	{
		vertex.moved = false;
	}
	else
	{
		sendPoint (index, vertex);
	}
}

function updateEditedVertex (index)
{
	var xmlhttp = new XMLHttpRequest ();

	function setReadyStateChange (i)
	{
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				editedRoute[i].ele = JSON.parse(this.responseText);
				
				getAndLoadElevationData (0, editedRoute.length, editedRoute);
			}
		}
	}
	
	setReadyStateChange(index);
	
	xmlhttp.open("GET", "elevation.php?lat=" + editedRoute[index].lat + "&lng=" + editedRoute[index].lng, true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();

	// Update the distance data members.
	var position1 = new google.maps.LatLng(editedRoute[index - 1]);
	var position2 = new google.maps.LatLng(editedRoute[index]);
	var delta = google.maps.geometry.spherical.computeDistanceBetween(position1, position2);
	editedRoute[index].dist = editedRoute[index - 1].dist + delta;

	var position3 = new google.maps.LatLng(editedRoute[index + 1]);
	delta = google.maps.geometry.spherical.computeDistanceBetween(position2, position3);
	
	var newDistance = editedRoute[index].dist + delta

	for (++index; index < editedRoute.length - 1; index++)
	{
		delta = editedRoute[index + 1].dist - editedRoute[index].dist;
		editedRoute[index].dist = newDistance;
		newDistance = editedRoute[index].dist + delta;
	}

	editedRoute[index].dist = newDistance;
}


function createEditablePolyline ()
{
	if (editPolyLine != undefined && editPolyLine.setMap != undefined)
	{
		editPolyLine.setMap(null);
	}
	
	editPolyLine = new google.maps.Polyline({
		path: editedRoute,
		editable: true,
		geodesic: true,
		strokeColor: '#0000FF',
		strokeOpacity: 1.0,
		strokeWeight: routeStrokeWeight,
		zIndex: 30});

	google.maps.event.addListener(editPolyLine.getPath(), "insert_at", vertexInserted);
	google.maps.event.addListener(editPolyLine.getPath(), "set_at", vertexUpdated);
	
	editPolyLine.setMap(map);

	if (vertexContextMenuListener)
	{
		google.maps.event.removeListener (vertexContextMenuListener);
	}
	
	vertexContextMenuListener = editPolyLine.addListener ("rightclick", function (event) { if (event.vertex != undefined) { vertexContextMenu.open (map, event); }});

	getAndLoadElevationData (0, editedRoute.length, editedRoute);
}


function deleteVertex (index)
{
	deletePoints (index, 1);
	
	editPolyLine.getPath ().removeAt (index);
}

function clearVertices ()
{
	editedRoute = [];

	editedRoute.push(routeCoords[startSegment]);
	editedRoute.push(routeCoords[endSegment]);

	deletePoints (1, endSegment - startSegment + 1);
	
	createEditablePolyline ();
}


function recalculateDistances ()
{
	for (let r in routeCoords)
	{
		if (r == 0)
		{
			routeCoords[0].dist = 0;
		}
		else
		{
			let delta = google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(routeCoords[r - 1]),
					new google.maps.LatLng(routeCoords[r]));
			
			routeCoords[r].dist = routeCoords[r - 1].dist + delta;
		}
	}
	
	drawRoute ();
	getAndLoadElevationData (0, routeCoords.length, routeCoords);
	calculate ();
}


function measureStartMarkerSet (position, segment)
{
	startPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
	startSegment = segment;
	
	measureRouteDistance (startPosition, startSegment, endPosition, endSegment);
	displayRouteElevations (startSegment, endSegment);
}

function measureEndMarkerSet (position, segment)
{
	endPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
	endSegment = segment;
	
	measureRouteDistance (startPosition, startSegment, endPosition, endSegment);
	displayRouteElevations (startSegment, endSegment);
}

function startRouteMeasurement (position)
{
	setRouteHighlightStartMarker (position, measureStartMarkerSet);
	setRouteHighlightEndMarker (position, measureEndMarkerSet);
	
	startPosition = position;
	endPosition = position;

	startSegment = findNearestSegment(startPosition);
	endSegment = startSegment;

	$("#measureRoute").show (250);
}


function stopRouteMeasurement ()
{
	endRouteHighlighting ();

	startPosition = undefined;
	endPosition = undefined;
	
	$("#measureRoute").hide(250);

	getAndLoadElevationData (0, routeCoords.length, routeCoords);
}


function measureRouteDistance (startPosition, startSegment, endPosition, endSegment)
{
	let distance = 0;
	
	if (startPosition != undefined && endPosition != undefined)
	{
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
				endPosition = [startPosition, startPosition=endPosition][0];
			}
			
			// Compute the distance between the start point and the start segment (the
			// start point might be in the middle of a segment)
			let startDistance = google.maps.geometry.spherical.computeDistanceBetween(
					startPosition,
					new google.maps.LatLng(routeCoords[startSegment + 1]));		
	
			for (let r = startSegment + 1; r < endSegment; r++)
			{
				distance += google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(routeCoords[r]),
					new google.maps.LatLng(routeCoords[r + 1]));		
			}
	
			// Compute the distance between the end segment and the end point (the
			// end point might be int he middle of a segment)
			let endDistance = google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(routeCoords[endSegment]),
					endPosition);
			
			distance += startDistance + endDistance;
		}
		
		// If less than a 0.10 miles then measure in feet, otherwise measure in
		// miles.
		if (distance >= 160.934)
		{
			let miles = metersToMilesRounded(distance);
			$("#distance").html(miles + " miles");
		}
		else
		{
			let feet = metersToFeet(distance);
			$("#distance").html(feet + " feet");
		}
	}
}


function getAndLoadElevationData (s, e, route)
{
	elevationData = [];
	
	elevationData.push([{label: 'Distance', type: 'number'}, {label: 'Elevation', type: 'number'}]);
	
	elevationMin = metersToFeet(route[s].ele);
	elevationMax = elevationMin;
	
	for (let r = s; r < e;  r++)
	{
		if (!isNaN(route[r].ele) && route[r].ele !== null)
		{
			elevationData.push([metersToMiles(route[r].dist), metersToFeet(route[r].ele)]);
			
			elevationMin = Math.min(elevationMin, metersToFeet(route[r].ele));
			elevationMax = Math.max(elevationMax, metersToFeet(route[r].ele));
			
			if (isNaN(elevationMin))
			{
				console.log("NAN");
			}
		}
	}
	
	loadData ();
}


function displayRouteElevations (startSegment, endSegment)
{
	let distance = 0;
	
	if (startSegment != undefined && endSegment != undefined)
	{
		if (startSegment == endSegment)
		{
			if (endSegment + 1 < routeCoords.length)
			{
				getAndLoadElevationData (startSegment, endSegment + 1, routeCoords);
			}
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
			
			getAndLoadElevationData (startSegment, Math.min(endSegment + 1, routeCoords.length), routeCoords);
		}
	}
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
			let distance = distToSegmentSquared(
				{x: position.lng(), y: position.lat()},
				{x: routeCoords[r].lng, y: routeCoords[r].lat},
				{x: routeCoords[r + 1].lng, y: routeCoords[r + 1].lat});

			if (r == 0 || distance < shortestDistance)
			{
				shortestDistance = distance;
				closestEdge = r;
			}
		}
	}
	
	return closestEdge;
}


function displayLocation (position)
{
	$("#modalTitle").html("Location");
	$("#modalBody").html("Lat: " + position.lat() + " Lng: " + position.lng());
	$("#modalDialog").modal ('show');
	
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let elevation = JSON.parse(this.responseText);

			$("#modalBody").html("Lat: " + position.lat() + " Lng: " + position.lng() + " Elevation: " + metersToFeet(elevation));

//			resupplyLocation.shippingLocationId = JSON.parse(this.responseText);
//
//			resupplyLocation.marker = new google.maps.Marker({
//				position: {lat: parseFloat(resupplyLocation.lat), lng: parseFloat(resupplyLocation.lng)},
//				map: map,
//				icon: {
//					url: "http://maps.google.com/mapfiles/ms/micons/postoffice-us.png"
//				}
//			});
//			
//			let markerIndex = 0; //todo: fix this, it shouldn't be zero.
//			resupplyLocation.marker.addListener ("rightclick", function (event) { resupplyLocationCM.open (map, event, markerIndex); });
//			
//			resupplyLocations.push(resupplyLocation);
		}
	}
	
	xmlhttp.open("GET", "elevation.php?lat=" + position.lat () + "&lng=" + position.lng (), true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
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

		if (route != undefined)
		{
			route.setMap(null);
		}
		
		route = new google.maps.Polyline({
			path: routeCoords,
			editable: false,
			geodesic: true,
			strokeColor: '#0000FF',
			strokeOpacity: 1.0,
			strokeWeight: routeStrokeWeight,
			zIndex: 20});

		route.setMap(map);
		
		setRouteContextMenu (routeContextMenu);
	}
}

function drawTrails ()
{
	if (map && trailCoords.length > 0)
	{
		for (let t in trailCoords)
		{
//			if (trail != undefined)
//			{
//				trail.setMap(null);
//			}
			
			trail = new google.maps.Polyline({
				path: trailCoords[t],
				editable: false,
				geodesic: true,
				strokeColor: '#00FF00',
				strokeOpacity: 1.0,
				strokeWeight: routeStrokeWeight,
				zIndex: 20});
	
			trail.setMap(map);
		}
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

	var mapContextMenu = new ContextMenu ([
		{title:"Create Resupply Location", func:addResupplyLocation},
		{title:"Display Location", func:displayLocation}]);

	markerContextMenu = new ContextMenu ([
		{title:"Remove Point of Interest", func:removePointOfInterest},
		{title:"Edit Point of Interest", func:editPointOfInterest}]);

	resupplyLocationCM = new ContextMenu ([
		{title:"Resupply from this location", func:resupplyFromLocation},
		{title:"Edit Resupply Location", func:editResupplyLocation},
		{title:"Delete Resupply Location", func:deleteResupplyLocation}]);

	map.addListener ("rightclick", function(event) {mapContextMenu.open (map, event);});

	infoWindow = new google.maps.InfoWindow({content: "This is a test"});

	retrieveRoute ();
	retrieveTrails ();
	retrieveResupplyLocations ();
	retrieveHikerProfiles (); //todo: only do this when visiting the tab of hiker profiles
	retrieveTrailConditions ();
	calculate ();
} 

function metersToMilesRounded (meters)
{
	return Math.round(parseFloat(meters) / 1609.34 * 10) / 10;
}

function metersToMiles (meters)
{
	return parseFloat(meters) / 1609.34;
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
				txt += "<div>" + "Miles: " + metersToMilesRounded (data[d].distance) + "</div>";
				txt += "</div>";
				txt += "</div>";
					
				txt += "<div style='padding:2px 2px 2px 2px'>" + timeFormat(data[d].startTime) + ", " + "mile " + metersToMilesRounded (data[d].meters) + ": start" + "</div>";
				
				if (data[d].events.length > 0)
				{
					for (let e in data[d].events)
					{
						txt += "<div style='padding:2px 2px 2px 2px'>" + timeFormat(data[d].events[e].time) + ", " + "mile " + metersToMilesRounded (data[d].events[e].meters) + ": " + data[d].events[e].type + "</div>";

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

				txt += "<div style='padding:2px 2px 2px 2px'>" + timeFormat(data[d].endTime) + ", " + "mile ";
				
				if (d < data.length - 1)
				{
					 txt += metersToMilesRounded (data[parseInt(d) + 1].meters);
				}
				else
				{
					txt += metersToMilesRounded (data[parseInt(d)].endMeters);
				}
				
				txt += ": stop " + "</div>";

				txt += "</div>";
				
				if (day >= dayMarkers.length)
				{
					dayMarkers.push({lat: parseFloat(data[d].lat), lng: parseFloat(data[d].lng), day:parseInt(d)});

					dayMarkers[day].marker = new google.maps.Marker({
						position: dayMarkers[day],
						map: map,
						icon: {
							url: day == 0 ? startPointUrl : campUrl
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
					+ "</div><div>Mile: " + metersToMilesRounded(data[d].meters)
					+ "</div><div>Elevation: " + metersToFeet(data[d].ele) + "\'</div>");
				
				day++;
			}

			//
			// Add end of trail marker
			//
			endOfTrailMarker.lat = parseFloat(data[d].endLat);
			endOfTrailMarker.lng = parseFloat(data[d].endLng);

			endOfTrailMarker.marker = new google.maps.Marker({
				position: endOfTrailMarker,
				map: map,
				icon: {
					url: endPointUrl
				},
			});

			google.maps.event.removeListener (endOfTrailMarker.listener);
		
			endOfTrailMarker.listener = attachInfoWindowMessage(endOfTrailMarker,
				"<div>Mile: " + metersToMilesRounded(data[d].endMeters)
				+ "</div><div>Elevation: " + metersToFeet(data[d].endEle) + "\'</div>");
			
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
				routeContextMenu = new ContextMenu ([
					{title: "Add Point of Interest", func: addPointOfInterest},
					{title: "Select route segment", func: startRouteMeasurement},
					{title: "Add Note", func: addNote},
					{title: "Recalculate distances", func: recalculateDistances}
				]);

				vertexContextMenu = new ContextMenu ([
					{title:"Delete", func:deleteVertex}]);

				drawRoute ();

				map.fitBounds(bounds);
			}
			
			getAndLoadElevationData (0, routeCoords.length, routeCoords);
		}
	}
	
	xmlhttp.open("GET", "route.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}

function retrieveTrails ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			trailCoords = JSON.parse(this.responseText);
			
			if (map)
			{
				drawTrails ();
			}
		}
	}
	
	xmlhttp.open("GET", "trails.php", true);
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

