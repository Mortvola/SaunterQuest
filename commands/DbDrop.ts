import { BaseCommand } from '@adonisjs/core/build/standalone'
import * as pgtools from "pgtools";

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
};

const dropDb = async () =>
  await new Promise<any>((resolve, reject) => {
    pgtools.dropdb(config, process.env.DB_NAME, (err, res) => {
      if (res) {
        resolve(res);
      }
      if (err) {
        reject(err);
      }
    });
  });

export default class DbDrop extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'db:drop'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Drop database'

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

  public async run() {
    try {
      const res = await dropDb();
      this.logger.info(res.command);
    } catch (err) {
      this.logger.error(err);
    }
  }
}
