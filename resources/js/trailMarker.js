<script>
"use strict";

class TrailMarker
{
	constructor (map, iconUrl)
	{
		this.map = map;

		this.marker = new L.Marker([],
		    {
    			icon: L.icon(
                    {
                        iconUrl: iconUrl,
                        iconAnchor: L.point(16,32),
                        popupAnchor: L.point(0,-32),
                        tooltipAnchor: L.point(0,-32),
                    })
		    }
		);
		
		this.marker.bindPopup (() => { return this.infoMessage (); } );
	}

	addListener ()
	{
	    this.marker.off ("click");
	    
		this.marker.on ("click", () =>
			{
				if (!controlDown)
				{
				    this.marker.openPopup ();
				}
			});
	}

	removeListener ()
	{
		this.marker.off("click");
	}
	
	setDraggable (draggable, listener, context)
	{
		if (draggable)
		{
			var trailMarker = this;
			
			this.dragListener = this.marker.on ("dragend", function ()
			{
				if (listener)
				{
					listener (trailMarker);
				}
			});
		}
		
		this.marker.options.draggable = draggable;
	}
	
	setPosition (position)
	{
	    if (position !== undefined)
	    {
	        this.meters = position.dist;
	        this.ele = position.ele;
	        this.marker.setLatLng (position);
	        this.marker.addTo(this.map);
	        
	        this.addListener ();
	    }
	}
	
	getPosition ()
	{
	    return this.marker.getLatLng ();
	}
	
	removeMarker ()
	{
		this.marker.remove();
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
	    this.marker.bindContextMenu({contextmenu: true, contextmenuItems: contextMenu});
	}
	
	setIcon (iconUrl)
	{
	    this.marker.setIcon(
	        L.icon(
	            {
	                iconUrl: iconUrl,
                    iconAnchor: L.point(16,32),
                    popupAnchor: L.point(0,-32),
                    tooltipAnchor: L.point(0,-32),
	            })
	    );
	}
	
	setLabel (label)
	{
	    if (label === undefined)
	    {
            this.marker.unbindTooltip();
            this.label = undefined;
	    }
	    else
	    {
            this.marker.bindTooltip(label); //, {direction: 'top', permanent: true});
	        this.label = label;
	    }
	}
	
	getLabel ()
	{
	    return this.label;
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
