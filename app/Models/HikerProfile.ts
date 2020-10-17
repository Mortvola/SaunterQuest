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

  @column({ serializeAs: 'startDay' })
  public startDay: number;

  @column({ serializeAs: 'endDay' })
  public endDay: number;

  @column({ serializeAs: 'speedFactor' })
  public speedFactor: number;

  @column({ serializeAs: 'startTime' })
  public startTime: number;

  @column({ serializeAs: 'endTime' })
  public endTime: number;

  @column({ serializeAs: 'breakDuration' })
  public breakDuration: number;

  @column({ serializeAs: 'endDayExtension' })
  public endDayExtension: number;
}
