export type HikeProps = {
  id: number,
  name: string,
  routeGroupId: number | null,
  hikeLegs: { id: number, name: string }[],
}

export type TrailPointProps = {
  lat: number;
  lng: number;
  dist: number;
  ele: number;
}

export type AnchorProps = {
  id: number;
  type: string;
  trail: TrailPointProps[] | null;
  trailLength: number;
  // latLng: LatLng;
  lat: number;
  lng: number;
}

export type RouteUpdateType = 'start' | 'end' | 'middle';

export type RouteUpdateResponse = {
  type: RouteUpdateType;
  anchors: AnchorProps[],
}

export type ObjectProps = {
  type: string,
  points: number[],
  normals: number[],
  indices: number[],
};

export type TerrainTileProps = {
  xDimension: number,
  yDimension: number,
  ele: number[][],
  objects: ObjectProps[],
};

export interface Error {
  field: string;
  message: string;
  rule: string;
}

export interface ErrorResponse {
  errors: Error[];
}

export const isErrorResponse = (r: unknown): r is ErrorResponse => (
  (r as ErrorResponse).errors !== undefined
);

export type ElevationResponse = {
  ele: number;
}

export const isElevationResponse = (r: unknown): r is ElevationResponse => (
  (r as ElevationResponse).ele !== undefined
);

export interface City {
  id: number;
  name: string;
  location: [number, number];
}

type Transform = {
  transform: 'rotateX' | 'rotateY' | 'rotateZ' | 'translate' | 'offset' | 'translation',
  degrees?: number,
  vector?: [number, number, number],
}

export interface PhotoProps {
  id: number,
  location: [number, number],
  transforms: Transform[],
  caption: string,
}

export interface Campsite {
  id: number;
  name: string;
  location: [number, number];
}

export const isCampsiteResponse = (r: unknown): r is Campsite[] => (
  r !== null && r !== undefined
  && Array.isArray(r) && (
    (r as Campsite[]).length === 0
    || (
      (r as Campsite[])[0].id !== undefined
      && (r as Campsite[])[0].name !== undefined
      && (r as Campsite[])[0].location !== undefined
    )
  )
);

export interface PostOffice {
  id: number;
  location: [number, number];
}

export type DayProps = {
  gain: number,
  loss: number,
  meters: number,
  lat: number,
  lng: number,
  endLat: number;
  endLng: number;
  startTime: number | null,
  endTime: number | null,
  id: number,
  startMeters: number,
  ele: number,
};

export type ScheduleResponse = DayProps[];

export type BlogPhotoProps = {
  id: number | null,
  caption: string | null,
}

export type BlogSectionProps = {
  type: 'markdown' | 'elevation' | 'map' | 'photo',
  text: string | null,
  photo: BlogPhotoProps,
}

export type DraftPostProps = {
  title: string | null,
  titlePhoto: BlogPhotoProps,
  hikeLegId: number | null,
  content: BlogSectionProps[] | null,
}

export type BlogProps = {
  id: number,
  publicationTime?: string | null,
  publicationUpdateTIme?: string | null,
  draftPost?: DraftPostProps,
  publishedPost?: DraftPostProps,
};

export type HikeLegProps = {
  id: number,
  name: string | null,
};
