import { DateTime } from 'luxon'
import { BaseModel, column, computed } from '@ioc:Adonis/Lucid/Orm'

export default class RoutePoint extends BaseModel {
  public static table = 'route_point';

  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column()
  public lat: number;

  @column()
  public lng: number;

  @column({ serializeAs: null })
  public prevLineId: number;

  @column({ serializeAs: null })
  public prevFraction: number;

  @column({ serializeAs: null })
  public nextLineId: number;

  @column({ serializeAs: null })
  public nextFraction: number;

  @computed()
  public trail: any;
}
