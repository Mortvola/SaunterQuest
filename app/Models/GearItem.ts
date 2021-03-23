import { DateTime } from 'luxon';
import {
  BaseModel, belongsTo, BelongsTo, column,
} from '@ioc:Adonis/Lucid/Orm';
import User from './User';

export default class GearItem extends BaseModel {
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

  @column()
  public description: string;

  @column()
  public weight: number;

  @column({ serializeAs: 'unitOfMeasure' })
  public unitOfMeasure: string;

  @column()
  public consumable: boolean;

  @column()
  public system: string;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}
