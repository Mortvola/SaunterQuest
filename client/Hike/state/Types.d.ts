import { DateTime } from 'luxon';
import { RouteUpdateResponse } from '../../../common/ResponseTypes';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrailPoint extends LatLng {
  dist: number;
  ele: number;
}

export type MarkerType = 'start'
  | 'finish' | 'waypoint' | 'campsite' | 'day'
  | 'water' | 'resupply' | 'city' | 'postoffice'
  | 'rv' | 'photo';

export interface MarkerInterface {
  latLng: LatLng;

  type: MarkerType;

  deletable: boolean;

  getName(): string;

  // setSelected(selected: boolean): void;

  // toggleSelection(): void;

  remove(): void;

  delete(): void;

  move(latLng: LatLng): void;

  types(): MarkerType[];

  popup(): string | null;

  getLabel(): string | null;
}

export interface PointOfInterestInterface {
  id: number;

  name: string | null;

  marker: MarkerInterface;

  setSelected(selected: boolean): void;

  getTypeString(): string;

  getIcon(): string | null;

  delete(): void;

  move(latLng: LatLng): Promise<LatLng>;
}

export interface MapInterface {
  // hike: HikeInterface;

  markers: PointOfInterestInterface[];

  setWaiting(waiting: boolean): void;

  addMarker(marker: PointOfInterestInterface): void;

  removeMarker(marker: PointOfInterestInterface): void;

  getLeafLetMap(): L.Map | null;

  addMarkerSelection(marker: PointOfInterestInterface): void

  removeMarkerSelection(marker: PointOfInterestInterface): void;

  clearSelectedMarkers(): void;

  setTemporaryMarkerLocation(latlng: L.LatLng): void;
}

export type ElevationPoint = [number, number, number, number];

export type Grade = L.LatLng[][][];

export interface BaseRouteInterface {
  elevations: ElevationPoint[];
}

export interface RouteInterface extends BaseRouteInterface {
  anchors: Anchor[];

  grade: Grade;

  hikeLeg: HikeLegInterface;

  map: MapInterface;

  bounds: [L.LatLngTuple, L.LatLngTuple] | null;

  moveWaypoint: (id: number, point: LatLng) => Promise<LatLng>;

  generateGradeSegments(): void;

  updateRoute(updates: RouteUpdateResponse): void;
}

export interface ProfileProps {
  id: number | null;
  startDay: number | null;
  endDay: number | null;
  startTime: number | null;
  endTime: number | null;
  breakDuration: number | null;
  metersPerHour: number | null;
  endDayExtension: number | null;
}

export interface HikerProfileInterface {
  id: number | null;

  startDay: number | null;

  endDay: number | null;

  startTime: number | null;

  endTime: number | null;

  breakDuration: number | null;

  metersPerHour: number | null;

  endDayExtension: number | null;

  update(profile: ProfileProps): Promise<void>;
}

export interface HikeLegInterface {
  id: number;

  name: string | null;

  startDate: DateTime | null;

  numberOfDays: number;

  color: string;

  map: MapInterface;

  schedule: Day[];

  route: RouteInterface;

  hikerProfiles: HikerProfileInterface[];

  requestSchedule(): Promise<void>;

  requestHikerProfiles(): Promise<void>;

  deleteHikerProfile(id: number): Promise<void>;

  addHikerProfile: (profile: ProfileProps) => Promise<void>;

  setElevationMarker(latLng: L.LatLng | null): void;

  requestRouteGroup(): Promise<L.LatLng[][] | null>;

  update(name: string, startDate: string | null, color: string): Promise<void>;
}

export interface HikeInterface {
  id: number;

  name: string;

  routeGroupId: number | null;

  // map: MapInterface;

  hikeLegs: HikeLegInterface[];

  currentLeg: HikeLegInterface | null;

  updateSettings(name: string, routeGroupId: number | null): Promise<void>;

  addLeg(): Promise<void>;

  setCurrentLeg(id: number | null): void;

  deleteLeg(leg: HikeLegInterface): Promise<void>;
}

export type Day = {
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
  endOfDayPOI?: PointOfInterestInterface;
}

export interface MarkerAttributeInterface {
  type: MarkerType;
  latLng: LatLng;
  label: string | null;
  mapMarker: MarkerInterface | null;
  deletable: boolean;

  move(latLng: LatLng): Promise<LatLng>;

  delete(): void;
}

export interface PhotoInterface {
  id: number;

  caption: string;

  location: [number, number];

  offset: vec3;

  xRotation: number;

  yRotation: number;

  zRotation: number;

  translation: vec3;

  onChange: (() => void) | null;

  setOffset(x: number | null, y: number | null, z: number | null): void;

  setTranslation(x: number | null, y: number | null, z: number | null): void;

  setRotation(x: number | null, y: number | null, z: number | null): void;

  save(): void;
}

interface StoreInterface {
  uiState: UiState;
}

export interface BlackoutDatesInterface {
  id: number;

  name: string;

  start: DateTime;

  end: DateTime;

  async update(name: string, start: DateTime, end: DateTime);
}

export interface BlackoutDatesManagerInterface {
  addBlackoutDates(name: string, start: DateTime, end: DateTime): Promise<void>;

  deleteBlackoutDates(blackoutDates: BlackoutDatesInterface): Promise<void>;
}
