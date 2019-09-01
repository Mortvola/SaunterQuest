<script>
var routeHighlightMarkers = [];
var routeHighLightPolyLine;

function routeHighlightPolylineCreate (startPosition, endPosition, color)
{
	let section = route.getSection (startPosition, endPosition);

	var polyLine = new google.maps.Polyline({
		path: section,
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
	
	let p = route.getNearestPoint (routeHighlightMarkers[marker].position);
	
	routeHighlightMarkers[marker].setPosition (p);

	highlightBetweenMarkers ();

	if (listener != undefined)
	{
		listener (p, p.segment);
	}
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
	}
	else
	{
		routeHighlightMarkers[marker].setPosition(position);
		routeHighlightMarkers[marker].setMap(map);
	}

	routeHighlightMarkers[marker].listener = routeHighlightMarkers[marker].addListener ("dragend", function (event)
	{
		moveRouteHighlightMarkerToTrail (marker, listener);
	});
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
	if (routeHighlightMarkers[0].listener != undefined)
	{
		google.maps.event.removeListener (routeHighlightMarkers[0].listener);
	}

	routeHighlightMarkers[1].setMap(null);
	if (routeHighlightMarkers[1].listener != undefined)
	{
		google.maps.event.removeListener (routeHighlightMarkers[1].listener);
	}

	routeHighLightPolyLine.setMap(null);

	
}
</script>