import { makeAutoObservable } from 'mobx';
import MapMarker from './MapMarker';
import { LatLng, MapInterface, MarkerInterface } from './Types';

class Map implements MapInterface {
  locationPopup: LatLng | null = null;

  markers: Array<MapMarker> = [];

  private leafletMap: L.Map | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  addMarker(marker: MarkerInterface): void {
    let mapMmarker = this.markers.find((m) => (
      m.latLng.lat === marker.latLng.lat
      && m.latLng.lng === marker.latLng.lng
    ));

    if (!mapMmarker) {
      mapMmarker = new MapMarker(marker.latLng);
      this.markers.push(mapMmarker);
    }

    mapMmarker.addMarker(marker);
  }

  showLocationPopup(latlng: LatLng | null): void {
    this.locationPopup = latlng;
  }

  setLeafletMap(leafletMap: L.Map): void {
    this.leafletMap = leafletMap;
  }

  getLeafLetMap(): L.Map | null {
    return this.leafletMap;
  }
}

export default Map;
