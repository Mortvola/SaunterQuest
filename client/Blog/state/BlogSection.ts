import { makeAutoObservable, runInAction } from 'mobx';
import { BlogSectionProps, BlogSectionTypes } from '../../../common/ResponseTypes';
import { BlogInterface, BlogSectionInterface } from './Types';
import BlogPhoto from './BlogPhoto';

class BlogSection implements BlogSectionInterface {
  type: BlogSectionTypes;

  text: string | null;

  photo: BlogPhoto;

  onModified: () => void;

  constructor(props: BlogSectionProps, onModified: () => void) {
    this.type = props.type;
    this.text = props.text;
    this.onModified = onModified;

    if (props.photo) {
      this.photo = new BlogPhoto(props.photo, onModified);
    }
    else {
      this.photo = new BlogPhoto({ id: null, caption: null }, onModified);
    }

    makeAutoObservable(this);
  }

  setType(type: BlogSectionTypes) {
    runInAction(() => {
      this.type = type;
      this.onModified();
    });
  }

  setText(text: string | null) {
    runInAction(() => {
      this.text = text;
      this.onModified();
    });
  }

  toJSON(): unknown {
    switch (this.type) {
      case 'html':
      case 'markdown':
      case 'youTube':
        return {
          type: this.type,
          text: this.text,
        };

      case 'photo':
        return {
          type: this.type,
          photo: this.photo,
        };

      case 'map':
      case 'elevation':
        return {
          type: this.type,
        };
        
      default:
        return this;
    }
  }
}

export default BlogSection;
