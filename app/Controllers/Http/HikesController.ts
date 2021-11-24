// eslint-disable-next-line import/no-unresolved
import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Hike from 'App/Models/Hike';

export default class HikesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth: { user } }: HttpContextContract) : Promise<Hike[]> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const hikes = await user.related('hikes').query();

    return hikes;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getHike({ auth: { user }, params }: HttpContextContract): Promise<Hike> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const hike = await Hike.findOrFail(params.hikeId);

    return hike;
  }

  // eslint-disable-next-line class-methods-use-this
  public async addHike({ auth: { user } }: HttpContextContract) : Promise<Hike> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    user.hikeCounter = (user.hikeCounter ?? 0) + 1;
    user.save();

    const hike = await Hike.create({
      userId: user.id,
      name: `Hike #${user.hikeCounter}`,
    });

    hike.save();

    return hike;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getDetails({
    auth: {
      user,
    },
    params,
  }: HttpContextContract) : Promise<{ duration: number, distance: number }> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const hike = await Hike.findByOrFail('id', params.hikeId);

    return {
      duration: await hike.getDuration(),
      distance: await hike.getDistance(),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  public async update({
    auth: {
      user,
    },
    params,
    request,
  }: HttpContextContract) : Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const hike = await Hike.findByOrFail('id', params.hikeId);

    if (hike) {
      const update = request.body();

      hike.name = update.name;
      hike.routeGroupId = update.routeGroupId;
      hike.save();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async delete({
    auth: {
      user,
    },
    params,
  }: HttpContextContract) : Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const hike = await Hike.findByOrFail('id', params.hikeId);

    if (hike) {
      hike.delete();
    }
  }
}
