/* eslint-disable brace-style */
import { DateTime } from 'luxon';
import {
  BaseModel,
  column,
  hasMany, HasMany,
  hasOne, HasOne,
  belongsTo, BelongsTo,
} from '@ioc:Adonis/Lucid/Orm';
import Env from '@ioc:Adonis/Core/Env';
import fetch from 'node-fetch';
import RoutePoint from 'App/Models/RoutePoint';
import HikerProfile from 'App/Models/HikerProfile';
import Schedule from 'App/Models/Schedule';
import Scheduler from 'App/Services/Scheduler';
import User from 'App/Models/User';
import Router from 'App/Services/Router';
import Point from 'App/Types/Point';

const MAX_ORDER = 100000;

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

  @hasMany(() => RoutePoint)
  public routePoints: HasMany<typeof RoutePoint>;

  @hasMany(() => HikerProfile)
  public hikerProfiles: HasMany<typeof HikerProfile>;

  @hasOne(() => Schedule)
  public schedule: HasOne<typeof Schedule>;

  public async getDuration(): Promise<number> {
    return 0;
  }

  public async getDistance(): Promise<number> {
    return 0;
  }

  public async updateSchedule(this: Hike, user: User) : Promise<void> {
    const scheduler = new Scheduler();

    scheduler.createSchedule(this.routePoints, user, this.hikerProfiles);

    if (isNaN(scheduler.days[0].loss)) {
      throw (new Error('loss is NaN'));
    }

    await this.related('schedule').updateOrCreate({}, {});
    await this.preload('schedule');

    if (isNaN(scheduler.days[0].loss)) {
      throw (new Error('loss is NaN'));
    }

    await this.schedule.related('days').saveMany(scheduler.days);
    await this.schedule.preload('days');
  }

  private async loadAnchorTrail(
    anchorIndex: number,
  ) : Promise<void> {
    if (anchorIndex >= this.routePoints.length - 1) {
      throw (new Error(`Index beyond end of routePoints: ${anchorIndex}, ${this.routePoints.length}`));
    }

    const routePoint = this.routePoints[anchorIndex];
    const n = this.routePoints[anchorIndex + 1];

    if (n.prevLineId === null || n.prevFraction === null) {
      throw (new Error(`prevLineId or prevFraction is null: ${JSON.stringify(routePoint)}, index: ${anchorIndex + 1}`));
    }

    if (routePoint.nextLineId !== n.prevLineId) {
      throw (new Error(`Previous and next IDs do not match: ${routePoint.nextLineId}, ${n.prevLineId}, ${JSON.stringify(routePoint)}, ${JSON.stringify(n)}`));
    }

    return routePoint.loadTrail(n.prevFraction);
  }

  public async getAnchor(anchorIndex: number, includeTrail = true) : Promise<RoutePoint> {
    const routePoint = this.routePoints[anchorIndex];

    if (includeTrail && anchorIndex < this.routePoints.length - 1) {
      await this.loadAnchorTrail(anchorIndex);
    }

    return routePoint;
  }

  public async loadTrails(
    this: Hike,
    startAnchorIndex = 0,
    endAnchorIndex: number = this.routePoints.length - 1,
  ): Promise<void[]> {
    if (this.routePoints.length > 1) {
      if (startAnchorIndex === endAnchorIndex) {
        throw (new Error(`Start and end anchor are the same: ${startAnchorIndex}, ${endAnchorIndex}`));
      }

      const promises: Promise<void>[] = [];

      for (let i = startAnchorIndex; i <= endAnchorIndex - 1; i += 1) {
        promises.push(this.loadAnchorTrail(i));
      }

      return Promise.all(promises);
    }

    return [];
  }

  public async getTrail(
    this: Hike,
    startAnchorIndex: number,
    endAnchorIndex: number,
  ): Promise<RoutePoint[]> {
    if (startAnchorIndex === endAnchorIndex) {
      throw (new Error(`Start and end anchor are the same: ${startAnchorIndex}, ${endAnchorIndex}`));
    }

    // Load the trails following each anchor
    const promises: Promise<void>[] = [];

    for (let i = startAnchorIndex; i <= endAnchorIndex; i += 1) {
      if (i < this.routePoints.length - 1) {
        promises.push(this.loadAnchorTrail(i));
      }
    }

    await Promise.all(promises);

    return this.routePoints.slice(startAnchorIndex, endAnchorIndex + 1);
  }

  public async getFullRoute(this: Hike) : Promise<RoutePoint[]> {
    await this.preload('routePoints', (query) => query.orderBy('sort_order'));

    return Promise.all(this.routePoints
      .map(async (p, index) => {
        if (index < this.routePoints.length - 1) {
          await this.loadAnchorTrail(index);
        }
        return p;
      }));
  }

  private static edgeFractionBetweenAnchors(
    lineId: number,
    fraction: number,
    prevAnchor: RoutePoint,
    nextAnchor: RoutePoint,
  ): boolean {
    return (
      prevAnchor.nextLineId !== null
      && prevAnchor.nextFraction !== null
      && nextAnchor.prevLineId !== null
      && nextAnchor.prevFraction !== null
      && prevAnchor.nextLineId === lineId
      && nextAnchor.prevLineId === lineId
      && ((fraction >= prevAnchor.nextFraction && fraction <= nextAnchor.prevFraction)
        || (fraction >= nextAnchor.prevFraction && fraction <= prevAnchor.nextFraction)));
  }

  private findNextWaypointIndex(startIndex: number): number | null {
    if (this.routePoints.length >= 2) {
      for (let i = startIndex + 1; i < this.routePoints.length; i += 1) {
        if ((this.routePoints[i].type !== null)) {
          return i;
        }
      }
    }

    return null;
  }

  private findPrevWaypointIndex(startIndex: number): number | null {
    if (this.routePoints.length >= 2) {
      for (let i = startIndex - 1; i >= 0; i -= 1) {
        if (this.routePoints[i].type !== null) {
          return i;
        }
      }
    }

    return null;
  }

  public async updateWaypointPosition(
    this: Hike,
    waypointId: number,
    point: Point,
  ) : Promise<RoutePoint[]> {
    let waypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === waypointId);

    if (waypointIndex === -1) {
      throw (new Error(`Index for waypoint not found ${waypointId}`));
    }

    // Determine the position on the nearest trail
    const trailInfo = await Router.getTrailFromPoint(point);

    const waypoint = this.routePoints[waypointIndex];

    waypoint.lat = trailInfo.point.lat;
    waypoint.lng = trailInfo.point.lng;

    if (
      waypoint.lat !== this.routePoints[waypointIndex].lat
      || waypoint.lng !== this.routePoints[waypointIndex].lng
    ) {
      throw (new Error('lat/lng did not change'));
    }

    if (waypointIndex !== 0) {
      waypoint.prevLineId = trailInfo.line_id;
      waypoint.prevFraction = trailInfo.fraction;
    }

    if (waypointIndex !== this.routePoints.length - 1) {
      waypoint.nextLineId = trailInfo.line_id;
      waypoint.nextFraction = trailInfo.fraction;
    }

    await this.related('routePoints').save(waypoint);

    // If this is the only anchor in the array of anchors then just
    // move the anchor (there is no route finding to worry about).
    if (this.routePoints.length === 1) {
      return this.prepareUpdates([0]);
    }

    // Determine if the point is on the route already

    // If the anchor that is being updated does not change its position
    // relative to its original neighboring anchors then it is a simple
    // move and does not require route finding.
    if (
      waypointIndex > 0 && waypointIndex < this.routePoints.length - 1
      && Hike.edgeFractionBetweenAnchors(
        trailInfo.line_id,
        trailInfo.fraction,
        this.routePoints[waypointIndex - 1],
        this.routePoints[waypointIndex + 1],
      )
    ) {
      return this.prepareUpdates([waypointIndex - 1, waypointIndex]);
    }

    let prevWaypointIndex = this.findPrevWaypointIndex(waypointIndex);
    let nextWaypointIndex = this.findNextWaypointIndex(waypointIndex);

    if (prevWaypointIndex === null) {
      if (nextWaypointIndex === null) {
        return this.prepareUpdates([waypointIndex]);
      }

      const nextWaypointId = this.routePoints[nextWaypointIndex].id;

      await this.findRouteBetweenWaypoints([waypointIndex, nextWaypointIndex]);

      waypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === waypointId);
      nextWaypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === nextWaypointId);

      return this.prepareUpdates([waypointIndex, nextWaypointIndex]);
    }

    if (nextWaypointIndex === null) {
      const prevAnchorId = this.routePoints[prevWaypointIndex].id;

      await this.findRouteBetweenWaypoints([prevWaypointIndex, waypointIndex]);

      prevWaypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === prevAnchorId);
      waypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === waypointId);

      return this.prepareUpdates([prevWaypointIndex, waypointIndex]);
    }

    const prevWaypointId = this.routePoints[prevWaypointIndex].id;
    const nextWaypointId = this.routePoints[nextWaypointIndex].id;

    await this.findRouteBetweenWaypoints([prevWaypointIndex, waypointIndex, nextWaypointIndex]);

    prevWaypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === prevWaypointId);
    nextWaypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === nextWaypointId);

    return this.prepareUpdates([prevWaypointIndex, nextWaypointIndex]);
  }

  private deleteRoutePoints(index1: number, index2: number) {
    if (index1 < index2) {
      for (let i = index1; i < index2; i += 1) {
        this.routePoints[i].delete();
      }

      this.routePoints.splice(index1, index2 - index1);
    }
  }

  private static transferRoutePointInfo(src: any) {
    let info = {
      lat: src.point.lat,
      lng: src.point.lng,
    };

    if (src.prev) {
      info = Object.assign(info, {
        prevLineId: src.prev.line_id,
        prevFraction: src.prev.fraction,
      });
    }

    if (src.next) {
      info = Object.assign(info, {
        nextLineId: src.next.line_id,
        nextFraction: src.next.fraction,
      });
    }

    return info;
  }

  private async updateSortOrder(this: Hike) {
    const valuePerAnchor = Math.trunc(MAX_ORDER / this.routePoints.length);
    let currentValue = valuePerAnchor;

    for (let anchor of this.routePoints) {
      anchor.sortOrder = currentValue;
      await this.related('routePoints').save(anchor);
      currentValue += valuePerAnchor;
    }
  }

  private async getSortOrder(prevAnchorIndex: number, nextAnchorIndex: number) {
    let order = MAX_ORDER / 2;

    for (let i = 0; i < 2; i += 1) {
      let prevOrder = 0;
      if (prevAnchorIndex >= 0 && this.routePoints.length !== 0) {
        prevOrder = this.routePoints[prevAnchorIndex].sortOrder;
      }

      let nextOrder = MAX_ORDER;

      if (nextAnchorIndex === -1 || nextAnchorIndex >= this.routePoints.length) {
        nextAnchorIndex = this.routePoints.length;
      }
      else {
        nextOrder = this.routePoints[nextAnchorIndex].sortOrder;
      }

      order = prevOrder + Math.trunc((nextOrder - prevOrder) / 2);

      if (
        (prevAnchorIndex >= 0 && order === this.routePoints[prevAnchorIndex].sortOrder)
        || (nextAnchorIndex < this.routePoints.length
          && order === this.routePoints[nextAnchorIndex].sortOrder)
      ) {
        await this.updateSortOrder();
      }
      else {
        break;
      }
    }

    return order;
  }

  private static async findPath(anchors: RoutePoint[]) {
    const points = anchors.map((anchor) => ({ lat: anchor.lat, lng: anchor.lng }));

    const encodedPoints = encodeURIComponent(JSON.stringify(points));

    const path = await fetch(`${Env.get('PATHFINDER_URL')}/map/route?p=${encodedPoints}`)
      .then((response: any) => {
        if (response.ok) {
          return response.json();
        }

        throw (new Error(`Fetch from pathFinder failed: ${response.statusText}`));
      });

    if (path === null) {
      throw (new Error(`Path could not be determined from points: ${JSON.stringify(points)}`));
    }

    return path;
  }

  private async findRouteBetweenWaypoints(this: Hike, anchorIndexes: number[]): Promise<void> {
    const anchors = anchorIndexes.map((a) => this.routePoints[a]);

    const newAnchorsArray = await Hike.findPath(anchors);

    if (newAnchorsArray) {
      for (let a = 0; a < anchors.length - 1; a += 1) {
        const newAnchors = newAnchorsArray[a];

        const anchorIndex1 = this.routePoints.findIndex(
          (p: RoutePoint) => p.id === anchors[a].id,
        );
        let anchorIndex2 = this.routePoints.findIndex(
          (p: RoutePoint) => p.id === anchors[a + 1].id,
        );

        // Delete 'soft' anchors between the two anchors
        this.deleteRoutePoints(anchorIndex1 + 1, anchorIndex2);

        const anchor1 = Object.assign(
          this.routePoints[anchorIndex1],
          Hike.transferRoutePointInfo(newAnchors[0]),
        );
        this.routePoints.splice(anchorIndex1, 1, anchor1);
        await this.related('routePoints').save(anchor1);

        for (let i = 1; i < newAnchors.length - 1; i += 1) {
          const routePoint = Object.assign(
            new RoutePoint(),
            Hike.transferRoutePointInfo(newAnchors[i]),
          );

          routePoint.sortOrder = await this.getSortOrder(anchorIndex1 + i - 1, anchorIndex1 + i);

          this.routePoints.splice(anchorIndex1 + i, 0, routePoint);
          await this.related('routePoints').save(routePoint);
        }

        anchorIndex2 = this.routePoints.findIndex(
          (p: RoutePoint) => p.id === anchors[a + 1].id,
        );

        if (anchorIndex2 === -1) {
          throw (new Error(`Unable to find route point with id ${anchors[anchors.length - 1].id}`));
        }

        const anchor2 = Object.assign(
          this.routePoints[anchorIndex2],
          Hike.transferRoutePointInfo(newAnchors[newAnchors.length - 1]),
        );
        this.routePoints.splice(anchorIndex2, 1, anchor2);
        await this.related('routePoints').save(anchor2);
      }
    }
  }

  private validateUpdate(this: Hike) {
    // Check to make sure the previous and next lineIds are correct.
    this.routePoints.forEach((_, index) => {
      if (
        index === 0
        && ((this.routePoints[index].prevFraction !== null
          && this.routePoints[index].prevFraction !== undefined)
        || (this.routePoints[index].prevLineId !== null
          && this.routePoints[index].prevLineId !== undefined))
      ) {
        throw (new Error('First point has non-null prev values: '
          + `${JSON.stringify(this.routePoints[index])}, `
          + `${JSON.stringify(this.routePoints[index].prevFraction)}, `
          + `${JSON.stringify(this.routePoints[index].prevLineId)}, `));
      }
      else if (index < this.routePoints.length - 1) {
        if (this.routePoints[index].nextLineId !== this.routePoints[index + 1].prevLineId) {
          throw (new Error('Previous and next IDs do not match: '
            + `${JSON.stringify(this.routePoints[index])}, `
            + `${JSON.stringify(this.routePoints[index + 1])}, `
            + `${this.routePoints[index].nextLineId}, `
            + `${this.routePoints[index + 1].prevLineId}`));
        }
        else if (this.routePoints[index].nextFraction === null
          || this.routePoints[index].nextLineId === null) {
          throw (new Error(`Internal point has null next values: ${JSON.stringify(this.routePoints[index])}`));
        }
      }
      else if (
        (this.routePoints[index].nextFraction !== null
          && this.routePoints[index].nextFraction !== undefined)
        || (this.routePoints[index].nextLineId !== null
          && this.routePoints[index].nextLineId !== undefined)
      ) {
        throw (new Error('Last point has non-null next values: '
          + `${JSON.stringify(this.routePoints[index])}, `
          + `${JSON.stringify(this.routePoints[index].nextFraction)}, `
          + `${JSON.stringify(this.routePoints[index].nextLineId)}, `));
      }
    });
  }

  private async prepareUpdates(
    this: Hike,
    update: number[],
  ): Promise<RoutePoint[]> {
    this.validateUpdate();

    let routeUpdate: RoutePoint[];

    if (update.length >= 2) {
      if (update[0] === -1) {
        if (update[1] === -1) {
          routeUpdate = [];
        }
        else {
          routeUpdate = [await this.getAnchor(update[1])];
        }
      }
      else if (update[1] === -1) {
        const anchor = await this.getAnchor(update[0]);
        anchor.trail = null;
        routeUpdate = [anchor];
      }
      else {
        return this.getTrail(update[0], update[1]);
      }
    }
    else {
      const anchor = await this.getAnchor(update[0]);
      anchor.trail = null;

      routeUpdate = [anchor];
    }

    return routeUpdate;
  }

  public async setStart(this: Hike, point: Point): Promise<number[]> {
    const anchor = this.routePoints[0];

    if (anchor === undefined) {
      const routePoint = new RoutePoint();

      routePoint.type = 'waypoint';
      routePoint.lat = point.lat;
      routePoint.lng = point.lng;

      routePoint.sortOrder = await this.getSortOrder(-1, 0);

      this.routePoints.push(routePoint);
      await this.related('routePoints').save(routePoint);
    }
    else {
      anchor.lat = point.lat;
      anchor.lng = point.lng;

      let nextAnchorIndex = this.findNextWaypointIndex(0);

      if (nextAnchorIndex !== null) {
        const nextAnchorId = this.routePoints[nextAnchorIndex].id;

        await this.findRouteBetweenWaypoints([0, nextAnchorIndex]);

        nextAnchorIndex = this.routePoints.findIndex((p) => p.id === nextAnchorId);

        return [0, nextAnchorIndex];
      }

      const trailInfo = await Router.getTrailFromPoint(point);

      this.routePoints[0].lat = trailInfo.point.lat;
      this.routePoints[0].lng = trailInfo.point.lng;
    }

    return [0];
  }

  public async setEnd(this: Hike, point: Point): Promise<number[]> {
    const anchor = this.routePoints[this.routePoints.length - 1];

    // If there is only one anchor then it must be the start
    // so add a new end anchor.
    if (anchor === undefined || this.routePoints.length === 1) {
      const routePoint = new RoutePoint();

      routePoint.type = 'waypoint';
      routePoint.lat = point.lat;
      routePoint.lng = point.lng;

      routePoint.sortOrder = await this.getSortOrder(
        this.routePoints.length - 1, this.routePoints.length,
      );

      this.routePoints.push(routePoint);
      await this.related('routePoints').save(routePoint);
    }
    else {
      anchor.lat = point.lat;
      anchor.lng = point.lng;

      let prevAnchorIndex = this.findPrevWaypointIndex(this.routePoints.length - 1);

      if (prevAnchorIndex !== null) {
        const prevAnchorId = this.routePoints[prevAnchorIndex].id;

        await this.findRouteBetweenWaypoints([prevAnchorIndex, this.routePoints.length - 1]);

        prevAnchorIndex = this.routePoints.findIndex((p) => p.id === prevAnchorId);

        return [prevAnchorIndex, this.routePoints.length - 1];
      }

      const trailInfo = await Router.getTrailFromPoint(point);

      this.routePoints[0].lat = trailInfo.point.lat;
      this.routePoints[0].lng = trailInfo.point.lng;
    }

    return [0];
  }

  public async addEndpoint(this: Hike, point: Point): Promise<(RoutePoint | null)[]> {
    if (this.routePoints.length === 0) {
      return this.prepareUpdates(await this.setStart(point));
    }

    const routePoint = new RoutePoint();

    routePoint.type = 'waypoint';
    routePoint.lat = point.lat;
    routePoint.lng = point.lng;

    routePoint.sortOrder = await this.getSortOrder(this.routePoints.length - 1, -1);

    this.routePoints.push(routePoint);
    await this.related('routePoints').save(routePoint);

    const prevAnchorId = this.routePoints[this.routePoints.length - 2].id;
    const waypointId = this.routePoints[this.routePoints.length - 1].id;

    await this.findRouteBetweenWaypoints(
      [this.routePoints.length - 2, this.routePoints.length - 1],
    );

    const prevWaypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === prevAnchorId);
    const waypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === waypointId);

    return this.prepareUpdates([prevWaypointIndex, waypointIndex]);
  }

  private static nearestSegmentFind(lat: number, lng: number, segments: Point[]) {
    let closestIndex = -1;
    let closestDistance = 0;

    if (segments.length > 1) {
      let k = 0;

      closestDistance = Router.haversineGreatCircleDistance(
        lat, lng, segments[k].lat, segments[k].lng,
      );
      closestIndex = k;

      for (k += 1; k < segments.length - 1; k += 1) {
        const d = Router.haversineGreatCircleDistance(
          lat, lng, segments[k].lat, segments[k].lng,
        );

        if (d < closestDistance) {
          closestDistance = d;
          closestIndex = k;
        }
      }
    }

    return [closestIndex, closestDistance];
  }

  private findNearestWaypoint(this: Hike, point: Point) {
    let closestDistance: number | null = null;
    let waypointIndex: number | null = null;
    let closestAnchorIndex: number | null = null;

    for (let i = 0; i < this.routePoints.length - 1; i += 1) {
      const anchor = this.routePoints[i];

      if (!anchor.trail) {
        throw (new Error(`trail not loaded for anchor ${anchor.id}`));
      }

      if (anchor.type !== null) {
        waypointIndex = i;
      }

      const [s, distance] = Hike.nearestSegmentFind(point.lat, point.lng, anchor.trail);

      if (s > -1 && (closestDistance === null || distance < closestDistance)) {
        closestDistance = distance;
        closestAnchorIndex = waypointIndex;
      }
    }

    return closestAnchorIndex;
  }

  public async addWaypoint(this: Hike, point: Point): Promise<(RoutePoint | null)[]> {
    if (this.routePoints.length === 0) {
      return this.prepareUpdates(await this.setStart(point));
    }

    if (this.routePoints.length === 1) {
      return this.prepareUpdates(await this.setEnd(point));
    }

    // Determine if the point is on the route already
    const trailInfo = await Router.getTrailFromPoint(point);

    let bestPrevAnchorKey: number | null = null;
    let bestNextAnchorKey: number | null = null;

    if (trailInfo !== null) {
      this.routePoints
        .some((_, index) => {
          if (index < this.routePoints.length - 1) {
            if (Hike.edgeFractionBetweenAnchors(
              trailInfo.line_id,
              trailInfo.fraction,
              this.routePoints[index],
              this.routePoints[index + 1],
            )) {
              bestPrevAnchorKey = index;
              bestNextAnchorKey = index + 1;

              return true;
            }
          }

          return false;
        });
    }

    if (bestPrevAnchorKey !== null && bestNextAnchorKey !== null) {
      // The point is on the route. Insert the anchor into the array of anchors.

      const routePoint = new RoutePoint();

      routePoint.type = 'waypoint';
      routePoint.lat = trailInfo.point.lat;
      routePoint.lng = trailInfo.point.lng;
      routePoint.prevLineId = trailInfo.line_id;
      routePoint.prevFraction = trailInfo.fraction;
      routePoint.nextLineId = trailInfo.line_id;
      routePoint.nextFraction = trailInfo.fraction;

      routePoint.sortOrder = await this.getSortOrder(bestPrevAnchorKey, bestNextAnchorKey);

      this.routePoints.splice(bestPrevAnchorKey + 1, 0, routePoint);
      await this.related('routePoints').save(routePoint);

      return this.prepareUpdates([bestPrevAnchorKey, bestNextAnchorKey + 1]);
    }

    let prevWaypointIndex = this.findNearestWaypoint(point);

    if (prevWaypointIndex === null) {
      throw (new Error('prevWaypointIndex unexpectedly null'));
    }

    let nextWaypointIndex = this.findNextWaypointIndex(prevWaypointIndex);

    if (nextWaypointIndex === null) {
      throw (new Error('nextWaypointIndex unexpectadly null'));
    }

    const routePoint = new RoutePoint();

    routePoint.type = 'waypoint';
    routePoint.lat = point.lat;
    routePoint.lng = point.lng;

    routePoint.sortOrder = await this.getSortOrder(prevWaypointIndex, nextWaypointIndex);

    const waypointIndex = prevWaypointIndex + 1;
    this.routePoints.splice(waypointIndex, 0, routePoint);
    await this.related('routePoints').save(routePoint);

    // Increment the next waypoint index because the insertion of the waypoint
    // into the collection
    nextWaypointIndex += 1;

    const prevWaypointId = this.routePoints[prevWaypointIndex].id;
    const nextWaypointId = this.routePoints[nextWaypointIndex].id;

    await this.findRouteBetweenWaypoints([prevWaypointIndex, waypointIndex, nextWaypointIndex]);

    prevWaypointIndex = this.routePoints.findIndex((p) => p.id === prevWaypointId);
    nextWaypointIndex = this.routePoints.findIndex((p) => p.id === nextWaypointId);

    return this.prepareUpdates([prevWaypointIndex, nextWaypointIndex]);
  }

  public assignDistances(
    startAnchorIndex = 0,
    endAnchorIndex: number = this.routePoints.length - 1,
  ) : void {
    if (this.routePoints === null) {
      throw (new Error('Hike.routePoints is null'));
    }

    let distance = 0;
    for (let a = startAnchorIndex; a < endAnchorIndex; a += 1) {
      if (a > 0) {
        distance += this.routePoints[a - 1].trailLength;
      }

      this.routePoints[a].distance = distance;
    }
  }

  private findPrevAnchorIndex(startIndex: number): number {
    if (this.routePoints.length >= 2) {
      for (let i = startIndex - 1; i >= 0; i -= 1) {
        if (this.routePoints[i].type !== null) {
          return i;
        }
      }
    }

    return -1;
  }

  private findNextAnchorIndex(startIndex: number): number {
    if (this.routePoints.length >= 2) {
      for (let i = startIndex + 1; i < this.routePoints.length; i += 1) {
        if (this.routePoints[i].type !== null) {
          return i;
        }
      }
    }

    return -1;
  }

  public deleteWaypoint(waypointId: number): Promise<RoutePoint[]> {
    const waypointIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === waypointId);

    if (waypointIndex === -1) {
      throw (new Error(`Index for waypoint not found ${waypointId}`));
    }

    let prevAnchorIndex = this.findPrevAnchorIndex(waypointIndex);
    let nextAnchorIndex = this.findNextAnchorIndex(waypointIndex);

    // Delete the anchor
    this.routePoints[waypointIndex].delete();
    this.routePoints.splice(waypointIndex, 1);

    if (prevAnchorIndex === -1) {
      if (nextAnchorIndex === -1) {
        return this.prepareUpdates([-1, -1]);
      }

      nextAnchorIndex -= 1;

      // Delete any "soft" anchors before the next anchor.
      for (let i = 0; i < nextAnchorIndex; i += 1) {
        this.routePoints[i].delete();
      }

      this.routePoints.splice(0, nextAnchorIndex);

      return this.prepareUpdates([-1, 0]);
    }

    if (nextAnchorIndex === -1) {
      // Delete any "soft" anchors after this anchor.
      for (let i = prevAnchorIndex + 1; i < this.routePoints.length; i += 1) {
        this.routePoints[i].delete();
      }

      this.routePoints.splice(prevAnchorIndex + 1);

      return this.prepareUpdates([prevAnchorIndex, -1]);
    }

    nextAnchorIndex -= 1;

    const prevAnchorId = this.routePoints[prevAnchorIndex].id;
    const nextAnchorId = this.routePoints[nextAnchorIndex].id;

    this.findRouteBetweenWaypoints([prevAnchorIndex, nextAnchorIndex]);

    prevAnchorIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === prevAnchorId);
    nextAnchorIndex = this.routePoints.findIndex((p: RoutePoint) => p.id === nextAnchorId);

    return this.prepareUpdates([prevAnchorIndex, nextAnchorIndex]);
  }
}
