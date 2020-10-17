import { DateTime } from 'luxon';
import Hash from '@ioc:Adonis/Core/Hash';
import {
  column,
  beforeSave,
  BaseModel,
  hasMany, HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Hike from 'App/Models/Hike';

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public username: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column({ serializeAs: null })
  public rememberMeToken?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public admin: boolean;

  @column({ serializeAs: 'paceFactor' })
  public paceFactor: number;

  @column({ serializeAs: 'startTime' })
  public startTime: number;

  @column({ serializeAs: 'endTime' })
  public endTime: number;

  @column({ serializeAs: 'breakDuration' })
  public breakDuration: number;

  @column({ serializeAs: 'endDayExtension' })
  public endDayExtension: number;

  @column({ serializeAs: 'endHikeDayExtension' })
  public endHikeDayExtension: number;

  @beforeSave()
  public static async hashPassword (user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password);
    }
  }

  @hasMany(() => Hike)
  public hikes: HasMany<typeof Hike>
}
