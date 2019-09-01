<script>
"use strict";

var trails;
var route;
var schedule;
var resupplyLocations = [];

var controlDown = false;

var trailContextMenu;

var editedRoute = [];
var routeContextMenu;
var vertexContextMenu;
var map;
var startPosition;
var startSegment;
var endPosition;
var endSegment;

var routeHighlighter;

var editPolyLine = {};

var junctionUrl = "http://maps.google.com/mapfiles/ms/micons/lightblue.png";

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
			map.infoWindow.setContent (poi.message);
			map.infoWindow.open(map, poi.marker);
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
				startOfTrailMarker.setPosition (updatedVertex.point);
			}
			else if (anchorIndex == anchors.length - 1)
			{
				endOfTrailMarker.setPosition (updatedVertex.point);
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
	getAndLoadElevationData (0, actualRoute.length);
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

//	getAndLoadElevationData (0, editedRoute.length, editedRoute);
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


function measureRouteDistance (startPosition, endPosition)
{
	let distance = 0;
	
	if (startPosition != undefined && endPosition != undefined)
	{
		distance = route.measure (startPosition, startPosition.segment, endPosition, endPosition.segment);
		
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


function measureMarkerSet (highlighter)
{
	let startPosition = highlighter.getStartPosition ();
	let endPosition = highlighter.getEndPosition ();

	if (startPosition && endPosition)
	{
		measureRouteDistance (startPosition, endPosition);
		displayRouteElevations (startPosition.segment, endPosition.segment);
	}
}

function startRouteMeasurement (object, position)
{
	routeHighlighter = new RouteHighlighter (route, {lat: position.lat (), lng: position.lng ()}, measureMarkerSet);
	
    $("#distanceWindowClose").off('click');
    $("#distanceWindowClose").click(function () { stopRouteMeasurement(); });

	$("#distanceWindow").show ();
}


function stopRouteMeasurement ()
{
	routeHighlighter.end ();
	routeHighlighter = null;
	
	$("#distanceWindow").hide ();

	getAndLoadElevationData (0, route.getLength ());
}


function toggleEdit (object, position)
{
	editedRoute = [];

	startSegment = 0;
	endSegment = anchors.length - 1;
	
	editedRoute.splice (0, 0, ...anchors);

	createEditablePolyline ();
}


function getAndLoadElevationData (s, e)
{
	elevationData = [];
	
	elevationData.push([{label: 'Distance', type: 'number'}, {label: 'Elevation', type: 'number'}]);
	
	route.getElevations (elevationData,s, e);
	
	loadData ();
}


function displayRouteElevations (startSegment, endSegment)
{
	let distance = 0;
	
	if (startSegment != undefined && endSegment != undefined)
	{
		if (startSegment == endSegment)
		{
			if (endSegment + 1 < route.getLength ())
			{
				getAndLoadElevationData (startSegment, endSegment + 1);
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
			
			getAndLoadElevationData (startSegment, Math.min(endSegment + 1, route.getLength ()));
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


function displayLocation (object, position)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let elevation = JSON.parse(this.responseText);

			map.infoWindow.setContent ("<div>Lat: " + position.lat() + "</div><div>Lng: " + position.lng() + "</div><div>Elevation: " + metersToFeet(elevation) + "</div>");
			map.infoWindow.setPosition (position);
			map.infoWindow.open(map);
		}
	}
	
	xmlhttp.open("GET", "elevation?lat=" + position.lat () + "&lng=" + position.lng (), true);
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
	if (d < days.length - 1)
	{
		positionMapToBounds (days[d], days[d+1]);
	}
	else
	{
		positionMapToBounds (days[d], {lat: days[d].endLat, lng: days[d].endLng});
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


function setStartLocation (object, position)
{
	route.setStart (position);
}


function setEndLocation (object, position)
{
	route.setEnd (position);
}


function mapInitialize()
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

	trailContextMenu = new ContextMenu ([
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

	routeContextMenu = new ContextMenu ([
		{title: "Add Point of Interest", func: showAddPointOfInterest},
		{title: "Measure route section", func: startRouteMeasurement},
		{title: "Display Location", func:displayLocation},
		{title: "Add Note", func: addNote},
	]);

	vertexContextMenu = new ContextMenu ([
		{title:"Delete", func:deleteVertex}]);
	
	setContextMenu (map, mapContextMenu);

	map.infoWindow = new google.maps.InfoWindow({content: "This is a test"});

	trails = new Trails(map);
	route = new Route(map);
	schedule = new Schedule (map);
	
	route.retrieve ();
	schedule.retrieve ();

	retrievePointsOfInterest ();
	retrieveResupplyLocations ();
	retrieveHikerProfiles (); //todo: only do this when visiting the tab of hiker profiles
} 


</script>

<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB16_kVJjm2plHSOkrxZDC4etbpp6vW8kU&callback=mapInitialize&libraries=geometry"></script>
