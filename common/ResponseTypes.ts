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

export type Points = {
  ne: { lat: number, lng: number },
  sw: { lat: number, lng: number },
  textureNE: { s: number, t: number },
  textureSW: { s: number, t: number },
  points: number[][],
  centers: number[][],
};

export const isPointsResponse = (r: unknown): r is Points => (
  r !== undefined && r !== null
  && (r as Points).ne !== undefined
  && (r as Points).sw !== undefined
  && (r as Points).textureNE !== undefined
  && (r as Points).textureSW !== undefined
  && (r as Points).points !== undefined
  && (r as Points).centers !== undefined
);

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

export type DayProps = {
  gain: number,
  loss: number,
  meters: number,
  lat: number,
  lng: number,
  startTime: number | null,
  endTime: number | null,
  id: number,
  startMeters: number,
  ele: number,
};

export type ScheduleResponse = DayProps[];
