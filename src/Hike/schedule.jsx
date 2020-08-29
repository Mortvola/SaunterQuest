import React, { useState } from 'react';
// import { getRoute, getSchedule } from './tempstore';
import {
    metersToFeet, gramsToPoundsAndOunces, metersToMilesRounded, formatTime, positionMapToBounds,
} from '../utilities';
// import EndOfDayMarker from './trailMarker/EndOfDayMarker';

const Schedule = () => {
    const [initialized, setInitialized] = useState(false);
    const [days, setDays] = useState(null);

    if (!initialized) {
        setInitialized(true);

        fetch(`${sessionStorage.getItem('hikeId')}/schedule`)
            .then(async (response) => {
                if (response.ok) {
                    setDays(await response.json());
                }
            });
    }

    //
    // Position the map so that the two endpoints (today's and tomorrow's) are visible.
    // todo: take into account the area the whole path uses. Some paths go out of window
    // even though the two endpoints are within the window.
    //
    const positionMapToDay = (d) => {
        // if (d < this.days.length - 1) {
        //     positionMapToBounds(this.map, this.days[d].point, this.days[d + 1].point);
        // }
        // else {
        //     positionMapToBounds(
        //         this.map, this.days[d].point, {
        //             lat: this.days[d].endLat,
        //             lng: this.days[d].endLng,
        //         },
        //     );
        // }
    };

    const renderDay = (day, dayNumber) => {
        const miles = metersToMilesRounded(day.startMeters + day.meters);

        return (
            <div key={dayNumber} className="card">
                <div className="card-header" style={{ padding: '5px 5px 5px 5px' }} onClick={() => positionMapToDay(day)}>
                    <div className="day-card-header">
                        <div>{`Day ${dayNumber + 1}`}</div>
                        <div>{`Gain/Loss (feet): ${metersToFeet(day.gain)}/${metersToFeet(day.loss)}`}</div>
                        <div>{`Food: ${gramsToPoundsAndOunces(day.accumWeight)}`}</div>
                        <div />
                        <div>{`Miles: ${metersToMilesRounded(day.meters)}`}</div>
                    </div>
                </div>
                <div style={{ padding: '2px 2px 2px 2px' }}>{`${formatTime(day.startTime)}, mile ${metersToMilesRounded(day.startMeters)}: start`}</div>
                <div style={{ padding: '2px 2px 2px 2px' }}>{`${formatTime(day.endTime)}, mile ${miles}: stop`}</div>
            </div>
        );
    };

    return (
        <>
            {
                days ? days.map((day, index) => renderDay(day, index)) : null
            }
        </>
    );

    // const processResponse = (days) => {
    //     const txt = '';

    //     if (this.days != null) {
    //         for (let d = 0; d < this.days.length; d += 1) {
    //             if (d > 0) {
    //                 // Add a day marker, if needed.
    //                 if (d - 1 >= this.dayMarkers.length) {
    //                     if (this.days[d].camp !== null) {
    //                         if (this.days[d].camp.type === 'waypoint') {
    //                             getRoute().setWaypointAsCamp(this.days[d].camp.id);
    //                         }

    //                         this.dayMarkers.push(null);
    //                     }
    //                     else {
    //                         this.dayMarkers.push(
    //                             new EndOfDayMarker(
    //                                 this.map, this.days[d].camped ? campUrl : endOfDayUrl,
    //                             ),
    //                         );
    //                     }
    //                 }

    //                 if (this.dayMarkers[d - 1]) {
    //                     this.dayMarkers[d - 1].setDay(d, this.days[d]);
    //                 }
    //             }
    //         }
    //     }

    //     $('#schedule').html(txt);

    //     //
    //     // Remove any remaining markers at the end of the array that are in
    //     // excess.
    //     //
    //     if (this.days != null && this.days.length < this.dayMarkers.length) {
    //         for (let i = this.days.length - 1; i < this.dayMarkers.length; i += 1) {
    //             this.dayMarkers[i].removeMarker();
    //         }

    //         this.dayMarkers.splice(this.days.length, this.dayMarkers.length - this.days.length);
    //     }
    // };
};

export default Schedule;
