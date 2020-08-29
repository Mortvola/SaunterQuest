import TrailMarker from './trailMarker';

class StartOfTrailMarker extends TrailMarker {
    infoMessage() {
        return `<div>Start of day 1</div>${this.getCommonInfoDivs()}`;
    }
}

export default StartOfTrailMarker;
