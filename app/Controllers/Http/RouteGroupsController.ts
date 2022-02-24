import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Hike from 'App/Models/Hike';
import HikeLeg from 'App/Models/HikeLeg';
import RouteGroup from 'App/Models/RouteGroup';

export default class RouteGroupsController {
  // eslint-disable-next-line class-methods-use-this
  public async get() : Promise<RouteGroup[]> {
    return RouteGroup.all();
  }

  // eslint-disable-next-line class-methods-use-this
  private static async queryRouteGroup(id: number): Promise<unknown> {
    const query = Database.query().select(
      Database.raw(`
        (select 
          ST_AsGeoJSON(ST_SwapOrdinates(ST_Transform(
            CASE
              WHEN ne1.fraction < ne2.fraction THEN ST_LineSubstring(way, ne1.fraction, ne2.fraction)
              ELSE ST_LineSubstring(way, ne2.fraction, ne1.fraction)
            END,
            4326
          ), 'xy'))::json->'coordinates'
        from planet_osm_route
        where line_id = ne1.line_id
        ) AS trail
      `),
    )
      .from('route_group_routes AS rgr')
      .join('nav_edges AS ne1', 'ne1.id', 'rgr.start_edge_id')
      .join('nav_edges AS ne2', 'ne2.id', 'rgr.end_edge_id')
      .where('route_group_id', id);

    const results = await query;

    return results.map((r) => r.trail);
  }

  // eslint-disable-next-line class-methods-use-this
  public async getRouteGroup({
    params,
  }: HttpContextContract): Promise<unknown> {
    const id = parseInt(params.id, 10);

    return RouteGroupsController.queryRouteGroup(id);
  }

  // eslint-disable-next-line class-methods-use-this
  public async getHikeLegRouteGroup({
    params,
  }: HttpContextContract): Promise<unknown> {
    const hikeLegId = parseInt(params.hikeLegId, 10);

    const hikeLeg = await HikeLeg.findOrFail(hikeLegId);
    const hike = await Hike.findOrFail(hikeLeg.hikeId);

    if (hike.routeGroupId === null) {
      throw new Exception('route group not set');
    }

    return RouteGroupsController.queryRouteGroup(hike.routeGroupId);
  }
}
