import { DateTime } from 'luxon';
import { BaseModel, beforeFetch, column, computed, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm';
import Database from '@ioc:Adonis/Lucid/Database';
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

  public ele: number = 0;

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
  public trailLength: number = 0;

  @computed()
  public distance: number = 0;

  @beforeFetch()
  public static sortRoutePoints(query: ModelQueryBuilderContract<typeof RoutePoint>) {
    query.orderBy('sort_order');
  }

  public async loadTrail(this: RoutePoint, endFraction: number) {
    if (this.nextLineId === null || this.nextFraction === null) {
      throw(new Error(`nextLineId or nextFraction is null: ${JSON.stringify(this)}`));
    }

    let startFraction = this.nextFraction;
    let wayColumn = 'way';

    if (startFraction > endFraction) {
      startFraction = 1 - startFraction;
      endFraction =  1 - endFraction;
      wayColumn = 'ST_Reverse(way)';
    }

    const line = await Database
      .query()
      .select(Database.raw(
        `ST_AsGeoJSON(ST_Transform(ST_LineSubstring (${wayColumn}, ${startFraction}, ${endFraction}), 4326)) AS linestring`,
      ))
      .from('planet_osm_line')
      .where('line_id', this.nextLineId)
      .first();

    if (line) {
      const coordinates = JSON.parse(line.linestring).coordinates;

      let distance = 0;
      this.trail = coordinates.map((c: Array<number>, index: number) => {
        if (index > 0) {
          distance += Router.haversineGreatCircleDistance(
            coordinates[index - 1][1], coordinates[index - 1][0],
            c[1], c[0]);
        }

        return { lat: c[1], lng: c[0], dist: distance, ele: 0 } as Point;
      });

      this.trailLength = distance;
    }
  }
}
