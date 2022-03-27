import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import sharp from 'sharp';
import { extname } from 'path';

export default class PhotosController {
  // eslint-disable-next-line class-methods-use-this
  public async getPhotoList({
    auth: {
      user,
    },
  }: HttpContextContract): Promise<number[]> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const results = await Database.query()
      .select('id')
      .from('photos')
      .where('user_id', user.id);

    return results.map((r) => r.id);
  }

  // eslint-disable-next-line class-methods-use-this
  public async upload({
    auth: {
      user,
    },
    request,
  }: HttpContextContract): Promise<{ id: number }> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const { data } = request.body();

    const trx = await Database.transaction();

    const [{ id }] = await trx.insertQuery()
      .table('photos')
      .returning('id')
      .insert({
        user_id: user.id,
      });

    const photo = Buffer.from(data, 'base64');

    Drive.put(`./photos/${user.id}/${id}_original.jpg`, photo);

    const smaller = await sharp(photo).resize(1000).toBuffer();

    Drive.put(`./photos/${user.id}/${id}_small.jpg`, smaller);

    trx.commit();

    return { id };
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

    const location = `./photos/${user.id}/${params.photoId}_small.jpg`;

    const { size } = await Drive.getStats(location);

    response.type(extname(location));
    response.header('content-length', size);

    return response.stream(await Drive.getStream(location));
  }
}
