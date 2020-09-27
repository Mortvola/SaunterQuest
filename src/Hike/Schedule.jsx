import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { positionMapToBounds } from './mapUtils';
import {
    metersToFeet, gramsToPoundsAndOunces, metersToMilesRounded, formatTime,
} from '../utilities';
// import { getRoute } from './tempstore';
// import EndOfDayMarker from './trailMarker/EndOfDayMarker';

const mapStateToProps = (state) => ({
    map: state.map.map,
    schedule: state.schedule,
});

const Schedule = ({
    map,
    schedule,
}) => {
    const positionMapToDay = (d) => {
        //
        // Position the map so that the two endpoints (today's and tomorrow's) are visible.
        // todo: take into account the area the whole path uses. Some paths go out of window
        // even though the two endpoints are within the window.
        //
        if (schedule) {
            if (d < schedule.length - 1) {
                positionMapToBounds(map, schedule[d].point, schedule[d + 1].point);
            }
            else {
                positionMapToBounds(
                    map, schedule[d].point, {
                        lat: schedule[d].endLat,
                        lng: schedule[d].endLng,
                    },
                );
            }
        }
    };

    const renderDay = (day, dayNumber) => {
        const miles = metersToMilesRounded(day.startMeters + day.meters);

        return (
            <div key={dayNumber} className="day-card">
                <div className="card-header" style={{ padding: '5px 5px 5px 5px' }} onClick={() => positionMapToDay(dayNumber)}>
                    <div className="day-card-header">
                        <div>{`Day ${dayNumber + 1}`}</div>
                        <div />
                        <div>{`${metersToMilesRounded(day.meters)} miles`}</div>
                    </div>
                </div>
                <div className="day-card-body">
                    <div>{`Start: ${formatTime(day.startTime)}, mile ${metersToMilesRounded(day.startMeters)}`}</div>
                    <div>{`Stop: ${formatTime(day.endTime)}, mile ${miles}`}</div>
                    <div>{`Gain/Loss (feet): ${metersToFeet(day.gain)}/${metersToFeet(day.loss)}`}</div>
                    <div>{`Food: ${gramsToPoundsAndOunces(day.accumWeight)}`}</div>
                </div>
            </div>
        );
    };

    return (
        <>
            {
                schedule
                    ? schedule.map((day, index) => renderDay(day, index))
                    : null
            }
        </>
    );

    // const processResponse = (days) => {

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

Schedule.propTypes = {
    map: PropTypes.shape(),
    schedule: PropTypes.arrayOf(PropTypes.shape()),
};

Schedule.defaultProps = {
    map: null,
    schedule: [],
};

export default connect(mapStateToProps)(Schedule);
