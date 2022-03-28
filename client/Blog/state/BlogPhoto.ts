import { makeAutoObservable, runInAction } from 'mobx';
import { BlogPhotoProps } from '../../../common/ResponseTypes';
import { BlogPhotoInterface } from './Types';

class BlogPhoto implements BlogPhotoInterface {
  id: number | null;

  caption: string | null;

  orientation: number;

  constructor(props: BlogPhotoProps) {
    this.id = props.id;
    this.caption = props.caption;
    this.orientation = props.orientation ?? 0;

    makeAutoObservable(this);
  }

  setId(id: number): void {
    runInAction(() => {
      this.id = id;
    });
  }

  setCaption(caption: string): void {
    runInAction(() => {
      this.caption = caption;
    });
  }

  setOrientation(orientation: number): void {
    runInAction(() => {
      this.orientation = orientation;
    })
  }
}

export default BlogPhoto;
