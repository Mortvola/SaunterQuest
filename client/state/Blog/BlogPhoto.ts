import { makeAutoObservable, runInAction } from 'mobx';
import { BlogPhotoProps } from '../../../common/ResponseTypes';
import { BlogPhotoInterface } from '../Types';

class BlogPhoto implements BlogPhotoInterface {
  id: number | null;

  caption: string | null;

  constructor(props: BlogPhotoProps) {
    this.id = props.id;
    this.caption = props.caption;

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
}

export default BlogPhoto;
