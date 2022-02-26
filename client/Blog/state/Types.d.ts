import { DateTime } from 'luxon';
import { BlogSectionTypes } from '../../../common/ResponseTypes';

export type BlogPhotoInterface = {
  id: number | null,
  caption: string | null,

  setId(id: number): void;
  setCaption(caption: string): void;
}

interface BlogSectionInterface {
  type: BlogSectionTypes;

  text: string | null;

  photo: BlogPhotoInterface;

  setType(type: string);
  setText(text: string | null);
}

interface BlogInterface {
  id: number;

  published: boolean;

  publicationTime: DateTime | null;

  publicationUpdateTime: DateTime | null;

  hikeLegId: number | null;

  title: string | null;

  titlePhoto: BlogPhotoInterface;

  sections: BlogSectionInterface[];

  save(): Promise<void>;

  publish(): Promise<void>;

  unpublish(): Promise<void>;

  setTitle(title: string | null): void;

  addSectionAfter(afterSection: BlogSectionInterface | null): void;

  deleteSection(section: BlogSectionInterface): void;

  setHikeLegId(hikeLegId: number | null): void;
}

interface BlogManagerInterface {
  blogs: BlogInterface[];

  addBlog(): Promise<void>;
}
