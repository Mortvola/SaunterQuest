import { DateTime } from 'luxon';
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm';
import BlogPost from './BlogPost';

export default class Blog extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column({ serializeAs: null })
  public userId: number;

  @column({ serializeAs: 'publicationTime' })
  public publicationTime: DateTime | null;

  @column({ serializeAs: 'publicationUpdateTime' })
  public publicationUpdateTime: DateTime | null;

  @column({ serializeAs: null })
  public publishedPostId: number | null;

  @column({ serializeAs: null })
  public draftPostId: number | null;

  @hasOne(() => BlogPost, {
    localKey: 'publishedPostId',
    foreignKey: 'id',
  })
  public publishedPost: HasOne<typeof BlogPost>;

  @hasOne(() => BlogPost, {
    localKey: 'draftPostId',
    foreignKey: 'id',
  })
  public draftPost: HasOne<typeof BlogPost>;
}
