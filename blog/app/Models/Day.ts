import { DateTime } from 'luxon';
import { BaseModel, beforeSave, column, computed } from '@ioc:Adonis/Lucid/Orm'
import Point from 'App/Types/Point';
import HikerProfile from 'App/Models/HikerProfile';

export default class Day extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime

  @column({ serializeAs: null })
  public scheduleId: number;

  @column()
  public gain = 0;

  @column()
  public loss = 0;

  @column()
  private meters = 0;

  @computed()
  private startMeters = 0;

  // in minutes
  @column({ serializeAs: 'startTime'})
  private startTime: number | null = null;

  // in minutes from midnight
  @column({ serializeAs: 'endTime'})
  public endTime: number | null = null;

  @beforeSave()
  public static async truncateFloats(day: Day) {
    if (day.endTime !== null) {
      day.endTime = Math.trunc(day.endTime);
    }
  }

  public point: Point;

  private notes: string;

  public camp: any;

  private elapsedTime: number = 0;

  public endLat: number;
  public endLng: number;
  public endEle: number;
  public endMeters: number;

  public initialize(
    hikerProfile: HikerProfile,
    point: Point,
    startMeters: number,
    camp: any | null = null,
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

    this.point = point;
    this.camp = camp;

    this.gain = 0;
    this.loss = 0;
  }

  public metersAdd (meters: number) {
    this.meters += meters;
  }

  public totalMetersGet() : number {
    return this.startMeters + this.meters;
  }

  public currentTimeGet () {
    return this.startTime! + this.elapsedTime;
  }

  public elapsedTimeGet() {
      return this.elapsedTime;
  }

  public timeAdd (minutes: number) {
      this.elapsedTime += minutes;
  }

  public end () {
    this.endTime = this.startTime! + this.elapsedTime;
  }

  public updateGainLoss (eleDelta: number) {
    if (isNaN(eleDelta) || eleDelta === null || eleDelta === undefined) {
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
