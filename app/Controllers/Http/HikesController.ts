// eslint-disable-next-line import/no-unresolved
import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database, { RawBuilderContract } from '@ioc:Adonis/Lucid/Database';
import Hike from 'App/Models/Hike';
import Drive from '@ioc:Adonis/Core/Drive';
import { extname } from 'path';
import sharp from 'sharp';
import { HikeLegProps } from 'common/ResponseTypes';
import HikeLeg from 'App/Models/HikeLeg';
import HikerProfile from 'App/Models/HikerProfile';

export default class HikesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth: { user }, request }: HttpContextContract) : Promise<Hike[]> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    let query = user.related('hikes').query();

    const { o } = request.qs();
    if (o === 'legs') {
      query = query.preload('hikeLegs');
    }

    const hikes = await query;

    return hikes;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getHike({ auth: { user }, params }: HttpContextContract): Promise<Hike> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const hike = await Hike.findOrFail(params.hikeId);
    await hike.load('hikeLegs', (legsQuery) => legsQuery.orderBy('startDate', 'desc'));

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

  // eslint-disable-next-line class-methods-use-this
  public async uploadPhoto({
    auth: {
      user,
    },
    params,
    request,
  }: HttpContextContract): Promise<number> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const { lat, lng, data } = request.body();

    let latLng: RawBuilderContract | null = null;
    if (lat !== undefined && lng !== undefined) {
      latLng = Database.raw(`ST_Transform(ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 3857)`);
    }

    const id = await Database.insertQuery()
      .table('hike_photos')
      .returning('id')
      .insert({
        hike_id: params.hikeId,
        way: latLng,
      });

    const photo = Buffer.from(data, 'base64');

    Drive.put(`./hikes/${params.hikeId}/photos/${id[0]}_original.jpg`, photo);

    const smaller = await sharp(photo).resize(508).toBuffer();

    Drive.put(`./hikes/${params.hikeId}/photos/${id[0]}_small.jpg`, smaller);

    return id[0];
  }

  // eslint-disable-next-line class-methods-use-this
  public async getPhoto({
    auth: {
      user,
    },
    params,
    response,
  }: HttpContextContract): Promise<unknown> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const location = `./hikes/${params.hikeId}/photos/${params.photoId}_small.jpg`;

    const { size } = await Drive.getStats(location);

    response.type(extname(location));
    response.header('content-length', size);

    return response.stream(await Drive.getStream(location));
  }

  // eslint-disable-next-line class-methods-use-this
  public async updatePhoto({
    auth: {
      user,
    },
    params,
    request,
  }: HttpContextContract): Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    await Database.query()
      .update({
        transforms: JSON.stringify(request.body().transforms),
      })
      .from('hike_photos')
      .where('id', params.photoId);
  }

  // eslint-disable-next-line class-methods-use-this
  public async addLeg({
    auth: {
      user,
    },
    params,
  }: HttpContextContract): Promise<HikeLegProps> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const trx = await Database.transaction();

    const leg = await HikeLeg.create(
      { hikeId: parseInt(params.hikeId, 10) },
      { client: trx },
    );

    await leg.save();

    const defaultProfile = await user.related('hikerProfile').query().first();

    const profile = await HikerProfile.create(
      {
        startDay: 0,
        startTime: defaultProfile?.startTime ?? 8,
        endTime: defaultProfile?.endTime ?? 18,
        metersPerHour: defaultProfile?.metersPerHour ?? 4023.36,
        breakDuration: defaultProfile?.breakDuration ?? 60,
        endDayExtension: defaultProfile?.endDayExtension ?? 60,
        hikeLegId: leg.id,
      },
      { client: trx },
    );

    await profile.save();

    trx.commit();

    return {
      id: leg.id,
      name: leg.name,
      startDate: leg.startDate?.toISODate() ?? null,
    };
  }
}
