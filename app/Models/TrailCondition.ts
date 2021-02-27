import { DateTime } from 'luxon';
import {
  BaseModel, BelongsTo, belongsTo, column,
// eslint-disable-next-line import/no-unresolved
} from '@ioc:Adonis/Lucid/Orm';
import Hike from './Hike';

export default class TrailCondition extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public hikeId: number;

  @belongsTo(() => Hike)
  public hike: BelongsTo<typeof Hike>;

  @column()
  public startLat: number;

  @column()
  public startLng: number;

  @column()
  public endLat: number;

  @column()
  public endLng: number;

  @column()
  public type: number;

  @column()
  public description: string;

  @column()
  public speedFactor: number;
}
