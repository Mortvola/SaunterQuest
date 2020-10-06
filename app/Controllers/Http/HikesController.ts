import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Hike from 'App/Models/Hike';

export default class HikesController {
  public async get({ auth, response }: HttpContextContract) {
    if (auth.user) {
      const hikes = await auth.user.related('hikes').query();

      response.send(hikes);
    }
  }

  public async addHike({ auth, request, response }: HttpContextContract) {
    if (auth.user) {
      const name = request.input('name');

      const hike = await Hike.create({
        userId: auth.user.id,
        name,
      });

      hike.save ();

      response.send(hike);
    }
  }

  public async getDetails ({ auth, params, response }: HttpContextContract) {
    if (auth.user) {
      const hike = await Hike.findByOrFail('id', params.hikeId);

      if (hike) {
        response.header('content-type', 'application/json');
        response.send(JSON.stringify({
          duration: await hike.getDuration(),
          distance: await hike.getDistance(),
        }));
      }
    }
  }

}
