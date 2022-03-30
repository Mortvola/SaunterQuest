import { makeAutoObservable, runInAction } from 'mobx';
import { BlogPhotoProps } from '../../../common/ResponseTypes';
import { BlogInterface, BlogPhotoInterface } from './Types';

class BlogPhoto implements BlogPhotoInterface {
  id: number | null;

  caption: string | null;

  orientation: number;

  onModified: () => void;

  constructor(props: BlogPhotoProps, onModified: () => void) {
    this.id = props.id;
    this.caption = props.caption;
    this.orientation = props.orientation ?? 0;
    this.onModified = onModified;

    makeAutoObservable(this);
  }

  setId(id: number): void {
    runInAction(() => {
      this.id = id;
      this.onModified();
    });
  }

  setCaption(caption: string): void {
    runInAction(() => {
      this.caption = caption;
      this.onModified();
    });
  }

  setOrientation(orientation: number): void {
    runInAction(() => {
      this.orientation = orientation;
      this.onModified();
    })
  }
}

export default BlogPhoto;
