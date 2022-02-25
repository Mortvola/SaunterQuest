import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class BlogComment extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: 'createdAt' })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column({ serializeAs: null })
  public blogId: number;

  @column()
  public name: string;

  @column()
  public email: string;

  @column()
  public comment: string;

  @column()
  public replyToId: number | null;

  @column()
  public notify: boolean;
}
