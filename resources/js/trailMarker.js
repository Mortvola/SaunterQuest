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
			},
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
	
	setPosition (position)
	{
		this.meters = position.dist;
		this.ele = position.ele;
		this.marker.setPosition (position);
		this.marker.setMap (this.map);
		
		this.addListener ();
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
		this.setPosition({lat: day.lat, lng: day.lng, ele: day.ele, dist: day.startMeters});
	}

	infoMessage ()
	{
		return "<div>"
		+ "End of day " + this.dayNumber + "</div>" + this.getCommonInfoDivs ();
	}
}
</script>
