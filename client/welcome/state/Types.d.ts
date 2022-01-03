import { vec3 } from 'gl-matrix';

export interface PhotoInterface {
  id: number;

  caption: string;

  location: [number, number];

  translation: vec3;

  xRotation: number;

  yRotation: number;

  zRotation: number;

  setTranslation(x: number | null, y: number | null, z: number | null): void;

  setRotation(x: number | null, y: number | null, z: number | null): void;
}

export interface BlogInterface {
  id: number;

  title: string;

  photos: PhotoInterface[];

  hikeId: number;

  loadPhotos(): Promise<void>;
}
