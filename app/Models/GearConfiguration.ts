import { DateTime } from 'luxon';
import {
  BaseModel, belongsTo, BelongsTo, column,
  hasMany, HasMany,
} from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';
import GearConfigurationItem from './GearConfigurationItem';

export default class GearConfiguration extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public userId: number;

  @column()
  public name: string;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;

  @hasMany(() => GearConfigurationItem)
  public gearConfigItems: HasMany<typeof GearConfigurationItem>
}
