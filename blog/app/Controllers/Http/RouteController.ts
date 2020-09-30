import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import RoutePoint from 'App/Models/RoutePoint';

export default class RouteController {
    public async get ({ params, response }: HttpContextContract) {
        const routePoints = await RoutePoint
            .query()
            .where('hike_id', params.hikeId)
            .orderBy('sort_order');

        response.header('content-type', 'application/json');
        response.send(JSON.stringify(routePoints));
    }
}
