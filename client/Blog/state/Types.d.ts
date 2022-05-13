import { DateTime } from 'luxon';
import { BlogSectionTypes, PhotoProps } from '../../../common/ResponseTypes';

export interface BlogPhotoInterface {
  id: number | null,
  caption: string | null,
  orientation: number,
  width?: number,
  height?: number,

  setInfo(id: number, width?: number, height?: number): void;
  setCaption(caption: string): void;
  setOrientation(orientation: number): void;
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

  modified: boolean;

  prevPostId: number | null;

  nextPostId: number | null;

  save(): Promise<void>;

  publish(): Promise<void>;

  unpublish(): Promise<void>;

  setTitle(title: string | null): void;

  addSectionAfter(afterSection: BlogSectionInterface | null): void;

  deleteSection(section: BlogSectionInterface): void;

  setHikeLegId(hikeLegId: number | null): void;
}

interface BlogListItemInterface {
  id: number;

  title: string | null;

  publicationTime?: DateTime | null;

  titlePhoto?: BlogPhotoProps;

  delete(): void;
}
