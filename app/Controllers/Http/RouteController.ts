import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Hike from 'App/Models/Hike';
import Point from 'App/Types/Point';

export default class RouteController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ params, response }: HttpContextContract) : Promise<void> {
    const hike = await Hike.findOrFail(params.hikeId);

    const routePoints = await hike.getFullRoute();

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(routePoints));
  }

  // eslint-disable-next-line class-methods-use-this
  public async addEndPoint({
    request,
    params,
    response,
  }: HttpContextContract) : Promise<void> {
    const point = request.post() as Point;

    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(params.hikeId);
      hike.useTransaction(trx);
      await hike.preload('routePoints');

      return hike.addEndpoint(point);
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
    const point = request.post() as Point;

    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));
      hike.useTransaction(trx);
      await hike.preload('routePoints');
      await hike.loadTrails();

      return hike.addWaypoint(point);
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
    const point = request.post() as Point;

    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));
      hike.useTransaction(trx);
      await hike.preload('routePoints');

      const result = hike.updateWaypointPosition(parseInt(params.waypointId, 10), point);

      await hike.preload('schedule');

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
  public async deleteWaypoint({ params, response }: HttpContextContract): Promise<void> {
    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));
      hike.useTransaction(trx);
      await hike.preload('routePoints');

      return hike.deleteWaypoint(parseInt(params.waypointId, 10));
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }
}
