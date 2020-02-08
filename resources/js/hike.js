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

class Hike
{
};


var routeHighlighter;

var editPolyLine = {};

var junctionUrl = "https://maps.google.com/mapfiles/ms/micons/lightblue.png";

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
    var routeUpdate = {userHikeId: hike.id, mode: "update", index: startSegment + index, point: {lat: vertex.lat (), lng: vertex.lng ()}};

    $.ajax({
        url: hike.id + "route.php",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(routeUpdate),
        dataType: "json"
    })
    .done (function(responseText)
    {
		let updatedVertex = responseText;

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
    });
}


function insertAnchor (index, vertex)
{
	
    var routeUpdate = {userHikeId: hike.id, mode: "insert", index: startSegment + index, point: {lat: vertex.lat (), lng: vertex.lng ()}};
	
    $.ajax({
        url: hike.id + "route.php",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(routeUpdate),
        dataType: "json"
    })
    .done (function(responseText)
    {
		let updatedVertex = responseText;
		
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
    });
}


function deletePoints (index, length)
{
    var routeUpdate = {userHikeId: hike.id, mode: "delete", index: startSegment + index, length: length};
	
    $.ajax({
        url: hike.id + "route.php",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(routeUpdate),
        dataType: "json"
    })
    .done (function(responseText)
    {
		let trail = responseText;

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
    });
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

function startRouteMeasurement (event)
{
	routeHighlighter = new RouteHighlighter (route, event.latlng, measureMarkerSet);
	
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


function displayLocationPopup (map, latLng, elevation)
{
    let info = $("<div></div>");
    
    $("<div></div")
        .text("Lat: " + latLng.lat)
        .appendTo(info);
    
    $("<div></div>")
        .text(" Lng: " + latLng.lng)
        .appendTo(info);
    
    + "</div><div>Elevation: ";
    
    if (elevation === undefined || elevation === null)
    {
        $("<div></div>")
            .text("Elevation: not available")
            .appendTo(info);
    }
    else
    {
        $("<div></div>")
        .text("Elevation: " + metersToFeet(elevation))
        .appendTo(info);
    }
    
    map.openPopup (info[0], latLng);
}


function displayLocation (event)
{
    $.getJSON({
        url: "/elevation/point?lat=" + event.latlng.lat + "&lng=" + event.latlng.lng,
        context: this
    })
    .done (function(elevation)
    {
        displayLocationPopup (this, event.latlng, elevation);
    });
}


function gotoLocation (event)
{
//    let latLng = {lat: 36.794915999823, lng: -118.993424 };
    let latLng = {lat: 36.823209999827, lng: -119.011145 };

    this.panTo (latLng);
    
    displayLocationPopup (this, latLng);
}


function downloadElevations (object, position)
{
    $.ajax({
        url: "/elevation/file",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: "application/json",
        type: "PUT",
        data: JSON.stringify({lat: position.lat (), lng: position.lng ()})
    });
}


function displayTrailInfo (object, position)
{
	var trailInfo = object.get ('trail');
	
	map.infoWindow.setContent (
		"<div>Name:" + trailInfo.tile.trails[trailInfo.trail].name + "</div>" +
		"<div>CN:" + trailInfo.tile.trails[trailInfo.trail].cn + "</div>" +
		"<div>Type:" + trailInfo.tile.trails[trailInfo.trail].type + "</div>"
		);
	map.infoWindow.setPosition (position);
	map.infoWindow.open(map);
}


function positionMapToBounds (map, p1, p2)
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

	map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]]);
}


function setStartLocation (object, position)
{
	route.setStart (position);
}


function setEndLocation (object, position)
{
	route.setEnd (position);
}


function addWaypoint (event)
{
	route.addWaypoint (event.latlng);
}

function addStartWaypoint (event)
{
    route.addStartWaypoint (event.latlng);
}

function addEndWaypoint (event)
{
    route.addEndWaypoint (event.latlng);
}

let intersections = [];

function showIntersections (event)
{
	var bounds = this.getBounds ();

    $.getJSON({
        url: "/map/intersections?b=" + bounds.toBBoxString(),
        context: this
    })
    .done (function(responseText)
    {
		for (let i of intersections)
		{
			i.remove();
		}

		intersections = [];
		
		let coords = responseText;

		for (let c of coords)
		{
			let coordinate = c.coordinate;
			
			let marker = new L.Marker([coordinate.coordinates[1], coordinate.coordinates[0]], {
                icon: L.icon(
                    {
                        iconUrl: nodeUrl,
                        iconAnchor: L.point(16,32),
                        popupAnchor: L.point(0,-32),
                        tooltipAnchor: L.point(0,-32),
                    })
			}).addTo(this);
			
			intersections.push(marker);
		}
    });
}


function highlightNearestTrail (event)
{
    $.getJSON({
        url: "/map/nearestTrail?lat=" + event.latlng.lat + "&lng=" + event.latlng.lng,
        context: this
    })
    .done (function(responseText)
    {
        let points = [];
        for (let p of responseText)
        {
            points.push([p.point.lat, p.point.lng]);
        }
        
        var polyLine = L.polyline(points, {
            color: "#FF0000",
            opacity: 0.5,
            weight: routeStrokeWeight + 2 * routeHighlightStrokePadding,
            zIndex: 10})
            .addTo(this);
    });
}


function showNearestGraph (event)
{
    $.getJSON({
        url: "/map/nearestGraph?lat=" + event.latlng.lat + "&lng=" + event.latlng.lng,
        context: this
    })
    .done (function(graph)
    {
        for (let e of graph.edges)
        {
            if (e.start_node && e.end_node && graph.nodes[e.start_node] && graph.nodes[e.end_node])
            {
                let line = [
                        [graph.nodes[e.start_node].point.lat, graph.nodes[e.start_node].point.lng],
                        [graph.nodes[e.end_node].point.lat, graph.nodes[e.end_node].point.lng]
                    ];
                
                let polyLine = L.polyline(
                    line,
                    {
                        color: "#FF0000",
                        opacity: 0.5,
                        weight: 2
                    }
                ).addTo(this);
                
                let popup = $('<div></div>');
                
                $('<div></div>')
                .text ('Edge ID: ' + e.id)
                .appendTo(popup);
                
                $('<div></div>')
                    .text ('Forward Cost: ' + e.forward_cost)
                    .appendTo(popup);

                $('<div></div>')
                    .text ('Backward Cost: ' + e.backward_cost)
                    .appendTo(popup);
                
                polyLine.bindPopup(popup[0]);
            }
        }
        
    });
}


function whatIsHere (event)
{
    $.getJSON({
        url: "/map/whatishere?lat=" + event.latlng.lat + "&lng=" + event.latlng.lng,
        context: this
    })
    .done (function(result)
    {
        console.log (result);
        
        let info = $("<div></div>");
        
        $("<div></div")
            .text("Lat: " + result.point.lat)
            .appendTo(info);
        
        $("<div></div>")
            .text(" Lng: " + result.point.lng)
            .appendTo(info);
        
        + "</div><div>Elevation: ";
        
        if (elevation === undefined || elevation === null)
        {
            $("<div></div>")
                .text("Elevation: not available")
                .appendTo(info);
        }
        else
        {
            $("<div></div>")
            .text("Elevation: " + metersToFeet(elevation))
            .appendTo(info);
        }
        
        $("<div></div>")
            .text("Line ID: " + result.line_id)
            .appendTo(info);
        
        this.openPopup (info[0], result.point);
    });
}


function addCampsite (event)
{
    $("#pleaseWait").show ();
    
    $.ajax({
        url: "/pointOfInterest",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({type: 'campsite', lat: event.latlng.lat, lng: event.latlng.lng}),
        context: this
    })
    .done (function(response)
    {
        let campsite = new TrailMarker (map, campsiteUrl);
        campsite.setDraggable (true, (marker) => {  });
        campsite.setPosition(event.latlng);
        
    })
    .always (function ()
    {
        $("#pleaseWait").hide ();
    });
}


function mapInitialize()
{
	window.onkeydown = function(e)
	{
		controlDown = ((e.keyIdentifier == 'Control') || (e.ctrlKey == true));
	}
	
	window.onkeyup = function(e)
	{
	    if ((e.keyIdentifier == 'Control') || (e.ctrlKey == true))
	    {
	        controlDown = false;
	    }
	}

	let waypointMenuItems = [
	    {text: "Prepend Waypoint", callback: addStartWaypoint},
        {text: "Insert Waypoint", callback: addWaypoint},
        {text: "Append Waypoint", callback: addEndWaypoint},
        {separator: true}
    ];
    
    let mapMenuItems = [
        {text: "Display Location", callback: displayLocation},
        {text: "Go to Location...", callback: gotoLocation},
    ];
    
    mapMenuItems.splice(0, 0, ...waypointMenuItems);

    if (userAdmin)
    {
        let adminMenuItems = [
            {separator: true},
            {text: "Add Point of Interest", callback: showAddPointOfInterest, admin: true},
            {text: "Add Note", callback: addNote, admin: true},
            {text: "Create Resupply Location", callback: addResupplyLocation, admin: true},
            {text: "Download Elevations", callback: downloadElevations, admin: true},
            {text: "Show Intersections", callback: showIntersections, admin: true},
            {text: "Higlight Nearest Trail", callback: highlightNearestTrail, admin: true},
            {text: "Show Nearest Graph", callback: showNearestGraph, admin: true},
            {text: "What is here?", callback: whatIsHere},
            {text: "Add Campsite", callback: addCampsite},
        ];
        
        mapMenuItems.splice(mapMenuItems.length, 0, ...adminMenuItems);
    }
    
	let trailMenuItems = [
        {text: "Display Location", callback:displayLocation},
        {text: "Add Point of Interest", callback:showAddPointOfInterest, admin: true},
        {text: "Create Resupply Location", callback:addResupplyLocation, admin: true},
        {text: "Trail Information", callback:displayTrailInfo, admin: true},
    ]

    trailMenuItems.splice(0, 0, ...waypointMenuItems);

	/*
	trailContextMenu = new ContextMenu (trailMenuItems);

	pointOfInterestCM = new ContextMenu ([
		{title:"Edit Point of Interest", func:editPointOfInterest},
		{title:"Remove Point of Interest", func:removePointOfInterest}]);

	resupplyLocationCM = new ContextMenu ([
		{title:"Resupply from this location", func:resupplyFromLocation},
		{title:"Edit Resupply Location", func:editResupplyLocation},
		{title:"Delete Resupply Location", func:deleteResupplyLocation}]);
    */
	
    /*
	routeContextMenu = new ContextMenu (routeMenuItems);

	vertexContextMenu = new ContextMenu ([
		{title:"Delete", func:deleteVertex}]);
	
	setContextMenu (map, mapContextMenu);
    */

    map = L.map('map',
        {
            contextmenu: true,
            contextmenuItems: mapMenuItems,
            maxZoom: 16,
            minZoom: 4,
        });

    let terrainLayer = new L.tileLayer(tileServerUrl + "/terrain/{z}/{x}/{y}", {
        updateWhenZooming: true,
    });
   
    let detailLayer = new L.tileLayer(tileServerUrl + "/tile/{z}/{x}/{y}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        updateWhenZooming: true,
    });
    
    L.layerGroup ()
        .addLayer(terrainLayer)
        .addLayer(detailLayer)
        .addTo(map);
    
    /*
    map.on('locationfound', function (e)
        {
            var radius = e.accuracy;

            L.marker(e.latlng).addTo(map)
                .bindPopup("You are within " + radius + " meters from this point").openPopup();

            L.circle(e.latlng, radius).addTo(map);
        });

        map.on('locationerror', function (e) {
            alert(e.message);
        });
        
    map.locate({setView: true, maxZoom: 16});
*/
    
    trails = new Trails(map);
	route = new Route(map);
	schedule = new Schedule (map);
	
	route.retrieve ();
	schedule.retrieve ();

	retrievePointsOfInterest ();
	retrieveResupplyLocations ();
	retrieveHikerProfiles (); //todo: only do this when visiting the tab of hiker profiles
} 


$().ready (function ()
{
    mapInitialize ();
});
