"use strict";

var dayMarkers = [];
var endOfTrailMarker = {};
var resupplyLocations = [];
var anchors = [];
var actualRoute = [];
var actualRoutePolyline;

var controlDown = false;

var mapDragging = false;

var trails = [];
var trailCoords = {};
//var requestedTrailBounds;
var currentTrailBounds;
var currentTrailWeight;

var editedRoute = [];
var routeContextMenu;
var vertexContextMenu;
var map;
var bounds = {};
var data;
var startPosition;
var startSegment;
var endPosition;
var endSegment;

var selectStartPosition;
var selectStartSegment;
var selectEndPosition;
var selectEndSegment;

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
		if (!controlDown)
		{
			infoWindow.setContent (poi.message);
			infoWindow.open(map, poi.marker);
		}
	});
}


function addNote (object, position)
{
}


//function editSelection ()
//{
//	if (startPosition != undefined && endPosition != undefined)
//	{
//		updateEditedRoute (startPosition, startSegment, endPosition, endSegment);
//		
//		endRouteHighlighting ();
//		
//		$("#editRoute").show (250);
//		$("#measureRoute").hide (250);
//	}
//}


function adjustAnchorRouteIndexes (anchorIndex, adjustment)
{
	for (let i = anchorIndex; i < anchors.length; i++)
	{
		anchors[i].actualRouteIndex += adjustment;
	}
}


function removePointsFromRoute (anchor, anchorIndex)
{
	if (anchor.trail != undefined)
	{
		// Delete the points from the actual route
		actualRoute.splice(anchor.actualRouteIndex + 1, anchor.trail.length)
		
		// Delete the points from the polyline
		let path = actualRoutePolyline.getPath ();
		
		for (let i = anchor.actualRouteIndex + 1; i < anchor.actualRouteIndex + 1 + anchor.trail.length; i++)
		{
			path.removeAt(anchor.actualRouteIndex + 1);
		}
	
		// update the anchor indexes into the actual trail now that we deleted some portion of the trail.
		adjustAnchorRouteIndexes (anchorIndex + 1, -anchor.trail.length);
		
		anchor.trail = undefined;
	}
}


function addPointsToRoute (anchor, anchorIndex, trail)
{
	// Add the points from the actual route
	actualRoute.splice(anchor.actualRouteIndex + 1, 0, ...trail);
	anchor.trail = trail;

	// Insert points into the polyline
	let path = actualRoutePolyline.getPath ();

	for (let i = 0; i < trail.length; i++)
	{
		path.insertAt(anchor.actualRouteIndex + 1 + i,
			new google.maps.LatLng (trail[i]));
	}

	// update the anchor indexes into the actual trail now that we added some portion to the trail.
	adjustAnchorRouteIndexes (anchorIndex + 1, trail.length);
}


function moveAnchor (index, vertex)
{
	var xmlhttp = new XMLHttpRequest ();

	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let updatedVertex = JSON.parse(this.responseText);

			let anchorIndex = startSegment + index;
			let anchor = anchors[anchorIndex];
			let prevAnchor;
			
			let updatedLatLng = new google.maps.LatLng({lat: updatedVertex.point.lat, lng: updatedVertex.point.lng});
			
			if (anchorIndex > 0)
			{
				prevAnchor = anchors[anchorIndex - 1];
			}
			
			actualRoute[anchor.actualRouteIndex].lat = updatedVertex.point.lat;
			actualRoute[anchor.actualRouteIndex].lng = updatedVertex.point.lng;
			actualRoute[anchor.actualRouteIndex].ele = updatedVertex.point.ele;
			actualRoute[anchor.actualRouteIndex].dist = updatedVertex.point.dist;
	
			anchor.lat = updatedVertex.point.lat;
			anchor.lng = updatedVertex.point.lng;
			anchor.ele = updatedVertex.point.ele;
			anchor.dist = updatedVertex.point.dist;

			editedRoute[index].lat = updatedVertex.point.lat;
			editedRoute[index].lng = updatedVertex.point.lng;
	
			var path = editPolyLine.getPath ();
			updatedLatLng.moved = true;
			path.setAt(index, updatedLatLng);

			// Set the vertex that moved
			path = actualRoutePolyline.getPath ();
			path.setAt (anchor.actualRouteIndex, updatedLatLng);

			if (prevAnchor != undefined)
			{
				if (prevAnchor.trail != undefined)
				{
					removePointsFromRoute (prevAnchor, anchorIndex - 1);
				}
	
				if (updatedVertex.previousTrail != undefined)
				{
					addPointsToRoute (prevAnchor, anchorIndex - 1, updatedVertex.previousTrail);
				}
			}

			if (anchor.trail != undefined)
			{
				removePointsFromRoute (anchor, anchorIndex);
			}

			if (updatedVertex.nextTrail != undefined)
			{
				addPointsToRoute (anchor, anchorIndex, updatedVertex.nextTrail);
			}
			
			if (anchorIndex == 0)
			{
				dayMarkers[0].marker.setPosition (updatedLatLng);
			}
			else if (anchorIndex == anchors.length - 1)
			{
				endOfTrailMarker.marker.setPosition (updatedLatLng);
			}
		}
	}

	var routeUpdate = {userHikeId: userHikeId, mode: "update", index: startSegment + index, point: {lat: vertex.lat (), lng: vertex.lng ()}};
	
	xmlhttp.open("PUT", "route.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(routeUpdate));
}


function insertAnchor (index, vertex)
{
	var xmlhttp = new XMLHttpRequest ();

	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let updatedVertex = JSON.parse(this.responseText);
	
			let anchorIndex = startSegment + index;
			let prevAnchor = anchors[anchorIndex - 1];

			removePointsFromRoute (prevAnchor, anchorIndex - 1);

			if (updatedVertex.previousTrail != undefined)
			{
				addPointsToRoute (prevAnchor, anchorIndex - 1, updatedVertex.previousTrail);
			}

			actualRoute.splice (anchors[anchorIndex].actualRouteIndex, 0, {lat: updatedVertex.point.lat, lng: updatedVertex.point.lng});
			actualRoute[anchors[anchorIndex].actualRouteIndex].ele = updatedVertex.point.ele;
			actualRoute[anchors[anchorIndex].actualRouteIndex].dist = updatedVertex.point.dist;

			anchors.splice (anchorIndex, 0, {lat: updatedVertex.point.lat, lng: updatedVertex.point.lng, actualRouteIndex: anchors[anchorIndex].actualRouteIndex});
			anchors[anchorIndex].ele = updatedVertex.point.ele;
			anchors[anchorIndex].dist = updatedVertex.point.dist;

			editedRoute[index].lat = updatedVertex.point.lat;
			editedRoute[index].lng = updatedVertex.point.lng;

			// Insert the vertex into the actual route polyline.
			path = actualRoutePolyline.getPath ();
			path.insertAt (anchors[anchorIndex].actualRouteIndex, new google.maps.LatLng({lat: updatedVertex.point.lat, lng: updatedVertex.point.lng}));

			var path = editPolyLine.getPath ();
			var vertex = new google.maps.LatLng({lat: editedRoute[index].lat, lng: editedRoute[index].lng});
			vertex.moved = true;
			path.setAt(index, vertex);

			// update the anchor indexes into the actual trail now that we deleted some portion of the trail.
			adjustAnchorRouteIndexes (anchorIndex + 1, 1);

			if (updatedVertex.nextTrail != undefined)
			{
				addPointsToRoute (anchors[anchorIndex], anchorIndex, updatedVertex.nextTrail);
			}
		}
	}
	
	var routeUpdate = {userHikeId: userHikeId, mode: "insert", index: startSegment + index, point: {lat: vertex.lat (), lng: vertex.lng ()}};
	
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

			let anchorIndex = startSegment + index;
			
			let path = actualRoutePolyline.getPath ();

			for (let i = 0; i < length; i++)
			{
				removePointsFromRoute (anchors[anchorIndex - 1], anchorIndex - 1);
				removePointsFromRoute (anchors[anchorIndex], anchorIndex);

				// Delete the anchor from the actual route and from the actual route polyline
				actualRoute.splice(anchors[anchorIndex].actualRouteIndex, 1)
				// update the anchor indexes into the actual trail now that we deleted some portion of the trail.
				adjustAnchorRouteIndexes (anchorIndex + 1, -1);
				path.removeAt(anchors[anchorIndex].actualRouteIndex);

				anchors.splice (anchorIndex, 1);
				
				editPolyLine.getPath ().removeAt (index);
				editedRoute.splice(index, 1);
			}
			
			// Add in the points for the specified new trail between the anchors
			if (trail != undefined)
			{
				addPointsToRoute (anchors[anchorIndex - 1], anchorIndex - 1, trail);
			}
		}
	}

	var routeUpdate = {userHikeId: userHikeId, mode: "delete", index: startSegment + index, length: length};
	
	xmlhttp.open("PUT", "route.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(routeUpdate));
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
//	endSegment = Math.min(startSegment + 1, anchors.length - 1);
//	
//	$("#editRoute").show (250);
//}


function stopRouteEdit ()
{
	//endRouteHighlighting ();
	
	if (editPolyLine != undefined && editPolyLine.setMap != undefined)
	{
		editPolyLine.setMap(null);
		editPolyLine = null;
	}

	startPosition = undefined;
	endPosition = undefined;
	
	startSegment = undefined;
	endSegment = undefined;
	
	$("#editRoute").hide(250);

//	drawRoute ();
	getAndLoadElevationData (0, actualRoute.length, actualRoute);
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
//	endSegment = Math.min(segment + 1, anchors.length - 1);
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
		new google.maps.LatLng(anchors[startSegment]));		

	editedRoute.push({
		lat: startPosition.lat (),
		lng: startPosition.lng (),
		dist: anchors[startSegment].dist + delta,
		ele: (anchors[startSegment + 1].ele - anchors[startSegment].ele) / 2 + anchors[startSegment].ele
	});
	
	if (startSegment != endSegment)
	{
		for (let r = startSegment + 1; r <= endSegment; r++)
		{
			editedRoute.push(anchors[r]);
		}
	}

	delta = google.maps.geometry.spherical.computeDistanceBetween(
		endPosition,
		new google.maps.LatLng(anchors[endSegment]));		

	editedRoute.push({
		lat: endPosition.lat (),
		lng: endPosition.lng (),
		dist: anchors[endSegment].dist + delta,
		ele: (anchors[endSegment + 1].ele - anchors[endSegment].ele) / 2 + anchors[endSegment].ele
	});

	createEditablePolyline ();
}

function actualRouteVertexInserted (index)
{
	console.log ("vertex inserted: " + index);
}

function printVertex (polyLine, index)
{
	var path = polyLine.getPath ();
	var vertex = path.getAt(index);

	console.log ("vertex " + index + ": (" + vertex.lat() + ", " + vertex.lng() + ")");
}

function actualRouteVertexUpdated (index)
{
	console.log ("vertex updated: " + index);
	printVertex(actualRoutePolyline, index);
	printVertex(actualRoutePolyline, index - 1);
}


function vertexInserted (index)
{
	var path = editPolyLine.getPath ();
	
	var vertex = path.getAt(index);

	editedRoute.splice (index, 0, {lat: vertex.lat (), lng: vertex.lng ()});
	
	insertAnchor (index, vertex);
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
		moveAnchor (index, vertex);
	}
}

function createEditablePolyline ()
{
	if (editPolyLine != undefined)
	{
		if (editPolyLine.setMap != undefined)
		{
			editPolyLine.setMap(null);
		}
		
		removeContextMenu(editPolyLine);
	}
	
	editPolyLine = new google.maps.Polyline({
		path: editedRoute,
		editable: true,
		geodesic: true,
		strokeColor: '#7F7F7F',
		strokeOpacity: 1.0,
		strokeWeight: routeStrokeWeight - 2,
		zIndex: 30});

	google.maps.event.addListener(editPolyLine.getPath(), "insert_at", vertexInserted);
	google.maps.event.addListener(editPolyLine.getPath(), "set_at", vertexUpdated);
	
	editPolyLine.setMap(map);

	setContextMenu (editPolyLine, vertexContextMenu);

	getAndLoadElevationData (0, editedRoute.length, editedRoute);
}


function deleteVertex (object, vertex)
{
	deletePoints (vertex, 1);
}

function clearVertices ()
{
	if (selectStartSegment > selectEndSegment)
	{
		selectEndSegment = [selectStartSegment, selectStartSegment=selectEndSegment][0];
	}

	var startAnchor;
	var endAnchor;
	
	// Find anchors associated with the start and end segments.
	for (let r in anchors)
	{
		if (startAnchor == undefined && selectStartSegment <= anchors[r].actualRouteIndex)
		{
			startAnchor = parseInt(r);
		}
		
		if (endAnchor == undefined && selectEndSegment <= anchors[r].actualRouteIndex)
		{
			endAnchor = parseInt(r);
		}
		
		if (startAnchor != undefined && endAnchor != undefined)
		{
			break;
		}
	}
	
	deletePoints (startAnchor, endAnchor - startAnchor + 1);

	stopRouteMeasurement ();
}


function recalculateDistances (object, position)
{
	for (let r in anchors)
	{
		if (r == 0)
		{
			anchors[0].dist = 0;
		}
		else
		{
			let delta = google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(anchors[r - 1]),
					new google.maps.LatLng(anchors[r]));
			
			anchors[r].dist = anchors[r - 1].dist + delta;
		}
	}
	
	drawRoute ();
	getAndLoadElevationData (0, actualRoute.length, actualRoute);
	calculate ();
}


function measureStartMarkerSet (position, segment)
{
	selectStartPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
	selectStartSegment = segment;
	
	measureRouteDistance (selectStartPosition, selectStartSegment, selectEndPosition, selectEndSegment);
	displayRouteElevations (selectStartSegment, selectEndSegment);
}

function measureEndMarkerSet (position, segment)
{
	selectEndPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
	selectEndSegment = segment;
	
	measureRouteDistance (selectStartPosition, selectStartSegment, selectEndPosition, selectEndSegment);
	displayRouteElevations (selectStartSegment, selectEndSegment);
}

function startRouteMeasurement (object, position)
{
	setRouteHighlightStartMarker (position, measureStartMarkerSet);
	setRouteHighlightEndMarker (position, measureEndMarkerSet);
	
	selectStartPosition = position;
	selectEndPosition = position;

	selectStartSegment = findNearestSegment(selectStartPosition, actualRoute);
	selectEndSegment = selectStartSegment;

	$("#measureRoute").show (250);
}


function toggleEdit (object, position)
{
	editedRoute = [];

	startSegment = 0;
	endSegment = anchors.length - 1;
	
	editedRoute.splice (0, 0, ...anchors);

	createEditablePolyline ();
}


function stopRouteMeasurement ()
{
	endRouteHighlighting ();

	selectStartPosition = undefined;
	selectEndPosition = undefined;
	
	$("#measureRoute").hide(250);

	getAndLoadElevationData (0, actualRoute.length, actualRoute);
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
					new google.maps.LatLng(actualRoute[startSegment + 1]));		
	
			for (let r = startSegment + 1; r < endSegment; r++)
			{
				distance += google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(actualRoute[r]),
					new google.maps.LatLng(actualRoute[r + 1]));		
			}
	
			// Compute the distance between the end segment and the end point (the
			// end point might be int he middle of a segment)
			let endDistance = google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(actualRoute[endSegment]),
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
			if (endSegment + 1 < actualRoute.length)
			{
				getAndLoadElevationData (startSegment, endSegment + 1, actualRoute);
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
			
			getAndLoadElevationData (startSegment, Math.min(endSegment + 1, actualRoute.length), actualRoute);
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


function findNearestSegment (position, anchors)
{
	let closestEdge = -1;

	//
	// There has to be at least two points in the array. Otherwise, we wouldn't have any edges.
	//
	if (anchors.length > 1)
	{
		let shortestDistance;
		
		for (let r = 0; r < anchors.length - 1; r++)
		{
			let distance = distToSegmentSquared(
				{x: position.lng(), y: position.lat()},
				{x: anchors[r].lng, y: anchors[r].lat},
				{x: anchors[r + 1].lng, y: anchors[r + 1].lat});

			if (r == 0 || distance < shortestDistance)
			{
				shortestDistance = distance;
				closestEdge = r;
			}
		}
	}
	
	return closestEdge;
}


function displayLocation (object, position)
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
		}
	}
	
	xmlhttp.open("GET", "elevation.php?lat=" + position.lat () + "&lng=" + position.lng (), true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


//
// Position the map so that the two endpoints (today's and tomorrow's) are visible.
// todo: take into account the area the whole path uses. Some paths go out of window 
// even though the two endpoints are within the window.
//
function positionMapToDay (d)
{
	if (d < data.length - 1)
	{
		positionMapToBounds (data[d], data[d+1]);
	}
	else
	{
		positionMapToBounds (data[d], {lat: data[d].endLat, lng: data[d].endLng});
	}

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


function drawRoute ()
{
	if (map && anchors.length > 1)
	{
		//
		// Traverse route coords and find the bounds
		// todo: this should be part of the file retrieved
		for (let r in anchors)
		{
			if (r == 0)
			{
				bounds.east = anchors[r].lng;
				bounds.west = anchors[r].lng;
				bounds.north = anchors[r].lat;
				bounds.south = anchors[r].lat;
			}
			else
			{
				if (anchors[r].lng > bounds.east)
				{
					bounds.east = anchors[r].lng;
				}

				if (anchors[r].lng < bounds.west)
				{
					bounds.west = anchors[r].lng;
				}
				
				if (anchors[r].lat > bounds.north)
				{
					bounds.north = anchors[r].lat;
				}

				if (anchors[r].lat < bounds.south)
				{
					bounds.south = anchors[r].lat;
				}
			}

			if (r > 0)
			{
				if (anchors[r].lat == anchors[r - 1].lat && anchors[r].lng == anchors[r - 1].lng)
				{
					console.log ("same coordinate");
				}
			}
			
			actualRoute.push({lat: anchors[r].lat, lng: anchors[r].lng, dist: anchors[r].dist, ele: anchors[r].ele});
			anchors[r].actualRouteIndex = actualRoute.length - 1;
			
			if (anchors[r].trail != undefined)
			{
				if (anchors[r].lat == anchors[r].trail[0].lat && anchors[r].lng == anchors[r].trail[0].lng)
				{
					console.log ("same coordinate");
				}
				
				for (let t in anchors[r].trail)
				{
					actualRoute.push({lat: anchors[r].trail[t].lat, lng: anchors[r].trail[t].lng, dist: anchors[r].trail[t].dist, ele: anchors[r].trail[t].ele});
				}
			}
		}

		if (actualRoutePolyline != undefined)
		{
			actualRoutePolyline.setMap(null);
			
			removeContextMenu(actualRoutePolyline);
		}
		
		actualRoutePolyline = new google.maps.Polyline({
			path: actualRoute,
			editable: false,
			geodesic: true,
			strokeColor: '#0000FF',
			strokeOpacity: 1.0,
			strokeWeight: routeStrokeWeight,
			zIndex: 20});

		actualRoutePolyline.setMap(map);
		
		setContextMenu (actualRoutePolyline, routeContextMenu);
	}
}


function addNewRoute (position)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			retrieveRoute ();
			calculate ();
		}
	}
	
	var route = {};
	
	route.userHikeId = userHikeId;
	route.anchors = [];
	
	route.anchors.push({lat: position.lat (), lng: position.lng ()});
	route.anchors.push({lat: position.lat (), lng: position.lng ()});
	
	xmlhttp.open("POST", "route.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(route));
}


function setStartLocation (object, position)
{
	// If there is no start or end location then
	// add them both
	if (anchors.length == 0)
	{
		addNewRoute (position);
	}
	else
	{
		toggleEdit (object, position);
		
		var path = editPolyLine.getPath ();
		var vertex = path.setAt(0, position);
	}
}


function setEndLocation (object, position)
{
	// If there is no start or end location then
	// add them both
	if (anchors.length == 0)
	{
		addNewRoute (position);
	}
	else
	{
		toggleEdit (object, position);
		
		var path = editPolyLine.getPath ();
		var vertex = path.setAt(path.length - 1, position);
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

	window.onkeydown = function(e)
	{
		controlDown = ((e.keyIdentifier == 'Control') || (e.ctrlKey == true));
	}
	
	window.onkeyup = function(e)
	{
		controlDown = false;
	}

	initializeContextMenu ();

	var mapContextMenu = new ContextMenu ([
		{title:"Add Point of Interest", func:showAddPointOfInterest},
		{title:"Create Resupply Location", func:addResupplyLocation},
		{title:"Display Location", func:displayLocation},
		{title:"Set Start Location", func:setStartLocation},
		{title:"Set End Location", func:setEndLocation}]);

	pointOfInterestCM = new ContextMenu ([
		{title:"Edit Point of Interest", func:editPointOfInterest},
		{title:"Remove Point of Interest", func:removePointOfInterest}]);

	resupplyLocationCM = new ContextMenu ([
		{title:"Resupply from this location", func:resupplyFromLocation},
		{title:"Edit Resupply Location", func:editResupplyLocation},
		{title:"Delete Resupply Location", func:deleteResupplyLocation}]);

	setContextMenu (map, mapContextMenu);
	map.addListener ("dragstart", function () { mapDragging = true;})
	map.addListener ("dragend", function () { mapDragging = false; updateTrails (); });
	map.addListener ("bounds_changed", function () { if (!mapDragging) { updateTrails (); }})

	infoWindow = new google.maps.InfoWindow({content: "This is a test"});

	retrieveRoute ();
	retrievePointsOfInterest ();
	retrieveResupplyLocations ();
	retrieveHikerProfiles (); //todo: only do this when visiting the tab of hiker profiles
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
				
//				if (data[d].events.length > 0)
//				{
//					for (let e in data[d].events)
//					{
//						txt += "<div style='padding:2px 2px 2px 2px'>" + timeFormat(data[d].events[e].time) + ", " + "mile " + metersToMilesRounded (data[d].events[e].meters) + ": " + data[d].events[e].type + "</div>";
//
//						if (m >= markers.length)
//						{
//							// todo: should the marker just have the index to this day and event instead of the POI ID?
//							markers.push({poiId: data[d].events[e].poiId, lat: parseFloat(data[d].events[e].lat), lng: parseFloat(data[d].events[e].lng)});
//							
//							markers[m].marker = new google.maps.Marker({
//								position: markers[m],
//								map: map,
//								icon: {
//									url: pointOfInterestUrl
//								},
//							});
//							
//							let markerIndex = m;
//							markers[m].marker.addListener ("rightclick", function (event) { pointOfInterestCM.open (map, event, markerIndex); });
//						}
//						else
//						{
//							markers[m].poiId = data[d].events[e].poiId;
//							markers[m].lat = parseFloat(data[d].events[e].lat);
//							markers[m].lng = parseFloat(data[d].events[e].lng);
//							
//							markers[m].marker.setPosition(markers[m]);
//
//							google.maps.event.removeListener (markers[m].listener);
//						}
//
//						markers[m].listener = attachInfoWindowMessage(markers[m], "Resupply");
//						
//						m++;
//					}
//				}

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
					"<div>"
					+ (day == 0 ? "Start of day " + (dayMarkers[day].day + 1)
						: "End of day " + dayMarkers[day].day)
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
//			if (m < markers.length)
//			{
//				for (let i = m; i < markers.length; i++)
//				{
//					markers[i].marker.setMap(null);
//					markers[i].marker = null;
//					google.maps.event.removeListener (markers[i].listener);
//				}
//				
//				markers.splice(m, markers.length - m);
//			}
			
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
			anchors = JSON.parse(this.responseText);

			if (anchors.length > 0)
			{
				retrieveTrailConditions ();

				if (map)
				{
					routeContextMenu = new ContextMenu ([
						{title: "Add Point of Interest", func: showAddPointOfInterest},
						{title: "Select route segment", func: startRouteMeasurement},
						{title: "Add Note", func: addNote},
						{title: "Recalculate distances", func: recalculateDistances},
						{title: "Edit", func: toggleEdit}
					]);
	
					vertexContextMenu = new ContextMenu ([
						{title:"Delete", func:deleteVertex}]);
	
					drawRoute ();
	
					map.fitBounds(bounds);
				}
				
				getAndLoadElevationData (0, actualRoute.length, actualRoute);
			}
		}
	}
	
	xmlhttp.open("GET", "route.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}

function releaseTrails ()
{
	for (let t in trails)
	{
		trails[t].setMap(null);
	}
	
	trails = [];
	trailCoords = {};
	currentTrailBounds = undefined;
}


function getTrailWeight ()
{
	var zoom = map.getZoom ();
	
	if (zoom >= 17)
	{
		return 8;
	}
	else if (zoom >= 16)
	{
		return 6;
	}
	else
	{
		return 4;
	}
}

function drawTrails ()
{
	if (map && trailCoords.trails.length > 0)
	{
		currentTrailWeight = getTrailWeight ();
		
		for (let t in trailCoords.trails)
		{
			let trail = new google.maps.Polyline({
				path: trailCoords.trails[t].route,
				editable: false,
				geodesic: true,
				strokeColor: trailCoords.trails[t].type == "trail" ? '#704513' : "#404040",
				strokeOpacity: 1.0,
				strokeWeight: currentTrailWeight,
				zIndex: 15});
	
			trail.setMap(map);
			
			trails.push(trail);
		}
	}
}


function rectContainsRect (outer, inner)
{
	return outer.contains (inner.getNorthEast ()) && outer.contains (inner.getSouthWest ());
}


function retrieveTrails ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			releaseTrails ();
			
			trailCoords = JSON.parse(this.responseText);
			
			currentTrailBounds = new google.maps.LatLngBounds(
					{lat: trailCoords.bounds[0], lng: trailCoords.bounds[1]},
					{lat: trailCoords.bounds[2], lng: trailCoords.bounds[3]});
			
			drawTrails ();
		}
	}
	
	if (map.getZoom () >= 11)
	{
		var bounds = map.getBounds ();
		
		if (currentTrailBounds == undefined || !rectContainsRect (currentTrailBounds, bounds))
//		 && (requestedTrailBounds == undefined || !rectContainsRect(requestedTrailBounds, bounds))
		{
			var requestedTrailBounds = bounds;
			
			xmlhttp.open("GET", "trails.php?b=" + requestedTrailBounds.toUrlValue (), true);
			//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send();
		}
	}
}


function updateTrails ()
{
	var zoom = map.getZoom ();
	
	if (zoom < 11)
	{
		// We are zoomed too far out. Release the trails.
		releaseTrails ();
	}
	else
	{
		retrieveTrails ();
	}

	if (trails.length > 0)
	{
		// If the trail line weights have changed due to zooming then
		// iterate through the trails and apply the new weight.
		var weight = getTrailWeight ();
		
		if (weight != currentTrailWeight)
		{
			currentTrailWeight = weight;
			
			var options = {};
	
			options.strokeWeight = currentTrailWeight;
			
			for (let t in trails)
			{
				trails[t].setOptions (options);
			}
		}
	}
}
