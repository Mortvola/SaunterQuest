import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class Photo extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column({ serializeAs: null })
  public deleted: boolean;

  @column({ serializeAs: null })
  public userId: number;

  @column()
  public orientation: number | null;

  @column()
  public width: number | null;

  @column()
  public height: number | null;
}
