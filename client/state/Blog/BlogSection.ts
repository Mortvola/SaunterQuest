import { makeAutoObservable, runInAction } from 'mobx';
import { BlogSectionProps } from '../../../common/ResponseTypes';
import { BlogSectionInterface, BlogSectionTypes } from '../Types';

class BlogSection implements BlogSectionInterface {
  type: BlogSectionTypes;

  text: string | null;

  constructor(props: BlogSectionProps) {
    this.type = props.type;
    this.text = props.text;

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
    });
  }
}

export default BlogSection;
