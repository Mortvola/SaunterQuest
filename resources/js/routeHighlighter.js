"use strict";

const routeHighlightStrokePadding = 4;

class RouteHighlighter
{
	constructor (route, position, changedListener)
	{
		this.route = route;
		this.listener = changedListener;
		this.markers = [];
		this.color = "#FFFF00";
		
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
		let markerPosition = this.markers[marker].marker.getLatLng ();
		let p = {
			lat: markerPosition.lat,
			lng: markerPosition.lng
		};
			
		if (!isNaN(p.lat) && !isNaN(p.lng))
		{
			p = this.route.getNearestPoint (p);
			
			this.markers[marker].marker.setLatLng (p);
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
			this.markers[marker].marker = L.marker(position, {
				draggable: true
			}).addTo(route.map);
		}
		else
		{
			this.markers[marker].marker.setLatLng(position);
			this.markers[marker].marker.addTo(this.route.map);
		}

		var highlighter = this;
		
		this.markers[marker].marker.on ("dragend", function ()
		{
			highlighter.moveRouteHighlightMarkerToTrail (marker);
		});
	}

	highlightBetweenMarkers ()
	{
		// If both markers are on the map then draw a poly line between them on the trail.
		if (this.markers[0] && this.markers[0].marker// && this.markers[0].marker.map
		 && this.markers[1] && this.markers[1].marker)// && this.markers[1].marker.map)
		{
			// If there is an existing poly line then remove it.
			if (this.polyLine)
			{
				this.polyLine.remove();
			}

			let section = route.getSection (this.markers[0].position, this.markers[1].position);

			this.polyLine = L.polyline(section, {
				color: this.color,
				opacity: 0.7,
				weight: routeStrokeWeight + 2 * routeHighlightStrokePadding,
			});

			this.polyLine.addTo(this.route.map);
		}
	}

	end ()
	{
		this.hideMarker(0);
		this.hideMarker(1);

		if (this.polyLine)
		{
	        this.polyLine.remove();
		}
	}
	
	hideMarker (marker)
	{
		this.markers[marker].marker.remove();
	}
}
