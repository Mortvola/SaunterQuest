import TrailMarker from '../../state/TrailMarker';

class StartOfTrailMarker extends TrailMarker {
    infoMessage() {
        return `<div>Start of day 1</div>${this.getCommonInfoDivs()}`;
    }
}

export default StartOfTrailMarker;
