export interface HikeManagerInterface {
  hikes: HikeItemInterface[];
}

export interface HikeItemInterface {
  id: number;
  name: string;
}

export interface BaseHikeProps {
  id: number;
  name: string;
}

export interface DetailHikeProps extends BaseHikeProps {
  duration: number | null;

  distance: number | null;
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

interface StoreInterface {
  uiState: UiState;

  hikeManager: HikeManager;

  gear: Gear;
}

interface GearConfigurationInterface {
  id: number;

  deleteItem (item: GearConfigurationItem): Promise<void>;
}
