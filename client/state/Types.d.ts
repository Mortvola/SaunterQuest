interface HikeInterface {
  id: number | null = null;
  requestSchedule(): Promise<void>;
}

interface HikeProps {
  id: number | null = null;

  duration: number | null = null;

  distance: number | null = null;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface TrailPoint extends LatLng {
  dist: number;
  ele: number;
  latLng: LatLng;
}

interface AnchorProps {
  id: number;
  type: string;
  marker: unknown;
  trail: Array<TrailPoint>;
  trailLength: number;
  lat: number;
  lng: number;
}
