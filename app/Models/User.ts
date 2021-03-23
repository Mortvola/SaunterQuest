import { DateTime } from 'luxon';
// eslint-disable-next-line import/no-unresolved
import Hash from '@ioc:Adonis/Core/Hash';
import {
  column,
  beforeSave,
  BaseModel,
  hasMany, HasMany, hasOne, HasOne,
// eslint-disable-next-line import/no-unresolved
} from '@ioc:Adonis/Lucid/Orm';
import Hike from 'App/Models/Hike';
import HikerProfile from './HikerProfile';
import GearConfiguration from './GearConfiguration';
import GearItem from './GearItem';

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

  @column()
  public hikerProfileIsd: number;

  @column()
  public hikeCounter: number;

  @column()
  public gearConfigCounter: number;

  @hasOne(() => HikerProfile)
  public hikerProfile: HasOne<typeof HikerProfile>;

  @beforeSave()
  public static async hashPassword(user: User): Promise<void> {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password);
    }
  }

  @hasMany(() => Hike)
  public hikes: HasMany<typeof Hike>

  @hasMany(() => GearConfiguration)
  public gearConfigurations: HasMany<typeof GearConfiguration>

  @hasMany(() => GearItem)
  public gearItems: HasMany<typeof GearItem>
}
