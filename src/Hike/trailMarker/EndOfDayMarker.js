import TrailMarker from './trailMarker';

class EndOfDayMarker extends TrailMarker {
    setDay(dayNumber, day) {
        this.dayNumber = dayNumber;
        this.setPosition({
            lat: day.point.lat, lng: day.point.lng, ele: day.point.ele, dist: day.startMeters,
        });
    }

    infoMessage() {
        return `${'<div>End of day '}${this.dayNumber}</div>${this.getCommonInfoDivs()}`;
    }
}

export default EndOfDayMarker;
