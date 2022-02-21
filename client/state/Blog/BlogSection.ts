import { makeAutoObservable, runInAction } from 'mobx';
import { BlogSectionProps } from '../../../common/ResponseTypes';
import { BlogSectionInterface, BlogSectionTypes } from '../Types';

class BlogSection implements BlogSectionInterface {
  type: BlogSectionTypes;

  text: string | null;

  photoId: number | null;

  constructor(props: BlogSectionProps) {
    this.type = props.type;
    this.text = props.text;
    this.photoId = props.photoId;

    makeAutoObservable(this);
  }

  setType(type: BlogSectionTypes) {
    runInAction(() => {
      this.type = type;
    });
  }

  setText(text: string | null) {
    runInAction(() => {
      this.text = text;
    });
  }

  setPhoto(photoId: number | null) {
    runInAction(() => {
      this.photoId = photoId;
    });
  }

  serialize(): BlogSectionProps {
    return ({
      type: this.type,
      text: this.text,
      photoId: this.photoId,
    });
  }
}

export default BlogSection;
