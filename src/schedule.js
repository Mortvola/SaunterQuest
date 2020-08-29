import { getRoute } from './tempstore';
import {
    metersToFeet, gramsToPoundsAndOunces, metersToMilesRounded, formatTime,
} from './utilities';

class Schedule {
    constructor(map) {
        this.map = map;
        this.days;
        this.dayMarkers = [];
    }

    retrieve() {
        const schedule = this;

        $.getJSON({
            url: `${sessionStorage.getItem('hikeId')}/schedule`,
        })
            .done((responseText) => {
        	schedule.processResponse(responseText);
            });
    }

    processResponse(responseText) {
        this.days = responseText;

        let txt = '';
        const m = 0;

        if (this.days != null) {
            for (let d = 0; d < this.days.length; d += 1) {
                txt += "<div class='card'>";
                txt += `<div class='card-header' style='padding:5px 5px 5px 5px' onclick='schedule.positionMapToDay(${d})'>`;
                txt += "<div class='day-card-header'>";
                txt += `${'<div>' + 'Day '}${ parseInt(d) + 1 }</div>`;
                txt += `${'<div>' + 'Gain/Loss (feet): '}${ metersToFeet(this.days[d].gain) }/${ metersToFeet(this.days[d].loss) }</div>`;
                txt += `${'<div>' + 'Food: '}${ gramsToPoundsAndOunces(this.days[d].accumWeight) }</div>`;
                txt += '<div>' + '' + '</div>';
                txt += `${'<div>' + 'Miles: '}${ metersToMilesRounded(this.days[d].meters) }</div>`;
                txt += '</div>';
                txt += '</div>';

                txt += `<div style='padding:2px 2px 2px 2px'>${formatTime(this.days[d].startTime)}, ` + `mile ${metersToMilesRounded(this.days[d].startMeters)}: start` + '</div>';

                //			if (data[d].events.length > 0)
                //			{
                //				for (let e in data[d].events)
                //				{
                //					txt += "<div style='padding:2px 2px 2px 2px'>" + formatTime(data[d].events[e].time) + ", " + "mile " + metersToMilesRounded (data[d].events[e].meters) + ": " + data[d].events[e].type + "</div>";
                //
                //					if (m >= markers.length)
                //					{
                //						// todo: should the marker just have the index to this day and event instead of the POI ID?
                //						markers.push({poiId: data[d].events[e].poiId, lat: parseFloat(data[d].events[e].lat), lng: parseFloat(data[d].events[e].lng)});
                //
                //						markers[m].marker = new google.maps.Marker({
                //							position: markers[m],
                //							map: map,
                //							icon: {
                //								url: pointOfInterestUrl
                //							},
                //						});
                //
                //						let markerIndex = m;
                //						markers[m].marker.addListener ("rightclick", function (event) { pointOfInterestCM.open (map, event, markerIndex); });
                //					}
                //					else
                //					{
                //						markers[m].poiId = data[d].events[e].poiId;
                //						markers[m].lat = parseFloat(data[d].events[e].lat);
                //						markers[m].lng = parseFloat(data[d].events[e].lng);
                //
                //						markers[m].marker.setPosition(markers[m]);
                //
                //						google.maps.event.removeListener (markers[m].listener);
                //					}
                //
                //					markers[m].listener = attachInfoWindowMessage(markers[m], "Resupply");
                //
                //					m += 1;
                //				}
                //			}

                txt += `<div style='padding:2px 2px 2px 2px'>${formatTime(this.days[d].endTime)}, ` + 'mile ';

                txt += metersToMilesRounded(this.days[parseInt(d)].startMeters + this.days[parseInt(d)].meters);

                txt += ': stop ' + '</div>';

                txt += '</div>';

                if (d > 0) {
                    // Add a day marker, if needed.
                    if (d - 1 >= this.dayMarkers.length) {
                        if (this.days[d].camp !== null) {
                            if (this.days[d].camp.type === 'waypoint') {
                                getRoute().setWaypointAsCamp(this.days[d].camp.id);
                            }

                            this.dayMarkers.push(null);
                        }
                        else {
                            this.dayMarkers.push(
                                new EndOfDayMarker(
                                    this.map, this.days[d].camped ? campUrl : endOfDayUrl,
                                ),
                            );
                        }
                    }

                    if (this.dayMarkers[d - 1]) {
                        this.dayMarkers[d - 1].setDay(d, this.days[d]);
                    }
                }
            }
        }

        $('#schedule').html(txt);

        //
        // Remove any remaining markers at the end of the array that are in
        // excess.
        //
        if (this.days != null && this.days.length < this.dayMarkers.length) {
            for (let i = this.days.length - 1; i < this.dayMarkers.length; i += 1) {
                this.dayMarkers[i].removeMarker();
            }

            this.dayMarkers.splice(this.days.length, this.dayMarkers.length - this.days.length);
        }
    }

    //
    // Position the map so that the two endpoints (today's and tomorrow's) are visible.
    // todo: take into account the area the whole path uses. Some paths go out of window
    // even though the two endpoints are within the window.
    //
    positionMapToDay(d) {
        if (d < this.days.length - 1) {
            positionMapToBounds(this.map, this.days[d].point, this.days[d + 1].point);
        }
        else {
            positionMapToBounds(this.map, this.days[d].point, { lat: this.days[d].endLat, lng: this.days[d].endLng });
        }
    }
}

export default Schedule;
