import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Hike from 'App/Models/Hike';

export default class RouteController {
  public async get ({ params, response }: HttpContextContract) {
    let hike = await Hike.findOrFail(params.hikeId);

    let routePoints = await hike.getFullRoute();

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(routePoints));
  }

  public async addEndPoint ({ request, params, response }: HttpContextContract) {
    const point = request.post();

    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(params.hikeId);
      hike.useTransaction(trx);
      await hike.preload('routePoints');

      return await hike.addEndpoint(point);
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }

  public async addWaypoint ({ request, params, response }: HttpContextContract) {
    const point = request.post();

    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(params.hikeId);
      hike.useTransaction(trx);
      await hike.preload('routePoints',);

      return await hike.addWaypoint(point);
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }

  public async updateWaypointPosition({ request, params, response }: HttpContextContract) {
    const point = request.post();

    const updates = await Database.transaction(async (trx) => {
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));
      hike.useTransaction(trx);
      await hike.preload('routePoints');

      return await hike.updateWaypointPosition(parseInt(params.waypointId), point);
    });

    response.header('content-type', 'application/json');
    response.send(JSON.stringify(updates));
  }
}
