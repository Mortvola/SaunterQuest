import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import sharp from 'sharp';
import { extname } from 'path';
import heicConvert from 'heic-convert';

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

  private static async savePhoto(userId: number, id: number, photo: Buffer) {
    Drive.put(`./photos/${userId}/${id}_original.jpg`, photo);

    const smaller = await sharp(photo).resize(1000).toBuffer();

    Drive.put(`./photos/${userId}/${id}_small.jpg`, smaller);
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

    let photo = Buffer.from(data, 'base64');

    const fileTypeFromBuffer= (await import('file-type-cjs')).fromBuffer;

    const fileType = await fileTypeFromBuffer(photo);

    if (!fileType) {
      throw new Exception('unknown file type');
    }

    switch (fileType.mime) {
      case 'image/heic':
        photo = await heicConvert({
          buffer: photo,
          format: 'JPEG',
          quality: 1,
        });
  
        break;

      case 'image/jpeg':
        break;

      default:
        throw new Exception(`unuspported image type: ${fileType ? fileType.mime : 'unknown'}`);
    }

    await PhotosController.savePhoto(user.id, id, photo);
  
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
