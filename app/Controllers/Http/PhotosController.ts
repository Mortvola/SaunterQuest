import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import sharp from 'sharp';
import { extname } from 'path';
import heicConvert from 'heic-convert';
import raw from 'raw-body';
import Photo from 'App/Models/Photo';
import BlogPost from 'App/Models/BlogPost';

const smallWidth = 1280;

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
      .where('user_id', user.id)
      .andWhere('deleted', false);

    return results.map((r) => r.id);
  }

  private static async saveScaledImages(userId: number, id: number, photo: Buffer) {
    const smaller = await sharp(photo).resize(smallWidth).jpeg().toBuffer();

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

    // Get the raw data from the request.
    let photo = await raw(request.request);

    if (photo.length === 0) {
      throw new Error('no image data');
    }

    const trx = await Database.transaction();

    const [{ id }] = await trx.insertQuery()
      .table('photos')
      .returning('id')
      .insert({
        user_id: user.id,
      });

    // Determine the image type from the data
    const fileTypeFromBuffer= (await import('file-type-cjs')).fromBuffer;

    const fileType = await fileTypeFromBuffer(photo);

    if (!fileType) {
      throw new Exception('unknown file type');
    }

    switch (fileType.mime) {
      case 'image/tiff': {
        Drive.put(`./photos/${user.id}/${id}_original.tiff`, photo);

        break;
      }

      case 'image/heic':
        Drive.put(`./photos/${user.id}/${id}_original.heic`, photo);

        photo = await heicConvert({
          buffer: photo,
          format: 'PNG',
        });
  
        break;

      case 'image/jpeg':
        Drive.put(`./photos/${user.id}/${id}_original.jpg`, photo);

        break;

      case 'image/png':
        Drive.put(`./photos/${user.id}/${id}_original.png`, photo);

        break;

      default:
        throw new Exception(`unuspported image type: ${fileType ? fileType.mime : 'unknown'}`);
    }

    await PhotosController.saveScaledImages(user.id, id, photo);

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

  // eslint-disable-next-line class-methods-use-this
  public async deletePhoto({
    auth: {
      user,
    },
    params,
  }: HttpContextContract): Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const photoId = parseInt(params.photoId, 10);

    const posts = await BlogPost.all();

    if (posts.some((b) => {
      if (b.titlePhotoId === photoId) {
        return true;
      }

      if (b.content) {
        console.log(`post id ${b.id}`);

        return b.content.some((section) => (
          section.type === 'photo' && section.photo.id === photoId
        ));
      }

      return false;
    })) {
      throw new Exception('photo is in use', 405);
    }

    const photo = await Photo.findOrFail(params.photoId);

    photo.deleted = true;

    await photo.save();
  }

  // eslint-disable-next-line class-methods-use-this
  public async regenerate({
    auth: {
      user,
    },
    params,
  }: HttpContextContract): Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    // Find the original file for this photo id by iterating over the list of
    // supported extensions.
    let ext: string | null = null;
    for (let e of ['jpg', 'heic', 'tiff', 'png']) {
      const exists = await Drive.exists(`./photos/${user.id}/${params.photoId}_original.${e}`);
      if (exists) {
        ext = e;
        break;
      }
    }

    if (ext) {
      let photo = await Drive.get(`./photos/${user.id}/${params.photoId}_original.${ext}`);

      if (ext === 'heic') {
        photo = await heicConvert({
          buffer: photo,
          format: 'PNG',
        });
      }

      await PhotosController.saveScaledImages(user.id, params.photoId, photo);  
    }
  }
}
