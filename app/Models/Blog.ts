import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Blog extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime;

  @column({ serializeAs: null })
  public userId: number;

  @column()
  public published: boolean;

  @column({ serializeAs: 'publicationDate' })
  public publicationDate: DateTime | null;

  @column()
  public title: string;

  @column({ serializeAs: 'hikeLegId' })
  public hikeLegId: number | null;

  @column()
  public content: string | null;
}
