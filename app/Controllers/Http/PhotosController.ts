import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema } from '@ioc:Adonis/Core/Validator';
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
      .andWhere('deleted', false)
      .orderBy('created_at', 'desc');

    return results.map((r) => r.id);
  }

  private static async saveScaledImages(photo: Photo, data: Buffer) {
    try {
      await sharp(data)
        .rotate(photo.orientation ?? 0)
        .resize(smallWidth)
        .webp()
        .toFile(`./photos/${photo.userId}/${photo.id}_small.webp`);

      await sharp(data)
        .rotate(photo.orientation ?? 0)
        .resize(320)
        .blur(4)
        .webp()
        .toFile(`./photos/${photo.userId}/${photo.id}_thumb.webp`);
    }
    catch (error) {
      console.log(error.message);
    }
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
    let data = await raw(request.request);

    if (data.length === 0) {
      throw new Error('no image data');
    }

    const trx = await Database.transaction();

    const photo = await Photo.create(
      {
        userId: user.id,
      },
      { client: trx },
    );

    // Determine the image type from the data
    const fileTypeFromBuffer = (await import('file-type-cjs')).fromBuffer;

    const fileType = await fileTypeFromBuffer(data);

    if (!fileType) {
      throw new Exception('unknown file type');
    }

    switch (fileType.mime) {
      case 'image/tiff':
      case 'image/x-sony-arw': {
        Drive.put(`./photos/${user.id}/${photo.id}_original.tiff`, data);

        break;
      }

      case 'image/heic':
        Drive.put(`./photos/${user.id}/${photo.id}_original.heic`, data);

        data = await heicConvert({
          buffer: data,
          format: 'PNG',
        });

        break;

      case 'image/jpeg':
        Drive.put(`./photos/${user.id}/${photo.id}_original.jpg`, data);

        break;

      case 'image/png':
        Drive.put(`./photos/${user.id}/${photo.id}_original.png`, data);

        break;

      default:
        throw new Exception(`unuspported image type: ${fileType ? fileType.mime : 'unknown'}`);
    }

    await PhotosController.saveScaledImages(photo, data);

    const { id } = photo;

    trx.commit();

    return { id };
  }

  // eslint-disable-next-line class-methods-use-this
  public async getPhoto({
    auth: {
      user,
    },
    params,
    request,
    response,
  }: HttpContextContract): Promise<unknown> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    let location = `./photos/${user.id}/${params.photoId}_small.webp`;

    const { size: photoSize } = request.qs();

    if (photoSize === 'thumb') {
      location = `./photos/${user.id}/${params.photoId}_thumb.webp`;
    }

    const stats = await Drive.getStats(location);
    const { size } = stats;

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
  public async process({
    auth: {
      user,
    },
    request,
    params,
  }: HttpContextContract): Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const requestDetails = await request.validate({
      schema: schema.create({
        command: schema.enum(['rotate-right', 'rotate-left'] as const),
      }),
    });

    const trx = await Database.transaction();

    const photo = await Photo.findOrFail(params.photoId, { client: trx });

    // Find the original file for this photo id by iterating over the list of
    // supported extensions.
    let ext: string | null = null;
    // eslint-disable-next-line no-restricted-syntax
    for (const e of ['jpg', 'heic', 'tiff', 'png']) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await Drive.exists(`./photos/${user.id}/${params.photoId}_original.${e}`);
      if (exists) {
        ext = e;
        break;
      }
    }

    if (ext) {
      let data = await Drive.get(`./photos/${user.id}/${params.photoId}_original.${ext}`);

      if (ext === 'heic') {
        data = await heicConvert({
          buffer: data,
          format: 'PNG',
        });
      }

      switch (requestDetails.command) {
        case 'rotate-right': {
          photo.orientation = (photo.orientation ?? 0) + 90;

          if (photo.orientation === 360) {
            photo.orientation = 0;
          }

          photo.save();

          break;
        }

        case 'rotate-left': {
          photo.orientation = (photo.orientation ?? 0) - 90;

          if (photo.orientation < 0) {
            photo.orientation = 360 + photo.orientation;
          }

          photo.save();

          break;
        }

        default: {
          throw new Exception('invalid command');
        }
      }

      await PhotosController.saveScaledImages(photo, data);

      trx.commit();
    }
  }
}
