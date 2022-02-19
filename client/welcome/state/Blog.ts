import Http from '@mortvola/http';
import { makeAutoObservable, runInAction } from 'mobx';
import { BlogProps, PhotoProps } from '../../../common/ResponseTypes';
import Photo from './Photo';
import { BlogInterface } from './Types';

class Blog implements BlogInterface {
  id: number;

  title: string | null;

  photos: Photo[] = [];

  hikeLegId: number | null;

  constructor(props: BlogProps) {
    this.id = props.id;
    this.title = props.title;
    this.hikeLegId = props.hikeLegId;

    makeAutoObservable(this);
  }

  async loadPhotos(): Promise<void> {
    const response = await Http.get<PhotoProps[]>(`/api/blog/${this.id}/photos`);

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        body.forEach((p) => {
          this.photos.push(new Photo(p));
        });
      });
    }
  }
}

export default Blog;
