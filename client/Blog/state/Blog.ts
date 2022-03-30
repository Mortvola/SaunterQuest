import Http from '@mortvola/http';
import { DateTime } from 'luxon';
import { makeAutoObservable, runInAction } from 'mobx';
import { BlogProps } from '../../../common/ResponseTypes';
import { BlogInterface, BlogSectionInterface } from './Types';
import BlogPhoto from './BlogPhoto';
import BlogSection from './BlogSection';

class Blog implements BlogInterface {
  id: number;

  published: boolean;

  publicationTime: DateTime | null = null;

  publicationUpdateTime: DateTime | null = null;

  title: string | null;

  titlePhoto: BlogPhoto;

  hikeLegId: number | null = null;

  nextSectionId = 0;

  sections: BlogSection[] = [];

  modified = false;

  constructor(props: BlogProps) {
    this.onModified = this.onModified.bind(this);

    this.id = props.id;
    this.published = props.publicationTime !== null;

    if (props.publicationTime) {
      this.publicationTime = DateTime.fromISO(props.publicationTime);

      if (props.publicationUpdateTime) {
        this.publicationUpdateTime = DateTime.fromISO(props.publicationUpdateTime);
      }
    }

    let post = props.draftPost;
    if (!post) {
      post = props.publishedPost;
    }

    if (!post) {
      this.title = `Unnamed (${props.id})`;
      this.titlePhoto = new BlogPhoto({ id: null, caption: null }, this.onModified);
    }
    else {
      this.title = post.title;
      this.hikeLegId = post.hikeLegId;
      this.titlePhoto = new BlogPhoto(post.titlePhoto, this.onModified);

      if (post.content) {
        this.sections = post.content.map((s) => new BlogSection(s, this.onModified));
      }
    }

    makeAutoObservable(this);
  }

  onModified() {
    runInAction(() => {
      this.modified = true;
      setTimeout(() => {
        if (this.modified) {
          this.save();
        }
      }, 15 * 1000);
    })
  }

  async save(): Promise<void> {
    const response = await Http.put<BlogProps, void>('/api/blog', {
      id: this.id,
      draftPost: {
        title: this.title,
        titlePhoto: this.titlePhoto,
        hikeLegId: this.hikeLegId,
        content: this.sections.map((s) => s),
      },
    });

    if (response.ok) {
      runInAction(() => {
        this.modified = false;
      });
    }
  }

  async publish(): Promise<void> {
    const response = await Http.post<BlogProps, void>('/api/blog/publish', {
      id: this.id,
      draftPost: {
        title: this.title,
        titlePhoto: this.titlePhoto,
        hikeLegId: this.hikeLegId,
        content: this.sections.map((s) => s),
      },
    });

    if (response.ok) {
      runInAction(() => {
        // this.published = published;
        this.modified = false;
      });
    }
  }

  async unpublish(): Promise<void> {
    await Http.post(`/api/blog/unpublish/${this.id}`);
  }

  setTitle(title: string | null): void {
    runInAction(() => {
      this.title = title;

      this.onModified();
    });
  }

  setHikeLegId(hikeLegId: number | null) {
    runInAction(() => {
      this.hikeLegId = hikeLegId;

      this.onModified();  
    });
  }

  addSectionAfter(afterSection: BlogSectionInterface | null) {
    this.nextSectionId += 1;

    if (afterSection === null) {
      runInAction(() => {
        this.sections = [
          new BlogSection(
            {
              type: 'markdown',
              text: null,
              photo: new BlogPhoto({ id: null, caption: null }, this.onModified),
            },
            this.onModified,
          ),
          ...this.sections,
        ];

        this.onModified();
      });
    }
    else {
      runInAction(() => {
        const index = this.sections.findIndex((s) => s === afterSection);

        if (index !== -1) {
          this.sections = [
            ...this.sections.slice(0, index + 1),
            new BlogSection(
              {
                type: 'markdown',
                text: null,
                photo: new BlogPhoto({ id: null, caption: null }, this.onModified),
              },
              this.onModified,
            ),
            ...this.sections.slice(index + 1),
          ];

          this.onModified();
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

        this.modified = true;
      }
    });
  }
}

export default Blog;
