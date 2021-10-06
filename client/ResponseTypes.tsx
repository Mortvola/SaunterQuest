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
