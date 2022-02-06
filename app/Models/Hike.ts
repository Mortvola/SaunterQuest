/* eslint-disable brace-style */
import { DateTime } from 'luxon';
import {
  BaseModel,
  column,
  hasMany, HasMany,
  belongsTo, BelongsTo,
// eslint-disable-next-line import/no-unresolved
} from '@ioc:Adonis/Lucid/Orm';
// eslint-disable-next-line import/no-unresolved
import User from 'App/Models/User';
import PointOfInterest from 'App/Models/PointOfInterest';
import HikeLeg from 'App/Models/HikeLeg';

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

  @belongsTo(() => User, { serializeAs: null })
  public user: BelongsTo<typeof User>;

  @column()
  public name: string;

  @column({ serializeAs: 'routeGroupId' })
  public routeGroupId: number | null;

  @hasMany(() => HikeLeg)
  public hikeLegs: HasMany<typeof HikeLeg>;

  @hasMany(() => PointOfInterest)
  public pointsOfInterest: HasMany<typeof PointOfInterest>;

  // eslint-disable-next-line class-methods-use-this
  public async getDuration(this: Hike): Promise<number> {
    // await this.load('schedule');

    // if (this.schedule) {
    //   const result = await this.schedule.related('days').query();

    //   return result.length;
    // }

    return 0;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getDistance(): Promise<number> {
    // const route = await this.getFullRoute();

    // const distance = route.reduce((sum: number, routePoint: RoutePoint) => (
    //   sum + routePoint.trailLength
    // ), 0);

    // return distance;
    return 0;
  }
}
