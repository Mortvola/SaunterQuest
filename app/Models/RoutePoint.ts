import { DateTime } from 'luxon';
import fetch from 'node-fetch';
import {
  BaseModel, beforeFetch, column, computed,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm';
import Database from '@ioc:Adonis/Lucid/Database';
import Env from '@ioc:Adonis/Core/Env';
import Point from 'App/Types/Point';
import Router from 'App/Services/Router';

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

  public ele = 0;

  @column()
  public type: string;

  @column({ serializeAs: null })
  public prevLineId: number | null;

  @column({ serializeAs: null })
  public prevFraction: number | null;

  @column({ serializeAs: null })
  public nextLineId: number | null;

  @column({ serializeAs: null })
  public nextFraction: number | null;

  @column({ serializeAs: null })
  public hikeId: number;

  @column({ serializeAs: null })
  public sortOrder: number;

  @computed()
  public trail: Array<Point> | null;

  @computed()
  public trailLength = 0;

  @computed()
  public distance = 0;

  @beforeFetch()
  public static sortRoutePoints(query: ModelQueryBuilderContract<typeof RoutePoint>) : void {
    query.orderBy('sort_order');
  }

  public async loadTrail(this: RoutePoint, endFraction: number) : Promise<void> {
    if (this.nextLineId === null || this.nextFraction === null) {
      throw (new Error(`nextLineId or nextFraction is null: ${JSON.stringify(this)}`));
    }

    let startFraction = this.nextFraction;
    let localEndFraction = endFraction;
    let wayColumn = 'way2';

    if (startFraction > endFraction) {
      startFraction = 1 - startFraction;
      localEndFraction = 1 - endFraction;
      wayColumn = 'ST_Reverse(way2)';
    }

    const line = await Database
      .query()
      .select(Database.raw(
        `ST_AsGeoJSON(ST_Transform(ST_LineSubstring (${wayColumn}, ${startFraction}, ${localEndFraction}), 4326)) AS linestring`,
      ))
      .from('planet_osm_route')
      .where('line_id', this.nextLineId)
      .first();

    if (line) {
      const { coordinates } = JSON.parse(line.linestring);

      let distance = 0;
      this.trail = await Promise.all(coordinates
        .map(async (c: Array<number>, index: number) => {
          if (index > 0) {
            distance += Router.haversineGreatCircleDistance(
              coordinates[index - 1][1], coordinates[index - 1][0],
              c[1], c[0],
            );
          }

          return {
            lat: c[1],
            lng: c[0],
            dist: distance,
            ele: c[2],
          } as Point;
        }));

      this.trailLength = distance;
    }
  }

  public static async getElevation(lat: number, lng: number) : Promise<number | null> {
    const elevation = await fetch(`${Env.get('PATHFINDER_URL')}/elevation/point?lat=${lat}&lng=${lng}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    if (elevation) {
      return elevation.ele;
    }

    return null;
  }
}
