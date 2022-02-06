import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';
import Hike from 'App/Models/Hike';
import HikeLeg from 'App/Models/HikeLeg';
import RoutePoint from 'App/Models/RoutePoint';
import Point from 'App/Types/Point';
import { RouteUpdateResponse } from 'common/ResponseTypes';

export default class RouteController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ params }: HttpContextContract) : Promise<RoutePoint[]> {
    const leg = await HikeLeg.findOrFail(params.hikeLegId);

    return leg.getFullRoute();
  }

  // eslint-disable-next-line class-methods-use-this
  public async addEndPoint({
    request,
    params,
    response,
  }: HttpContextContract) : Promise<void> {
    const point = request.body() as Point;

    const updates = await Database.transaction(async (trx) => {
      const leg = await HikeLeg.findOrFail(params.hikeLegId);
      const hike = await Hike.findOrFail(leg.hikeId);

      leg.useTransaction(trx);
      await leg.load('routePoints');

      const result = leg.addEndpoint(hike.routeGroupId, point);

      await RouteController.markScheduleDirty(leg);

      return result;
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }

  // eslint-disable-next-line class-methods-use-this
  public async addWaypoint({
    request,
    params,
    response,
  }: HttpContextContract) : Promise<void> {
    const point = request.body() as Point;

    const updates = await Database.transaction(async (trx) => {
      const leg = await HikeLeg.findOrFail(parseInt(params.hikeLegId, 10));
      const hike = await Hike.findOrFail(leg.hikeId);

      leg.useTransaction(trx);
      await leg.load('routePoints');
      await leg.loadTrails();

      const result = leg.addWaypoint(hike.routeGroupId, point);

      await RouteController.markScheduleDirty(leg);

      return result;
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }

  // eslint-disable-next-line class-methods-use-this
  public async updateWaypointPosition({
    request,
    params,
    response,
  }: HttpContextContract) : Promise<void> {
    const point = request.body() as Point;

    const updates = await Database.transaction(async (trx) => {
      const leg = await HikeLeg.findOrFail(parseInt(params.hikeLegId, 10));
      const hike = await Hike.findOrFail(leg.hikeId);

      leg.useTransaction(trx);
      await leg.load('routePoints');

      const result = leg.updateWaypointPosition(
        hike.routeGroupId, parseInt(params.waypointId, 10), point,
      );

      await RouteController.markScheduleDirty(leg);

      return result;
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteWaypoint({ params }: HttpContextContract): Promise<RouteUpdateResponse> {
    const updates = await Database.transaction(async (trx) => {
      const leg = await HikeLeg.findOrFail(parseInt(params.hikeLegId, 10));
      const hike = await Hike.findOrFail(leg.hikeId);

      leg.useTransaction(trx);
      await leg.load('routePoints');

      const result = leg.deleteWaypoint(hike.routeGroupId, parseInt(params.waypointId, 10));

      await RouteController.markScheduleDirty(leg);

      return result;
    });

    return updates;
  }

  private static async markScheduleDirty(hikeLeg: HikeLeg) {
    await hikeLeg.load('schedule');

    if (hikeLeg.schedule) {
      hikeLeg.schedule.update = true;
      await hikeLeg.related('schedule').save(hikeLeg.schedule);
    }
  }
}
