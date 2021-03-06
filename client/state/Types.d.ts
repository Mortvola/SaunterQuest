import TrailMarker from './TrailMarker';

export interface HikeManagerInterface {
  hikes: Array<HikeItemInterface>;
}

export interface HikeItemInterface {
  id: number;
  name: string;
}

export interface HikeInterface {
  id: number;
  map: MapInterface;

  requestSchedule(): Promise<void>;
}

export interface MapInterface {
  markers: Array<MapMarkerInterface>;

  addMarker(marker: MarkerInterface): void;
}

export interface MapMarkerInterface {
  latLng: LatLng;
  move(latLng: LatLng): void;
}

export type MarkerTypes = 'waypoint' | 'campsite' | 'day';

export interface MarkerInterface {
  type: MarkerTypes;
  latLng: LatLng;
  mapMarker: MapMarkerInterface | null;
  move(latLng: LatLng): Promise<LatLng>;
}

export interface BaseHikeProps {
  id: number;
  name: string;
}

export interface DetailHikeProps extends BaseHikeProps {
  duration: number | null;

  distance: number | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrailPoint extends LatLng {
  dist: number;
  ele: number;
}

export interface AnchorProps {
  id: number;
  type: string;
  marker: unknown;
  trail: Array<TrailPoint>;
  trailLength: number;
  // latLng: LatLng;
  lat: number;
  lng: number;
}

export interface DayProps {
  id: number;
  day: number;
  lat: number;
  lng: number;
  endLat: number;
  endLng: number;
  ele: number;
  marker: TrailMarker;
  startMeters: number;
  meters: number;
  startTime: number;
  endTime: number;
  gain: number;
  loss: number;
  accumWeight: number;
}

export interface Day {
  id: number;
  day: number;
  latLng: LatLng;
  endLatLng: LatLng;
  ele: number;
  startMeters: number;
  meters: number;
  startTime: number;
  endTime: number;
  gain: number;
  loss: number;
  accumWeight: number;
  marker: TrailMarker,
}

export interface RouteInterface {
  moveWaypoint: (id: number, point: LatLng) => Promise<LatLng>;
}

export interface GearConfigProps {
  id: number;
  name: string;
  wornWeight: number;
  packWeight: number;
  consumableWeight: number;
}

export interface GearConfigItemProps {
  id: number;
  gearItem: GearItemProps;
  quantity: number;
  worn: boolean;
}

export interface GearItemProps {
  id: number;
  consumable: boolean;
  description: string;
  name: string;
  system: string;
  unitOfMeasure: string;
  weight: number;
}
