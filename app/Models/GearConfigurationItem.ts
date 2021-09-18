import { DateTime } from 'luxon';
import {
  BaseModel, belongsTo, BelongsTo, column,
} from '@ioc:Adonis/Lucid/Orm';
import GearConfiguration from './GearConfiguration';
import GearItem from './GearItem';

export default class GearConfigurationItem extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public gearConfigurationId: number;

  @column()
  public gearItemId: number;

  @column()
  public quantity: number;

  @column()
  public worn: boolean;

  @belongsTo(() => GearConfiguration)
  public user: BelongsTo<typeof GearConfiguration>;

  @belongsTo(() => GearItem)
  public gearItem: BelongsTo<typeof GearItem>
}
