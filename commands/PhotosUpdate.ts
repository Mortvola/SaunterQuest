import { BaseCommand } from '@adonisjs/core/build/standalone';
import Photo from 'App/Models/Photo';
import sharp from 'sharp';
import { DriveManagerContract } from '@ioc:Adonis/Core/Drive';
import Database from '@ioc:Adonis/Lucid/Database';

export default class PhotosRegenerate extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'photos:update';

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Updates the meta data in the photos table';

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
  };

  // eslint-disable-next-line class-methods-use-this
  private async findFile(
    userId: number, photoId: number, Drive: DriveManagerContract,
  ): Promise<string | null> {
    const path = `./photos/${userId}/${photoId}_small.webp`;
    console.log(`checking for ${path}`);
    const exists = await Drive.exists(path);
    console.log(`${path}: ${exists}`);
    if (exists) {
      return path;
    }

    return null;
  }

  public async run() {
    const { default: Drive } = await import('@ioc:Adonis/Core/Drive');

    const trx = await Database.transaction();

    try {
      const photos = await Photo.all({ client: trx });

      await Promise.all(photos.map(async (p) => {
        const path = await this.findFile(p.userId, p.id, Drive);

        if (path !== null) {
          const { width, height } = await sharp(path).metadata();

          p.width = width ?? null;
          p.height = height ?? null;

          await p.save();
        }
      }));

      await trx.commit();
    }
    catch (error) {
      await trx.rollback();
    }
  }
}
