import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class HikerProfile extends BaseModel {
  public static table = 'hiker_profile';

  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime

  @column({ serializeAs: null })
  public hikeId: number;

  @column()
  public startDay: number;

  @column()
  public endDay: number;

  @column()
  public speedFactor: number;

  @column()
  public startTime: number;

  @column()
  public endTime: number;

  @column()
  public breakDuration: number;
}
