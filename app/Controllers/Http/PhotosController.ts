import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database, { RawBuilderContract } from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import sharp from 'sharp';

export default class PhotosController {
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

    const [id] = await trx.insertQuery()
      .table('photos')
      .returning('id')
      .insert({
        user_id: user.id,
      });

    const photo = Buffer.from(data, 'base64');

    Drive.put(`./photos/${user.id}/${id}_original.jpg`, photo);

    const smaller = await sharp(photo).resize(508).toBuffer();

    Drive.put(`./photos/${user.id}/${id}_small.jpg`, smaller);

    trx.commit();

    return { id };
  }
}
