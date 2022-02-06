import { DateTime } from 'luxon';
import {
  BaseModel, beforeSave, belongsTo, BelongsTo, column, computed,
// eslint-disable-next-line import/no-unresolved
} from '@ioc:Adonis/Lucid/Orm';
import Point from 'App/Types/Point';
import { ActiveHikerProfile } from 'App/Services/ActiveHikerProfile';
import { Camp } from 'App/Services/Camp';
import Schedule from './Schedule';

export default class Day extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime

  @column({ serializeAs: null })
  public scheduleId: number;

  @belongsTo(() => Schedule)
  public schedule: BelongsTo<typeof Schedule>;

  @column()
  public gain = 0;

  @column()
  public loss = 0;

  @column()
  public meters = 0;

  @column()
  public lat = 0;

  @column()
  public lng = 0;

  @computed()
  public startMeters = 0;

  @computed()
  public ele = 0;

  // in minutes
  @column({ serializeAs: 'startTime' })
  public startTime: number | null = null;

  // in minutes from midnight
  @column({ serializeAs: 'endTime' })
  public endTime: number | null = null;

  @beforeSave()
  public static async truncateFloats(day: Day): Promise<void> {
    if (day.endTime !== null) {
      day.endTime = Math.trunc(day.endTime);
    }

    if (day.gain !== null) {
      day.gain = Math.trunc(day.gain);
    }

    if (day.loss !== null) {
      day.loss = Math.trunc(day.loss);
    }
  }

  public point: Point;

  private notes: string;

  public camp: Camp;

  private elapsedTime = 0;

  public endLat: number;

  public endLng: number;

  public endEle: number;

  public endMeters: number;

  public initialize(
    hikerProfile: ActiveHikerProfile,
    point: Point,
    startMeters: number,
    camp: Camp | null = null,
    startTime: number | null = null,
  ) : void {
    this.startMeters = startMeters;

    // [this.foodPlanId, this.foodWeight) = this.getFoodPlan();

    if (this.notes === null) {
      this.notes = '';
    }

    if (this.startTime === null) {
      if (startTime === null) {
        this.startTime = hikerProfile.startTime;
      }
      else {
        this.startTime = startTime;
      }
    }

    if (this.endTime === null) {
      this.endTime = hikerProfile.endTime;
    }

    this.lat = point.lat;
    this.lng = point.lng;

    if (camp) {
      this.camp = camp;
    }

    this.gain = 0;
    this.loss = 0;
  }

  public metersAdd(meters: number): void {
    this.meters += meters;
  }

  public totalMetersGet(): number {
    return this.startMeters + this.meters;
  }

  public currentTimeGet(): number {
    if (this.startTime === null) {
      throw new Error('startTime is null');
    }

    return this.startTime + this.elapsedTime;
  }

  public elapsedTimeGet(): number {
    return this.elapsedTime;
  }

  public timeAdd(minutes: number): void {
    this.elapsedTime += minutes;
  }

  public end(): void {
    if (this.startTime === null) {
      throw new Error('startTime is null');
    }

    this.endTime = this.startTime + this.elapsedTime;
  }

  public updateGainLoss(eleDelta: number): void {
    if (Number.isNaN(eleDelta) || eleDelta === null || eleDelta === undefined) {
      throw (new Error('bad elevation delta'));
    }

    if (eleDelta > 0) {
      this.gain += eleDelta;
    }
    else {
      this.loss += -eleDelta;
    }
  }
}
