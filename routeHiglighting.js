var routeHighlightMarkers = [];
var routeHighLightPolyLine;

function routeHighlightPolylineCreate (startPosition, endPosition, color)
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
		strokeWeight: routeStrokeWeight + 2 * routeHighlightStrokePadding,
		zIndex: 10});

	polyLine.setMap(map);

	return polyLine;
}

function highlightBetweenMarkers ()
{
	// If there is an existing poly line then remove it.
	if (routeHighLightPolyLine)
	{
		routeHighLightPolyLine.setMap(null);
	}
	
	// If both markers are on the map then draw a poly line between them on the trail.
	if (routeHighlightMarkers[0] && routeHighlightMarkers[0].map
	 && routeHighlightMarkers[1] && routeHighlightMarkers[1].map)
	{
		routeHighLightPolyLine = routeHighlightPolylineCreate (
			routeHighlightMarkers[0].position, routeHighlightMarkers[1].position,
			'#FF0000');
	}
}


function moveRouteHighlightMarkerToTrail (marker, listener)
{
	let otherMarker = marker == 0 ? 1 : 0;
	
	let segment = findNearestSegment(routeHighlightMarkers[marker].position);
	
	let p = nearestPointOnSegment (
		{x: routeHighlightMarkers[marker].position.lat(), y: routeHighlightMarkers[marker].position.lng()},
		{x: routeCoords[segment].lat, y: routeCoords[segment].lng},
		{x: routeCoords[segment + 1].lat, y: routeCoords[segment + 1].lng});

	routeHighlightMarkers[marker].setPosition ({lat: p.x, lng: p.y});

	highlightBetweenMarkers ();

	listener (p, segment);
}


function markerSetup (marker, position, listener)
{
	if (routeHighlightMarkers[marker] == undefined)
	{
		routeHighlightMarkers[marker] = new google.maps.Marker({
			position: position,
			map: map,
			draggable: true
		});

		routeHighlightMarkers[marker].addListener ("dragend", function (event)
		{
			moveRouteHighlightMarkerToTrail (marker, listener);
		});
	}
	else
	{
		routeHighlightMarkers[marker].setPosition(position);
		routeHighlightMarkers[marker].setMap(map);
	}
}


function setRouteHighlightStartMarker (position, listener)
{
	markerSetup (0, position, listener);
	
	moveRouteHighlightMarkerToTrail (0, listener);
}


function setRouteHighlightEndMarker (position, listener)
{
	markerSetup (1, position, listener);

	moveRouteHighlightMarkerToTrail (1, listener);
}


function endRouteHighlighting ()
{
	routeHighlightMarkers[0].setMap(null);
	routeHighlightMarkers[1].setMap(null);
	routeHighLightPolyLine.setMap(null);
}


