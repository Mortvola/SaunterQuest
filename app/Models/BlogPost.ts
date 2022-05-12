import { DateTime } from 'luxon';
import { BaseModel, column, computed } from '@ioc:Adonis/Lucid/Orm';

interface BlogSection {
  type: 'photo' | 'markdown' | 'map' | 'elevation';
}

export interface BlogPhoto {
  id: number;
  caption: string | null;
  width: number;
  height: number;
}

export interface BlogPhotoSection extends BlogSection {
  photo: BlogPhoto;
}

export function isPhotoSection(section: BlogSection): section is BlogPhotoSection {
  return section.type === 'photo';
}

export type BlogContent = BlogSection[];

export default class BlogPost extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column()
  public title: string;

  @column({ serializeAs: null })
  public titlePhotoId: number | null;

  @column({ serializeAs: null })
  public titlePhotoCaption: string | null;

  @column({ serializeAs: null })
  public titlePhotoOrientation: number | null;

  @column({ serializeAs: 'hikeLegId' })
  public hikeLegId: number | null;

  @column({ prepare: (value) => JSON.stringify(value) })
  public content: BlogContent | null;

  @computed({ serializeAs: 'titlePhoto' })
  public titlePhoto: {
    id: number | null,
    caption: string | null,
    orientation: number,
    width: number | null,
    height: number | null,
  };
}
