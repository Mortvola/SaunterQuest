import { makeAutoObservable, runInAction } from 'mobx';
import { BlogPhotoProps } from '../../../common/ResponseTypes';
import { BlogPhotoInterface } from './Types';

class BlogPhoto implements BlogPhotoInterface {
  id: number;

  caption: string | null;

  orientation: number;

  width?: number;

  height?: number;

  onModified?: () => void;

  constructor(props: BlogPhotoProps, onModified?: () => void) {
    this.id = props.id;
    this.caption = props.caption;
    this.orientation = props.orientation ?? 0;
    this.width = props.width ?? undefined;
    this.height = props.height ?? undefined;

    this.onModified = onModified;

    makeAutoObservable(this);
  }

  setInfo(id: number, width?: number, height?: number): void {
    runInAction(() => {
      this.id = id;
      this.width = width;
      this.height = height;

      if (this.onModified) {
        this.onModified();
      }
    });
  }

  setCaption(caption: string): void {
    runInAction(() => {
      this.caption = caption;

      if (this.onModified) {
        this.onModified();
      }
    });
  }

  setOrientation(orientation: number): void {
    runInAction(() => {
      this.orientation = orientation;

      if (this.onModified) {
        this.onModified();
      }
    });
  }

  toJSON(): unknown {
    return {
      id: this.id,
      caption: this.caption,
      orientation: this.orientation,
    };
  }
}

export default BlogPhoto;
