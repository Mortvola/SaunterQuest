export interface PhotoInterface {
  id: number;

  caption: string;

  location: [number, number];
}

export interface BlogInterface {
  id: number;

  title: string;

  photos: PhotoInterface[];

  hikeId: number;

  loadPhotos(): Promise<void>;
}
