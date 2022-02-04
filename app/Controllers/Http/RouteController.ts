import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';
import Hike from 'App/Models/Hike';
import RoutePoint from 'App/Models/RoutePoint';
import Point from 'App/Types/Point';
import { RouteUpdateResponse } from 'common/ResponseTypes';

export default class RouteController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ params }: HttpContextContract) : Promise<RoutePoint[]> {
    const hike = await Hike.findOrFail(params.hikeId);

    return hike.getFullRoute();
  }

  // eslint-disable-next-line class-methods-use-this
  public async addEndPoint({
    request,
    params,
    response,
  }: HttpContextContract) : Promise<void> {
    const point = request.body() as Point;

    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(params.hikeId);
      hike.useTransaction(trx);
      await hike.load('routePoints');

      const result = hike.addEndpoint(point);

      await hike.load('schedule');

      if (hike.schedule) {
        hike.schedule.update = true;
        hike.related('schedule').save(hike.schedule);
      }

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
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));
      hike.useTransaction(trx);
      await hike.load('routePoints');
      await hike.loadTrails();

      const result = hike.addWaypoint(point);

      await hike.load('schedule');

      if (hike.schedule) {
        hike.schedule.update = true;
        hike.related('schedule').save(hike.schedule);
      }

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
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));
      hike.useTransaction(trx);
      await hike.load('routePoints');

      const result = hike.updateWaypointPosition(parseInt(params.waypointId, 10), point);

      await hike.load('schedule');

      if (hike.schedule) {
        hike.schedule.update = true;
        hike.related('schedule').save(hike.schedule);
      }

      return result;
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteWaypoint({ params }: HttpContextContract): Promise<RouteUpdateResponse> {
    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));
      hike.useTransaction(trx);
      await hike.load('routePoints');

      const result = hike.deleteWaypoint(parseInt(params.waypointId, 10));

      await hike.load('schedule');

      if (hike.schedule) {
        hike.schedule.update = true;
        hike.related('schedule').save(hike.schedule);
      }

      return result;
    });

    return updates;
  }
}
