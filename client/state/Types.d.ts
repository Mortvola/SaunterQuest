import TrailMarker from './TrailMarker';

export interface HikeManagerInterface {
  hikes: Array<HikeItemInterface>;
}

export interface HikeItemInterface {
  id: number;
  name: string;
}

export interface HikerProfileInterface {
  id: number | null;

  startDay: number | null;

  endDay: number | null;

  startTime: number | null;

  endTime: number | null;

  breakDuration: number | null;

  speedFactor: number | null;

  endDayExtension: number | null;

  update(profile: ProfileProps): Promise<void>;
}

export interface HikeInterface {
  id: number;

  map: MapInterface;

  schedule: Day[];

  route: RouteInterface;

  hikerProfiles: HikerProfileInterface[];

  requestSchedule(): Promise<void>;

  requestHikerProfiles(): Promise<void>;

  deleteHikerProfile(id: number): Promise<void>;

  addHikerProfile: (profile: ProfileProps) => Promise<void>;
}

export interface MapInterface {
  hike: HikeInterface;

  markers: MarkerInterface[];

  setWaiting(waiting: boolean): void;

  addMarker(marker: MarkerAttributeInterface): void;

  removeMarker(marker: Marker): void;

  getLeafLetMap(): L.Map | null;
}

export interface MarkerInterface {
  latLng: LatLng;

  move(latLng: LatLng): void;

  delete(): void;

  types(): MarkerAttributeTypes[];

  popup(): string | null;

  label(): string | null;
}

export type MarkerAttributeTypes = 'start' | 'finish' | 'waypoint' | 'campsite' | 'day' | 'water' | 'resupply';

export interface MarkerAttributeInterface {
  type: MarkerAttributeTypes;
  latLng: LatLng;
  label: string | null;
  mapMarker: MarkerInterface | null;
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
}

export interface RouteInterface {
  anchors: Anchor[];

  moveWaypoint: (id: number, point: LatLng) => Promise<LatLng>;

  deleteWaypoint(id: number): Promise<void>;
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

export interface PointOfInterestProps {
  id: number;
  lat: number;
  lng: number;
  type: MarkerAttributeTypes;
}

export interface ProfileProps {
  id: number | null;
  startDay: number | null;
  endDay: number | null;
  startTime: number | null;
  endTime: number | null;
  breakDuration: number | null;
  speedFactor: number | null;
  endDayExtension: number | null;
}
