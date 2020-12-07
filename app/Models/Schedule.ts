import { DateTime } from 'luxon';
import {
  BaseModel, column,
  hasMany, HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Day from 'App/Models/Day';

export default class Schedule extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column({ serializeAs: null })
  public hikeId: number;

  @column({ serializeAs: null })
  public update: boolean;

  @hasMany(() => Day)
  public days: HasMany<typeof Day>;
}
