import { makeAutoObservable, runInAction } from 'mobx';
import { BlogSectionProps } from '../../../common/ResponseTypes';
import { BlogSectionInterface, BlogSectionTypes } from '../Types';
import BlogPhoto from './BlogPhoto';

class BlogSection implements BlogSectionInterface {
  type: BlogSectionTypes;

  text: string | null;

  photo: BlogPhoto;

  constructor(props: BlogSectionProps) {
    this.type = props.type;
    this.text = props.text;

    if (props.photo) {
      this.photo = new BlogPhoto(props.photo);
    }
    else {
      this.photo = new BlogPhoto({ id: null, caption: null });
    }

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

  serialize(): BlogSectionProps {
    return ({
      type: this.type,
      text: this.text,
      photo: this.photo,
    });
  }
}

export default BlogSection;
