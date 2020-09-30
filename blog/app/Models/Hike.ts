import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Hike extends BaseModel {
  public static table = 'hike';
  
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column({ serializeAs: null })
  public userId: number;

  @column()
  public name: string;

  public async getDuration() {
      return 0;
  }

  public async getDistance() {
      return 0;
  }
}
