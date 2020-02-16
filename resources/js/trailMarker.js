<script>
"use strict";

class TrailMarker
{
	constructor (map, iconUrl)
	{
		this.map = map;

		if (iconUrl !== undefined)
		{
		    this.createMarker (iconUrl, L.point(16, 32));
		}
	}

	createMarker (iconUrl, iconAnchor)
	{
        this.iconUrl = iconUrl;
        this.iconAnchor = iconAnchor;
        
        this.icon = this.createIcon ();
        
        this.marker = new L.Marker([],
            {
                icon: this.icon
            }
        );
        
        this.marker.bindPopup (
            () =>
            {
                let message = this.infoMessage ();
                
                if (this.infoMessageCallback)
                {
                    message += this.infoMessageCallback ();
                }
                
                return message;
            } );
	}

	createIcon ()
	{
	    let label = "";
	    
	    if (this.label !== undefined)
	    {
	        label = this.label;
	    }
	    
	    return L.divIcon(
	        {
	            className: 'trail-marker', 
	            html: '<div class="trail-marker-label">' + label + '</div><img src="' + this.iconUrl + '">',
                iconAnchor: this.iconAnchor,
	            popupAnchor: L.point(0,-32),
	            tooltipAnchor: L.point(0,-32),
	        });
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
		if (draggable && listener)
		{
            this.marker.on ("dragend", () =>
            {
                listener (this);
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
	
	setInfoMessageCallback (callback)
	{
	    this.infoMessageCallback = callback;
	}
	
	getCommonInfoDivs ()
	{
	    let position = this.marker.getLatLng ();
	    
		return "<div>Mile: " + metersToMilesRounded(this.meters)
			+ "</div><div>Elevation: " + metersToFeet(this.ele) + "\'</div>"
			+ "<div>Lat: " + position.lat + "</div>"
			+ "<div>Lng: " + position.lng + "</div>";
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
        this.label = label;

        this.icon = this.createIcon();

        this.marker.setIcon(this.icon);
	}
	
	getLabel ()
	{
	    return this.label;
	}
}


class campsiteMarker extends TrailMarker
{
    constructor (map)
    {
        super (map);

        this.createMarker (campsiteUrl, L.point(12, 12));
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
