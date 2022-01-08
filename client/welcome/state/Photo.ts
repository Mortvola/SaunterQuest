import Http from '@mortvola/http';
import { vec3 } from 'gl-matrix';
import { makeAutoObservable, runInAction } from 'mobx';
import { PhotoProps } from '../../../common/ResponseTypes';
import { PhotoInterface } from './Types';

class Photo implements PhotoInterface {
  id: number;

  caption: string;

  location: [number, number];

  offset = vec3.create();

  xRotation = 0;

  yRotation = 0;

  zRotation = 0;

  translation = vec3.create();

  onChange: (() => void) | null = null;

  center: vec3 = vec3.create();

  constructor(photo: PhotoProps) {
    this.id = photo.id;
    this.caption = photo.caption;
    this.location = photo.location;

    if (photo.transforms) {
      try {
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

            case 'translation':
            case 'translate':
              this.translation = t.vector ?? vec3.create();
              break;

            case 'offset':
              this.offset = t.vector ?? vec3.create();
              break;

            default:
              break;
          }
        });
      }
      catch (error) {
        console.log('error in parsing transforms');
      }
    }
    else {
      this.offset = vec3.fromValues(20, 0, 0);
    }

    makeAutoObservable(this);
  }

  setOffset(x: number | null, y: number | null, z: number | null): void {
    runInAction(() => {
      if (x !== null) {
        this.offset[0] = x;
      }

      if (y !== null) {
        this.offset[1] = y;
      }

      if (z !== null) {
        this.offset[2] = z;
      }

      if (this.onChange) {
        this.onChange();
      }
    });
  }

  setTranslation(x: number | null, y: number | null, z: number | null): void {
    runInAction(() => {
      if (x !== null) {
        this.translation[0] = x;
      }

      if (y !== null) {
        this.translation[1] = y;
      }

      if (z !== null) {
        this.translation[2] = z;
      }

      if (this.onChange) {
        this.onChange();
      }
    });
  }

  setRotation(x: number | null, y: number | null, z: number | null): void {
    runInAction(() => {
      if (x !== null) {
        this.xRotation = x;
      }

      if (y !== null) {
        this.yRotation = y;
      }

      if (z !== null) {
        this.zRotation = z;
      }

      if (this.onChange) {
        this.onChange();
      }
    });
  }

  async save(): Promise<void> {
    await Http.put(`/api/photo/${this.id}`, {
      transforms: [
        { transform: 'rotateX', degrees: this.xRotation },
        { transform: 'rotateY', degrees: this.yRotation },
        { transform: 'rotateZ', degrees: this.zRotation },
        {
          transform: 'offset',
          vector: [
            this.offset[0],
            this.offset[1],
            this.offset[2],
          ],
        },
        {
          transform: 'translate',
          vector: [
            this.translation[0],
            this.translation[1],
            this.translation[2],
          ],
        },
      ],
    });
  }
}

export default Photo;
