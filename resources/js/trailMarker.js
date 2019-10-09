<script>
"use strict";

class TrailMarker
{
	constructor (map, iconUrl)
	{
		this.map = map;
		this.marker = new google.maps.Marker({
			icon: {
				url: iconUrl
			}
		});
	}

	addListener ()
	{
		if (!this.listener)
		{
			var trailMarker = this;
			
			this.listener = this.marker.addListener ("click", function ()
				{
					if (!controlDown)
					{
						this.map.infoWindow.setContent (trailMarker.infoMessage());
						this.map.infoWindow.open(map, trailMarker.marker);
					}
				});
		}
	}

	removeListener ()
	{
		this.listener.remove ();
		this.listener = null;
	}
	
	setDraggable (draggable, listener, context)
	{
		if (draggable)
		{
			var trailMarker = this;
			
			this.dragListener = this.marker.addListener ("dragend", function ()
			{
				if (listener)
				{
					listener (trailMarker);
				}
			});
		}
		
		this.marker.setDraggable(draggable);
	}
	
	setPosition (position)
	{
		this.meters = position.dist;
		this.ele = position.ele;
		this.marker.setPosition (position);
		this.marker.setMap (this.map);
		
		this.addListener ();
	}
	
	getPosition ()
	{
	    return this.marker.getPosition ();
	}
	
	removeMarker ()
	{
		this.marker.setMap(null);
		this.removeListener ();
	}
	
	infoMessage ()
	{
		return this.getCommonInfoDivs ();
	}
	
	getCommonInfoDivs ()
	{
		return "<div>Mile: " + metersToMilesRounded(this.meters)
			+ "</div><div>Elevation: " + metersToFeet(this.ele) + "\'</div>";
	}
	
	setContextMenu (contextMenu)
	{
		setContextMenu (this.marker, contextMenu, this)
	}
	
	setIcon (iconUrl)
	{
	    this.marker.setIcon(iconUrl);
	}
}

class StartOfTrailMarker extends TrailMarker
{
	constructor (map, iconUrl)
	{
		super (map, iconUrl);
	}

	infoMessage ()
	{
		return "<div>Start of day 1</div>" + this.getCommonInfoDivs ();
	}
}


class EndOfTrailMarker extends TrailMarker
{
	constructor (map, iconUrl)
	{
		super (map, iconUrl);
	}
}


class EndOfDayMarker extends TrailMarker
{
	constructor (map, iconUrl)
	{
		super (map, iconUrl);
	}

	setDay (dayNumber, day)
	{
		this.dayNumber = dayNumber;
		this.setPosition({lat: day.point.lat, lng: day.point.lng, ele: day.point.ele, dist: day.startMeters});
	}

	infoMessage ()
	{
		return "<div>"
		+ "End of day " + this.dayNumber + "</div>" + this.getCommonInfoDivs ();
	}
}
</script>
