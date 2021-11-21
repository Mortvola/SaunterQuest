// eslint-disable-next-line import/no-unresolved
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Hike from 'App/Models/Hike';

export default class HikesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const hikes = await auth.user.related('hikes').query();

      response.send(hikes);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async addHike({ auth, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      auth.user.hikeCounter = (auth.user.hikeCounter ?? 0) + 1;
      auth.user.save();

      const hike = await Hike.create({
        userId: auth.user.id,
        name: `Hike #${auth.user.hikeCounter}`,
      });

      hike.save();

      response.send(hike);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async getDetails({ auth, params, response }: HttpContextContract) : Promise<void> {
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

  // eslint-disable-next-line class-methods-use-this
  public async update({
    auth,
    params,
    request,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const hike = await Hike.findByOrFail('id', params.hikeId);

      if (hike) {
        const update = request.body();

        hike.name = update.name;
        hike.save();
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async delete({
    auth,
    params,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const hike = await Hike.findByOrFail('id', params.hikeId);

      if (hike) {
        hike.delete();
      }
    }
  }
}
