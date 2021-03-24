import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class PointOfInterest extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public name: string;

  @column()
  public description: string;

  @column()
  public lat: number;

  @column()
  public lng: number;

  @column()
  public hikeId: number;

  @column()
  public type: 'water';
}
