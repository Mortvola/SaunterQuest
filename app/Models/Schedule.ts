import { DateTime } from 'luxon';
import {
  BaseModel, BelongsTo, belongsTo, column,
  hasMany, HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Day from 'App/Models/Day';
import Hike from './Hike';

export default class Schedule extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column({ serializeAs: null })
  public hikeId: number;

  @belongsTo(() => Hike)
  public hike: BelongsTo<typeof Hike>;

  @column({ serializeAs: null })
  public update: boolean;

  @hasMany(() => Day)
  public days: HasMany<typeof Day>;

  public async getDays(this: Schedule): Promise<number> {
    const days = await this.related('days').query().count('*');
    return days.length;
  }
}
