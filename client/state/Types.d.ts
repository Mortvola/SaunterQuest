export interface HikeManagerInterface {
  hikes: HikeItemInterface[];
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

  metersPerHour: number | null;

  endDayExtension: number | null;

  update(profile: ProfileProps): Promise<void>;
}

export interface HikeLegInterface {
  id: number;

  map: MapInterface;

  schedule: Day[];

  route: RouteInterface;

  hikerProfiles: HikerProfileInterface[];

  requestSchedule(): Promise<void>;

  requestHikerProfiles(): Promise<void>;

  deleteHikerProfile(id: number): Promise<void>;

  addHikerProfile: (profile: ProfileProps) => Promise<void>;

  setElevationMarker(latLng: L.LatLng | null): void
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

  setCurrentLeg(id: number): void;

  deleteLeg(leg: HikeLeg): Promise<void>;
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

export type MarkerType = 'start'
  | 'finish' | 'waypoint' | 'campsite' | 'day'
  | 'water' | 'resupply' | 'city' | 'postoffice'
  | 'rv' | 'photo';

export interface MarkerAttributeInterface {
  type: MarkerType;
  latLng: LatLng;
  label: string | null;
  mapMarker: MarkerInterface | null;
  deletable: boolean;

  move(latLng: LatLng): Promise<LatLng>;

  delete(): void;
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

// export interface DayProps {
//   id: number;
//   day: number;
//   lat: number;
//   lng: number;
//   endLat: number;
//   endLng: number;
//   ele: number;
//   marker: TrailMarker;
//   startMeters: number;
//   meters: number;
//   startTime: number;
//   endTime: number;
//   gain: number;
//   loss: number;
//   accumWeight: number;
// }

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

export type Grade = L.LatLng[][][];

export type ElevationPoint = [number, number, number, number];

export interface BaseRouteInterface {
  elevations: ElevationPoint[];
}

export interface RouteInterface extends BaseRouteInterface {
  anchors: Anchor[];

  grade: Grade;

  hikeLeg: HikeLegInterface;

  map: MapInterface;

  moveWaypoint: (id: number, point: LatLng) => Promise<LatLng>;

  generateGradeSegments(): void;

  updateRoute(updates: RouteUpdateResponse): void;
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
  type: MarkerType;
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

  hikeManager: HikeManager;

  gear: Gear;
}

interface GearConfigurationInterface {
  id: number;

  deleteItem (item: GearConfigurationItem): Promise<void>;
}

export type BlogSectionTypes = 'markdown' | 'elevation' | 'map' | 'photo';

interface BlogSectionInterface {
  type: BlogSectionTypes;

  text: string | null;

  photoId: number | null;

  setType(type: string);
  setText(text: string | null);
  setPhoto(photoId: number | null);
}

interface BlogInterface {
  id: number;

  published: boolean;

  hikeLegId: number | null;

  title: string | null;

  sections: BlogSectionInterface[];

  save(): Promise<void>;

  setPublished(published: boolean): void;

  setTitle(title: string | null): void;

  addSectionAfter(afterSection: BlogSectionInterface | null): void;

  deleteSection(section: BlogSectionInterface): void;

  setHikeLegId(hikeLegId: number | null): void;
}

interface BlogManagerInterface {
  blogs: BlogInterface[];
}
