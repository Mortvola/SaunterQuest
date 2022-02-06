import { DateTime } from 'luxon';
import { BaseModel, column, beforeSave } from '@ioc:Adonis/Lucid/Orm'

export default class HikerProfile extends BaseModel {
  public static table = 'hiker_profile';

  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime

  @column({ serializeAs: null })
  public hikeLegId: number;

  @column({ serializeAs: 'startDay' })
  public startDay: number | null;

  @column({ serializeAs: 'endDay' })
  public endDay: number | null;

  @column({ serializeAs: 'metersPerHour' })
  public metersPerHour: number | null;

  @column({ serializeAs: 'startTime' })
  public startTime: number | null;

  @column({ serializeAs: 'endTime' })
  public endTime: number | null;

  @column({ serializeAs: 'breakDuration' })
  public breakDuration: number | null;

  @column({ serializeAs: 'endDayExtension' })
  public endDayExtension: number | null;

  @column({ serializeAs: 'endHikeDayExtension' })
  public endHikeDayExtension: number | null;

  @beforeSave()
  public static async translateToNull(profile: HikerProfile): Promise<void> {
    profile.convertStringToNull('startDay');
    profile.convertStringToNull('endDay');
    profile.convertStringToNull('metersPerHour');
    profile.convertStringToNull('startTime');
    profile.convertStringToNull('endTime');
    profile.convertStringToNull('breakDuration');
    profile.convertStringToNull('endDayExtension');
    profile.convertStringToNull('endHikeDayExtension');
  }

  // eslint-disable-next-line class-methods-use-this
  private convertStringToNull(key: string): void {
    if (this.$dirty[key] !== undefined) {
      this[key] = (
        Number.isNaN(this[key]) || typeof this[key] !== 'number'
          ? null
          : this[key]
      );
    }
  }
}
