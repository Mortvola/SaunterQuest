import { BaseCommand } from '@adonisjs/core/build/standalone'
import Photo from 'App/Models/Photo';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import { extname } from 'path';
import { DriveManagerContract } from '@ioc:Adonis/Core/Drive';

const smallWidth = 1280;

export default class PhotosRegenerate extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'photos:regenerate'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Regenerate the scaled down photos from the originals';

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest` 
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call 
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  }

  private async findFile(userId: number, photoId: number, Drive: DriveManagerContract): Promise<string | null> {
    const tests = ['jpg', 'heic', 'tiff', 'png'].map(async (e) => {
      const path = `./photos/${userId}/${photoId}_original.${e}`;
      console.log(`checking for ${path}`);
      const exists = await Drive.exists(path);
      console.log(`${path}: ${exists}`);
      if (exists) {
        return path;
      }

      return null;
    });

    const r = await Promise.all(tests); // .any(tests);

    const p = r.find((r2) => r2 !== null);

    return p ?? null;
  }

  private static async saveScaledImages(photo: Photo, data: Buffer) {
    try {
      const path = `./photos/${photo.userId}/${photo.id}_small.webp`;

      await sharp(data)
        .rotate(photo.orientation ?? 0)
        .resize(smallWidth)
        .webp()
        .toFile(path);

      await sharp(data)
        .rotate(photo.orientation ?? 0)
        .resize(320)
        .blur(4)
        .webp()
        .toFile(`./photos/${photo.userId}/${photo.id}_thumb.webp`);
    }
    catch(error) {
      console.log(error.message);
    }
  }

  private static async loadPhotoData(path: string, Drive: DriveManagerContract): Promise<Buffer | null> {
    console.log(`loading data for ${path}`);
    let data: Buffer | null = null;

    try {
      console.log(`Drive.get ${path}`);

      // data = await Drive.get(path);
      data = await Drive.get(path);

      console.log(`finished Drive.get ${path}`);
    }
    catch(error) {
      console.log(error.message);
    }

    console.log(`checking for heic: ${path}`)
    const ext = extname(path);
    if (data && ext === '.heic') {
      console.log(`file is heic: ${path}`);

      try {
        data = await heicConvert({
          buffer: data,
          format: 'PNG',
        });  
      }
      catch(error) {
        data = null;
        console.log(`heic conversion failed: ${path}`);
      }
    }

    return data;
  }

  public async run() {
    const { default: Drive } = await import('@ioc:Adonis/Core/Drive');

    const photos = await Photo.all();

    await Promise.all(photos.map(async (p) => {
      const path = await this.findFile(p.userId, p.id, Drive);

      if (path !== null) {
        const data = await PhotosRegenerate.loadPhotoData(path, Drive);

        if (data) {
          await PhotosRegenerate.saveScaledImages(p, data);
        }
      }
    }));
  }
}
