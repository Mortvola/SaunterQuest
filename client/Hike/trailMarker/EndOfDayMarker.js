import TrailMarker from './trailMarker';

class EndOfDayMarker extends TrailMarker {
  setDay(dayNumber, day) {
    this.dayNumber = dayNumber;
    this.setPosition({
      lat: day.lat, lng: day.lng, ele: day.ele, dist: day.startMeters,
    });
  }

  infoMessage() {
    return `${'<div>End of day '}${this.dayNumber}</div>${this.getCommonInfoDivs()}`;
  }
}

export default EndOfDayMarker;
