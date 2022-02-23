import Http from '@mortvola/http';
import { makeAutoObservable, runInAction } from 'mobx';
import { BlogProps } from '../../../common/ResponseTypes';
import { BlogInterface, BlogSectionInterface } from '../Types';
import BlogPhoto from './BlogPhoto';
import BlogSection from './BlogSection';

class Blog implements BlogInterface {
  id: number;

  published: boolean;

  title: string | null;

  titlePhoto: BlogPhoto;

  hikeLegId: number | null = null;

  nextSectionId = 0;

  sections: BlogSection[] = [];

  constructor(props: BlogProps) {
    this.id = props.id;
    this.published = props.published;
    this.title = props.title;
    this.hikeLegId = props.hikeLegId;
    this.titlePhoto = new BlogPhoto(props.titlePhoto);

    if (props.content) {
      this.sections = props.content.map((s) => new BlogSection(s));
    }

    makeAutoObservable(this);
  }

  async save(): Promise<void> {
    Http.put<BlogProps, void>('/api/blog', {
      id: this.id,
      published: this.published,
      title: this.title,
      titlePhoto: this.titlePhoto,
      hikeLegId: this.hikeLegId,
      content: this.sections.map((s) => s.serialize()),
    });
  }

  setPublished(published: boolean): void {
    runInAction(() => {
      this.published = published;
    });
  }

  setTitle(title: string | null): void {
    runInAction(() => {
      this.title = title;
    });
  }

  setHikeLegId(hikeLegId: number | null) {
    this.hikeLegId = hikeLegId;
  }

  addSectionAfter(afterSection: BlogSectionInterface | null) {
    this.nextSectionId += 1;

    if (afterSection === null) {
      runInAction(() => {
        this.sections = [
          new BlogSection({ type: 'markdown', text: null, photo: new BlogPhoto({ id: null, caption: null }) }),
          ...this.sections,
        ];
      });
    }
    else {
      runInAction(() => {
        const index = this.sections.findIndex((s) => s === afterSection);

        if (index !== -1) {
          this.sections = [
            ...this.sections.slice(0, index + 1),
            new BlogSection({ type: 'markdown', text: null, photo: new BlogPhoto({ id: null, caption: null }) }),
            ...this.sections.slice(index + 1),
          ];
        }
      });
    }
  }

  deleteSection(section: BlogSectionInterface) {
    runInAction(() => {
      const index = this.sections.findIndex((s) => s === section);

      if (index !== -1) {
        this.sections = [
          ...this.sections.slice(0, index),
          ...this.sections.slice(index + 1),
        ];
      }
    });
  }
}

export default Blog;
