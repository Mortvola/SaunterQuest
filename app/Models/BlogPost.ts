import { DateTime } from 'luxon';
import { BaseModel, column, computed } from '@ioc:Adonis/Lucid/Orm';

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

  @column()
  public content: any | null;

  @computed({ serializeAs: 'titlePhoto' })
  public get photo() {
    return {
      id: this.titlePhotoId ?? null,
      caption: this.titlePhotoCaption ?? null,
      orientation: this.titlePhotoOrientation ?? 0,
    };
  }
}
