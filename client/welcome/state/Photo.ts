import { vec3 } from 'gl-matrix';
import { PhotoProps } from '../../../common/ResponseTypes';
import { PhotoInterface } from './Types';

class Photo implements PhotoInterface {
  id: number;

  caption: string;

  location: [number, number];

  translation: vec3 = vec3.create();

  xRotation = 0;

  yRotation = 0;

  zRotation = 0;

  center: vec3 = vec3.create();

  constructor(photo: PhotoProps) {
    this.id = photo.id;
    this.caption = photo.caption;
    this.location = photo.location;

    if (photo.transforms) {
      photo.transforms.forEach((t) => {
        switch (t.transform) {
          case 'rotateX':
            this.xRotation = t.degrees ?? 0;
            break;

          case 'rotateY':
            this.yRotation = t.degrees ?? 0;
            break;

          case 'rotateZ':
            this.zRotation = t.degrees ?? 0;
            break;

          case 'translate':
            this.translation = t.vector ?? vec3.fromValues(0, 0, 0);
            break;

          default:
            break;
        }
      });
    }
  }

  setTranslation(x: number | null, y: number | null, z: number | null): void {
    if (x !== null) {
      this.translation[0] = x;
    }

    if (y !== null) {
      this.translation[1] = y;
    }

    if (z !== null) {
      this.translation[2] = z;
    }
  }

  setRotation(x: number | null, y: number | null, z: number | null): void {
    if (x !== null) {
      this.xRotation = x;
    }

    if (y !== null) {
      this.yRotation = y;
    }

    if (z !== null) {
      this.zRotation = z;
    }
  }
}

export default Photo;
