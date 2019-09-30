<script>
"use strict";

const routeHighlightStrokePadding = 4;

class RouteHighlighter
{
	constructor (route, position, changedListener)
	{
		this.route = route;
		this.listener = changedListener;
		this.markers = [];
		this.color = "#FF0000";
		
		if (position !== null)
		{
			let routePosition = this.route.getNearestPoint(position);
			this.setRouteHighlightMarker (0, routePosition);
			this.setRouteHighlightMarker (1, routePosition);
		}
	}

	setStartPosition (position)
	{
		let routePosition = this.route.getNearestPoint(position);
		this.setRouteHighlightMarker (0, routePosition);
	}
	
	setEndPosition (position)
	{
		let routePosition = this.route.getNearestPoint(position);
		this.setRouteHighlightMarker (1, routePosition);
	}
	
	getStartPosition ()
	{
		if (this.markers[0])
		{
			return this.markers[0].position;
		}
	}
	
	getEndPosition ()
	{
		if (this.markers[1])
		{
			return this.markers[1].position;
		}
	}
	
	setRouteHighlightMarker (marker, position)
	{
		this.markerSetup (marker, position);
		
		this.moveRouteHighlightMarkerToTrail (marker);
	}

	moveRouteHighlightMarkerToTrail (marker)
	{
		let markerPosition = this.markers[marker].marker.getPosition ();
		let p = {
			lat: markerPosition.lat(),
			lng: markerPosition.lng()
		};
			
		if (!isNaN(p.lat) && !isNaN(p.lng))
		{
			p = this.route.getNearestPoint (p);
			
			this.markers[marker].marker.setPosition (p);
			this.markers[marker].position = p;
			
			this.highlightBetweenMarkers ();
	
			if (this.listener != undefined)
			{
				this.listener (this);
			}
		}
	}

	markerSetup (marker, position)
	{
		if (this.markers[marker] == undefined)
		{
			this.markers[marker] = {};
		}
		
		this.markers[marker].position = position;

		if (this.markers[marker].marker == undefined)
		{
			this.markers[marker].marker = new google.maps.Marker({
				position: position,
				map: this.route.map,
				draggable: true
			});
		}
		else
		{
			this.markers[marker].marker.setPosition(position);
			this.markers[marker].marker.setMap(this.route.map);
		}

		var highlighter = this;
		
		this.markers[marker].markerListener = this.markers[marker].marker.addListener ("dragend", function ()
		{
			highlighter.moveRouteHighlightMarkerToTrail (marker);
		});
	}

	highlightBetweenMarkers ()
	{
		// If both markers are on the map then draw a poly line between them on the trail.
		if (this.markers[0] && this.markers[0].marker && this.markers[0].marker.map
		 && this.markers[1] && this.markers[1].marker && this.markers[1].marker.map)
		{
			// If there is an existing poly line then remove it.
			if (this.polyLine)
			{
				this.polyLine.setMap(null);
			}

			let section = route.getSection (this.markers[0].position, this.markers[1].position);

			this.polyLine = new google.maps.Polyline({
				path: section,
				geodesic: true,
				strokeColor: this.color,
				strokeOpacity: 1.0,
				strokeWeight: routeStrokeWeight + 2 * routeHighlightStrokePadding,
				zIndex: 10});

			this.polyLine.setMap(this.route.map);
		}
	}

	end ()
	{
		this.hideMarker(0);
		this.hideMarker(1);

		this.polyLine.setMap(null);
	}
	
	hideMarker (marker)
	{
		this.markers[marker].marker.setMap(null);
		if (this.markers[marker].markerListener != undefined)
		{
			google.maps.event.removeListener (this.markers[marker].markerListener);
		}
	}
}

</script>