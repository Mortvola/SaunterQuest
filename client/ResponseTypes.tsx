export type Points = {
  ne: { lat: number, lng: number },
  sw: { lat: number, lng: number },
  textureNE: { s: number, t: number },
  textureSW: { s: number, t: number },
  points: number[][],
  centers: number[][],
};
