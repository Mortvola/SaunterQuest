import Http from '@mortvola/http';
import { PhotoProps } from '../../../common/ResponseTypes';
import { PhotoInterface } from './Types';

class Photo implements PhotoInterface {
  id: number;

  caption: string;

  location: [number, number];

  constructor(photo: PhotoProps) {
    this.id = photo.id;
    this.caption = photo.caption;
    this.location = photo.location;
  }
}

export default Photo;
