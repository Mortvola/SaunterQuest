import TrailMarker from './TrailMarker';

export interface HikeManagerInterface {
  hikes: Array<HikeInterface>;
}

export interface HikeInterface {
  id: number | null;
  requestSchedule(): Promise<void>;
}

export interface BaseHikeProps {
  id: number | null;
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
  latLng: LatLng;
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
  startMile: number;
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
