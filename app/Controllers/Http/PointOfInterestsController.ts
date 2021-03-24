import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PointOfInterest from 'App/Models/PointOfInterest';

export default class PointsOfInterestsController {
  // eslint-disable-next-line class-methods-use-this
  public async get({
    auth, params, response,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const poi = await PointOfInterest.query().where('hike_id', params.hikeId);

      response.send(poi);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async add({
    auth, request, params, response,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const poi = await PointOfInterest.create({
        name: request.post().name,
        description: request.post().description,
        hikeId: params.hikeId,
        type: request.post().type,
        lat: request.post().lat,
        lng: request.post().lng,
      });

      response.send(poi);
    }
  }
}
